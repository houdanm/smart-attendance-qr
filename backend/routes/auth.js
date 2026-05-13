const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ─── REGISTER ROUTE ───
// Creates a new user account (student or instructor)
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, subject } = req.body;

  // ── Server-side Validation ──

  // Check all required fields are provided
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password is at least 6 characters
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Validate role is either student or instructor
  if (!['student', 'instructor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Check if email already exists in database
    const [existing] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Return error if email is already registered
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    // Hash the password before saving to database
    // 10 = salt rounds (higher = more secure but slower)
    const hashed = await bcrypt.hash(password, 10);

    // Insert new user into database
    // subject is only for instructors, null for students
    await db.query(
      'INSERT INTO users (name, email, password, role, subject) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, subject || null]
    );

    // Return success message
    res.json({ message: 'User registered successfully' });

  } catch (err) {
    // Return error if something goes wrong
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN ROUTE ───
// Authenticates user and returns JWT token
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check all required fields are provided
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email in database
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Return error if user not found
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Compare provided password with hashed password in database
    const match = await bcrypt.compare(password, user.password);

    // Return error if password doesn't match
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token with user info
    // Token expires in 1 day
    const token = jwt.sign(
      {
        id: user.id,          // User ID
        role: user.role,      // student or instructor
        name: user.name,      // Full name
        subject: user.subject // Subject (instructors only)
      },
      process.env.JWT_SECRET, // Secret key from .env file
      { expiresIn: '1d' }     // Token expires in 1 day
    );

    // Return token and user info to client
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        subject: user.subject  // Include subject for instructor QR generation
      }
    });

  } catch (err) {
    // Return error if something goes wrong
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;