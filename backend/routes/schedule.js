// ─── IMPORTS ───
const express = require('express');
const router = express.Router();
const db = require('../db');         // MySQL database connection
const jwt = require('jsonwebtoken'); // JWT for token verification

// ─────────────────────────────────────────
// MIDDLEWARE — VERIFY TOKEN
// ─────────────────────────────────────────
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────
// ROUTE 1 — GET ALL SCHEDULES
// GET /api/schedule
// ─────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    let rows;

    if (req.user.role === 'instructor') {
      // Instructors see only their own schedules
      [rows] = await db.query(`
        SELECT 
          s.*,
          u.name AS instructor_name
        FROM schedule s
        JOIN users u ON s.instructor_id = u.id
        WHERE s.instructor_id = ?
        ORDER BY
          FIELD(s.day_of_week,
            'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday', 'Sunday'
          ),
          s.start_time
      `, [req.user.id]);
    } else {
      // Students see all schedules
      [rows] = await db.query(`
        SELECT 
          s.*,
          u.name AS instructor_name
        FROM schedule s
        JOIN users u ON s.instructor_id = u.id
        ORDER BY
          FIELD(s.day_of_week,
            'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday', 'Sunday'
          ),
          s.start_time
      `);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 2 — ADD NEW SCHEDULE
// POST /api/schedule
// Now includes classroom GPS coordinates
// ─────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  // Only instructors can add schedules
  if (req.user.role !== 'instructor') {
    return res.status(403).json({
      error: 'Only instructors can add schedules'
    });
  }

  // Get all schedule details including GPS
  const {
    subject,
    room,
    day_of_week,
    start_time,
    end_time,
    classroom_lat,   // Classroom latitude
    classroom_lon,   // Classroom longitude
    location_radius  // Allowed radius in meters
  } = req.body;

  // Validate required fields
  if (!subject || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({
      error: 'Subject day start time and end time are required'
    });
  }

  try {
    // Insert schedule with GPS coordinates
    await db.query(
      `INSERT INTO schedule 
       (instructor_id, subject, room, day_of_week, 
        start_time, end_time, classroom_lat, 
        classroom_lon, location_radius) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        subject,
        room || null,
        day_of_week,
        start_time,
        end_time,
        classroom_lat || null,   // Optional GPS lat
        classroom_lon || null,   // Optional GPS lon
        location_radius || 100   // Default 100m radius
      ]
    );

    res.json({ message: 'Schedule added successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ROUTE 3 — DELETE SCHEDULE
// DELETE /api/schedule/:id
// ─────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({
      error: 'Only instructors can delete schedules'
    });
  }

  try {
    await db.query(
      'DELETE FROM schedule WHERE id = ? AND instructor_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPORT ROUTER ───
module.exports = router;