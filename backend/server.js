// ─── IMPORTS ───
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ─── CREATE EXPRESS APP ───
const app = express();

// ─── MIDDLEWARE ───
app.use(cors());           // Allow cross-origin requests
app.use(express.json());   // Parse JSON request bodies

// ─── STATIC FILES ───
// Serve HTML files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded profile pictures
// Example: http://192.168.0.105:5000/uploads/profile-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ───
// Auth routes - login and register
app.use('/api/auth', require('./routes/auth'));

// Attendance routes - scan, records, export
app.use('/api/attendance', require('./routes/attendance'));

// Profile routes - photo upload, update
app.use('/api/profile', require('./routes/profile'));

// ─── HOME ROUTE ───
// Serves the web QR display page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START SERVER ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Schedule routes - timetable management
app.use('/api/schedule', require('./routes/schedule'));