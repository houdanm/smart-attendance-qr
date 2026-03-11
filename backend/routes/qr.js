const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const crypto = require("crypto");

router.post("/generate", async (req, res) => {
  const sessionId = crypto.randomUUID();
  const classId = "CISC4900";

  const payload = { sessionId, classId, expiresAt: Date.now() + 300000 };

  const qr = await QRCode.toDataURL(JSON.stringify(payload));

  res.json({ qr });
});

module.exports = router;
