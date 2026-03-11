const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/mark", async (req, res) => {
  try {
    const { studentId, sessionId, classId } = req.body;

    // Validate required fields
    if (!studentId || !sessionId || !classId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Prevent duplicate attendance
    const [existing] = await db.execute(
      `SELECT * FROM attendance 
       WHERE student_id = ? AND session_id = ? AND class_id = ?`,
      [studentId, sessionId, classId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Attendance already recorded" });
    }

    // Insert attendance
    await db.execute(
      `INSERT INTO attendance (student_id, class_id, session_id, timestamp)
       VALUES (?, ?, ?, NOW())`,
      [studentId, classId, sessionId]
    );

    res.json({ message: "Attendance recorded successfully" });

  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
