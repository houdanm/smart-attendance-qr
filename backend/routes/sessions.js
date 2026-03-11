const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all sessions
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sessions");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET latest session
router.get("/latest", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sessions ORDER BY id DESC LIMIT 1"
    );
    if (rows.length === 0) return res.json({ error: "No sessions found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

 module.exports = router;

