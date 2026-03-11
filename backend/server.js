const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const qrRoutes = require("./routes/qr");
const attendanceRoutes = require("./routes/attendance");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/qr", qrRoutes);
app.use("/attendance", attendanceRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));

