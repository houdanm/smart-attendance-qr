const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  const [rows] = await db.execute(
    `SELECT * FROM users WHERE email = ? OR student_id = ? OR instructor_id = ?`,
    [identifier, identifier, identifier]
  );

  if (rows.length === 0) return res.status(401).json({ message: "User not found" });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: "Incorrect password" });

  const token = jwt.sign(
    { id: user.id, role: user.role, student_id: user.student_id, instructor_id: user.instructor_id },
    "SECRET",
    { expiresIn: "7d" }
  );

  res.json({
    token,
    role: user.role,
    student_id: user.student_id,
    instructor_id: user.instructor_id,
  });
});

module.exports = router;
