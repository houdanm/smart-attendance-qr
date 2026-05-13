# 📱 Smart Attendance Tracking System using QR Codes

> A full-stack mobile application that modernizes classroom attendance tracking using QR codes, GPS location recording, and real-time reporting.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Author](#author)

---

## 📖 About the Project

Traditional paper-based attendance is slow, error-prone, and easy to manipulate. This system replaces it with a mobile app where:

- **Instructors** generate a unique QR code per class session (with subject, room, and timestamp)
- **Students** scan the QR code using their phone camera to register attendance
- **GPS coordinates** are recorded silently without blocking attendance
- **All records** are stored in a MySQL database and can be exported to Excel

The system also includes a **web projector interface** so instructors can display the QR code on a classroom projector from any browser.

---

## ✨ Features

### 👨‍🏫 Instructor Features
- 🔄 Generate unique QR code per class session
- 🏫 Include room number in QR code
- 📍 Optionally set classroom GPS location
- ✏️ Mark manual attendance for students without phones
- 👨‍🏫 View attendance dashboard with all records
- 📤 Export attendance to Excel (.xlsx) with GPS data
- 📅 Create and manage class schedule/timetable
- 🌐 Web projector interface with live student scan counter
- 👤 Profile picture and name management

### 👨‍🎓 Student Features
- 📷 Scan QR code with camera to mark attendance
- 📊 View attendance history with date filters (Today/Week/Month)
- 📈 See attendance percentage per subject with progress bars
- 📅 View full class schedule from all instructors
- 🔔 Set class reminders — notified 15 minutes before class
- 👤 Upload profile picture and update name
- 📍 GPS location recorded with each attendance entry

### 🔐 Security Features
- JWT authentication with 24-hour token expiry
- bcryptjs password hashing (10 salt rounds)
- Duplicate scan prevention (O(log n) indexed lookup)
- Role-based access control (student vs instructor)
- Expo SecureStore for encrypted token storage

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native, Expo SDK 54, Expo Router |
| QR Generation | react-native-qrcode-svg |
| QR Scanning | expo-camera |
| Storage | expo-secure-store |
| Location | expo-location |
| Backend | Node.js, Express.js v4 |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Database | MySQL 9.6, mysql2 |
| File Upload | multer |
| Excel Export | xlsx |
| HTTP Client | axios |
| Dev Tools | nodemon, Postman, Git Bash |

---

## 📁 Project Structure

\`\`\`
smart-attendance-qr/
├── 📁 backend/
│   ├── server.js              # Express server entry point
│   ├── db.js                  # MySQL connection pool
│   ├── .env                   # Environment variables (not committed)
│   ├── 📁 routes/
│   │   ├── auth.js            # Register & login routes
│   │   ├── attendance.js      # Scan, records, export routes
│   │   ├── schedule.js        # Class schedule routes
│   │   └── profile.js         # Profile picture routes
│   ├── 📁 uploads/            # Profile picture storage
│   └── 📁 public/
│       └── index.html         # Web projector interface
│
└── 📁 mobile/
    ├── app.json               # Expo configuration
    ├── package.json
    ├── 📁 app/
    │   ├── _layout.js         # Navigation layout
    │   ├── index.js           # Login screen
    │   ├── register.js        # Register screen
    │   ├── show-qr.js         # Instructor QR panel
    │   ├── scan-qr.js         # Student QR scanner
    │   ├── dashboard.js       # Attendance dashboard
    │   ├── history.js         # Student history + %
    │   ├── schedule.js        # Class schedule
    │   ├── profile.js         # Profile management
    │   └── manual-attendance.js # Manual marking
    └── 📁 utils/
        ├── authCheck.js       # JWT expiry checker
        ├── notifications.js   # Notification helpers
        └── location.js        # GPS utilities
\`\`\`

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8+
- Expo Go (on your phone)
- Git Bash

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/smart-attendance-qr.git
cd smart-attendance-qr
\`\`\`

### 2. Setup Backend

\`\`\`bash
cd backend
npm install
\`\`\`

Create a \`.env\` file (see [Environment Variables](#environment-variables))

\`\`\`bash
npm run dev
# Server running on port 5000
\`\`\`

### 3. Setup Mobile App

\`\`\`bash
cd mobile
npm install --legacy-peer-deps
npx expo start --clear
\`\`\`

Scan the QR code with **Expo Go** on your phone.

### 4. Find your PC IP address

\`\`\`bash
ipconfig
# Look for IPv4 Address under Wireless LAN adapter Wi-Fi
\`\`\`

Update \`YOUR_PC_IP\` in \`app/index.js\`, \`app/register.js\`, \`app/scan-qr.js\`.

---

## 🔧 Environment Variables

Create \`backend/.env\`:

\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_attendance
JWT_SECRET=your_secret_key_here
PORT=5000
\`\`\`

---

## 🗄️ Database Setup

Run in MySQL:

\`\`\`sql
CREATE DATABASE smart_attendance;
USE smart_attendance;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor') NOT NULL,
  subject VARCHAR(100) DEFAULT NULL,
  photo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  qr_code VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  room VARCHAR(50) DEFAULT NULL,
  student_lat DECIMAL(10,8) DEFAULT NULL,
  student_lon DECIMAL(11,8) DEFAULT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  room VARCHAR(50),
  day_of_week VARCHAR(20) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  classroom_lat DECIMAL(10,8) DEFAULT NULL,
  classroom_lon DECIMAL(11,8) DEFAULT NULL,
  location_radius INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id)
);
\`\`\`

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | ❌ |
| POST | /api/auth/login | Login — returns JWT | ❌ |
| POST | /api/attendance/scan | Record QR scan + GPS | ✅ |
| GET | /api/attendance/records | All records (instructor) | ✅ |
| GET | /api/attendance/my-history | Student's own history | ✅ |
| GET | /api/attendance/percentage | Attendance % per subject | ✅ |
| GET | /api/attendance/export | Download Excel file | ✅ |
| POST | /api/attendance/manual | Manual attendance mark | ✅ |
| GET | /api/attendance/scan-count | Count scans for QR | ✅ |
| GET | /api/schedule | Get class schedules | ✅ |
| POST | /api/schedule | Add new class | ✅ |
| DELETE | /api/schedule/:id | Delete a class | ✅ |
| GET | /api/profile/me | Get user profile | ✅ |
| POST | /api/profile/upload | Upload profile picture | ✅ |
| PUT | /api/profile/update | Update name | ✅ |

---

## 👩‍💻 Author

**Houda Naimi**
- Email: houda.naimi80@bcmail.cuny.edu
- College: Brooklyn College, CUNY
- Supervisor: Xavier Olvera

---

## 📄 License

This project was developed as a capstone project for Brooklyn College, CUNY (2026).
