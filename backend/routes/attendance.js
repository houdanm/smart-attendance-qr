// ─── IMPORTS ───
const express = require('express');
const router = express.Router();
const db = require('../db');         // MySQL database connection
const jwt = require('jsonwebtoken'); // JWT for token verification

// ─────────────────────────────────────────
// MIDDLEWARE — VERIFY TOKEN
// ─────────────────────────────────────────
// This runs before any protected route
// Checks if the request has a valid JWT token
function verifyToken(req, res, next) {
  // Get token from Authorization header
  // Header format: "Bearer eyJhbGci..."
  const token = req.headers['authorization']?.split(' ')[1];

  // Return error if no token provided
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // Verify token using secret key from .env
    // This also checks if token has expired
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    // Token is valid - continue to next function
    next();
  } catch {
    // Token is invalid or expired
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────
// ROUTE 1 — SCAN QR CODE
// POST /api/attendance/scan
// Called when student scans QR code
// Now includes GPS coordinates
// ─────────────────────────────────────────
router.post('/scan', verifyToken, async (req, res) => {
  // Get all data from request body
  const {
    qr_code,     // Full QR code value
    subject,     // Subject name extracted from QR
    room,        // Room number extracted from QR
    student_lat, // Student GPS latitude (optional)
    student_lon  // Student GPS longitude (optional)
  } = req.body;

  // Get student ID from verified token
  const student_id = req.user.id;

  try {
    // ── Check for duplicate scan ──
    // Prevent same student scanning same QR code twice
    const [existing] = await db.query(
      'SELECT * FROM attendance WHERE student_id = ? AND qr_code = ?',
      [student_id, qr_code]
    );

    // Return error if already scanned
    if (existing.length > 0) {
      return res.status(400).json({
        error: 'You already scanned this QR code!'
      });
    }

    // ── Save attendance record with GPS ──
    // GPS coordinates are optional - null if unavailable
    await db.query(
      `INSERT INTO attendance 
       (student_id, qr_code, subject, room, student_lat, student_lon) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_id,           // Student ID from token
        qr_code,              // Full QR code value
        subject,              // Subject name
        room || null,         // Room number (optional)
        student_lat || null,  // GPS latitude (optional)
        student_lon || null   // GPS longitude (optional)
      ]
    );

    // Return success message
    res.json({ message: 'Attendance recorded successfully' });

  } catch (err) {
    // Return error if something goes wrong
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 2 — GET ALL ATTENDANCE RECORDS
// GET /api/attendance/records
// Called by instructor to view all records
// Now includes room and GPS data
// ─────────────────────────────────────────
router.get('/records', verifyToken, async (req, res) => {
  try {
    // Join attendance table with users table
    // to get student name along with attendance info
    const [rows] = await db.query(`
      SELECT 
        u.name,            -- Student full name
        a.subject,         -- Subject name
        a.room,            -- Room number
        a.qr_code,         -- QR code value
        a.student_lat,     -- Student GPS latitude
        a.student_lon,     -- Student GPS longitude
        a.scanned_at       -- Date and time of scan
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      ORDER BY a.scanned_at DESC  -- Most recent first
    `);

    // Return all records
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 3 — GET STUDENT'S OWN HISTORY
// GET /api/attendance/my-history
// Called by student to view their own records
// ─────────────────────────────────────────
router.get('/my-history', verifyToken, async (req, res) => {
  try {
    // Get only this student's attendance records
    // Student ID comes from the verified JWT token
    const [rows] = await db.query(
      `SELECT * FROM attendance 
       WHERE student_id = ? 
       ORDER BY scanned_at DESC`,  // Most recent first
      [req.user.id]
    );

    // Return student's records
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 4 — EXPORT ATTENDANCE TO EXCEL
// GET /api/attendance/export
// Called by instructor to download Excel file
// Now includes room and GPS columns
// ─────────────────────────────────────────
router.get('/export', verifyToken, async (req, res) => {
  try {
    // Import xlsx library for Excel generation
    const XLSX = require('xlsx');

    // Get all attendance records with student names
    const [rows] = await db.query(`
      SELECT 
        u.name AS Student,          -- Student name column
        a.subject AS Subject,       -- Subject column
        a.room AS Room,             -- Room number column
        a.student_lat AS Latitude,  -- GPS latitude column
        a.student_lon AS Longitude, -- GPS longitude column
        a.scanned_at AS Date        -- Date column
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      ORDER BY a.scanned_at DESC
    `);

    // ── Create Excel file ──
    // Convert JSON data to Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Create new Excel workbook
    const workbook = XLSX.utils.book_new();

    // Add worksheet to workbook with sheet name
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Convert workbook to buffer for download
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    // Set response headers for file download
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=attendance.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Send Excel file as response
    res.send(buffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 5 — GET SCAN COUNT FOR QR CODE
// GET /api/attendance/scan-count
// Called by web interface to show how many
// students scanned the current QR code
// ─────────────────────────────────────────
router.get('/scan-count', verifyToken, async (req, res) => {
  // Get QR code from query parameter
  // Example: /api/attendance/scan-count?qr_code=ATT-Math-123
  const { qr_code } = req.query;

  try {
    // Count how many students scanned this QR code
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM attendance WHERE qr_code = ?',
      [qr_code]
    );

    // Return the count
    res.json({ count: rows[0].count });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 6 — GET ALL STUDENTS LIST
// GET /api/attendance/students
// Called by instructor for manual attendance
// ─────────────────────────────────────────
router.get('/students', verifyToken, async (req, res) => {
  try {
    // Get all users with student role
    // Only return id name and email (not password)
    const [rows] = await db.query(
      `SELECT id, name, email 
       FROM users 
       WHERE role = "student" 
       ORDER BY name ASC`  // Alphabetical order
    );

    // Return students list
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 7 — MANUAL ATTENDANCE
// POST /api/attendance/manual
// Called by instructor to mark student
// present without QR scanning
// ─────────────────────────────────────────
router.post('/manual', verifyToken, async (req, res) => {
  // Get student ID subject and room from request body
  const { student_id, subject, room } = req.body;

  // Get instructor info from token
  const instructor = req.user;

  // Only instructors can mark manual attendance
  if (instructor.role !== 'instructor') {
    return res.status(403).json({
      error: 'Only instructors can mark manual attendance'
    });
  }

  try {
    // ── Check if already marked today ──
    // Prevent marking same student twice on same day
    const [existing] = await db.query(
      `SELECT * FROM attendance 
       WHERE student_id = ? 
       AND subject = ? 
       AND DATE(scanned_at) = CURDATE()`, // CURDATE() = today's date
      [student_id, subject]
    );

    // Return error if already marked today
    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Attendance already marked for today!'
      });
    }

    // ── Create manual QR code value ──
    // Prefix with MANUAL so we know it was manually marked
    const manual_qr = `MANUAL-${subject}-${Date.now()}`;

    // ── Save manual attendance record ──
    // No GPS for manual attendance
    await db.query(
      `INSERT INTO attendance 
       (student_id, qr_code, subject, room, student_lat, student_lon) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_id,    // Student ID
        manual_qr,     // Manual QR code value
        subject,       // Subject name
        room || null,  // Room number (optional)
        null,          // No GPS for manual attendance
        null           // No GPS for manual attendance
      ]
    );

    // Return success message
    res.json({ message: 'Manual attendance recorded successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 8 — GET ATTENDANCE PERCENTAGE
// GET /api/attendance/percentage
// Called by student to see their attendance
// percentage per subject
// ─────────────────────────────────────────
router.get('/percentage', verifyToken, async (req, res) => {
  try {
    // ── Get total classes per subject ──
    // Count all attendance records grouped by subject
    const [total] = await db.query(`
      SELECT subject, COUNT(*) as total
      FROM attendance
      GROUP BY subject
    `);

    // ── Get student's attended classes ──
    // Count only this student's records grouped by subject
    const [attended] = await db.query(`
      SELECT subject, COUNT(*) as attended
      FROM attendance
      WHERE student_id = ?
      GROUP BY subject
    `, [req.user.id]);

    // ── Calculate percentage for each subject ──
    const percentage = total.map(t => {
      // Find this subject in student's attended records
      const found = attended.find(a => a.subject === t.subject);

      // Get attended count (0 if student never attended)
      const attendedCount = found ? found.attended : 0;

      // Calculate percentage rounded to whole number
      const percent = Math.round((attendedCount / t.total) * 100);

      // Determine status based on percentage
      // 75%+ = good, 50-74% = warning, below 50% = danger
      const status = percent >= 75 ? 'good' :
                     percent >= 50 ? 'warning' : 'danger';

      return {
        subject: t.subject,       // Subject name
        attended: attendedCount,  // Classes attended by student
        total: t.total,           // Total classes held
        percentage: percent,      // Attendance percentage
        status                    // good / warning / danger
      };
    });

    // Return percentage data
    res.json(percentage);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPORT ROUTER ───
// Make routes available to server.js
module.exports = router;