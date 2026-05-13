// ─── IMPORTS ───
const express = require('express');
const router = express.Router();
const multer = require('multer');  // For handling file uploads
const path = require('path');      // For file path operations
const jwt = require('jsonwebtoken');
const db = require('../db');

// ─────────────────────────────────────────
// MIDDLEWARE — VERIFY TOKEN
// ─────────────────────────────────────────
// Checks if request has valid JWT token
function verifyToken(req, res, next) {
  // Get token from Authorization header
  const token = req.headers['authorization']?.split(' ')[1];

  // Return error if no token
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // Verify and decode token
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Continue to route
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────
// MULTER CONFIGURATION
// Handles how uploaded files are stored
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  // Set upload destination folder
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to uploads folder
  },

  // Set filename format
  // Example: profile-123-1775943987275.jpg
  filename: (req, file, cb) => {
    const uniqueName = `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// ── File Filter ──
// Only allow image files
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept file
  } else {
    cb(new Error('Only image files are allowed!'), false); // Reject file
  }
};

// ── Create multer upload instance ──
const upload = multer({
  storage,           // Use disk storage config above
  fileFilter,        // Use file filter above
  limits: {
    fileSize: 5 * 1024 * 1024 // Max file size: 5MB
  }
});

// ─────────────────────────────────────────
// ROUTE 1 — UPLOAD PROFILE PICTURE
// POST /api/profile/upload
// Called when user selects a new photo
// ─────────────────────────────────────────
router.post('/upload', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Build the URL path for the uploaded file
    // Example: /uploads/profile-123-1775943987275.jpg
    const photoUrl = `/uploads/${req.file.filename}`;

    // Save photo URL to database
    await db.query(
      'UPDATE users SET photo = ? WHERE id = ?',
      [photoUrl, req.user.id]
    );

    // Return success with photo URL
    res.json({
      message: 'Profile picture updated successfully',
      photo: photoUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 2 — GET PROFILE INFO
// GET /api/profile/me
// Called to get current user's profile
// ─────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Get user info from database
    // Don't return password for security
    const [rows] = await db.query(
      `SELECT id, name, email, role, subject, photo 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    // Return error if user not found
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user profile data
    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 3 — UPDATE PROFILE NAME
// PUT /api/profile/update
// Called when user updates their name
// ─────────────────────────────────────────
router.put('/update', verifyToken, async (req, res) => {
  // Get new name from request body
  const { name } = req.body;

  // Validate name is provided
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Update name in database
    await db.query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, req.user.id]
    );

    // Return success message
    res.json({ message: 'Profile updated successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPORT ROUTER ───
module.exports = router;