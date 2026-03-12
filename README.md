Smart Attendance Tracking Mobile Application Using QR Codes.

This project aims to build a mobile application that streamlines classroom attendance using QR codes. 

Overview

Instructors generate a unique QR code for each class session, and students scan it using the app to register their attendance. The system automatically records timestamps, validates student identity, and stores attendance data in a centralized backend. This reduces manual roll calls, minimizes fraud, and provides instructors and administrators with clear, exportable attendance reports. The project focuses on secure QR-based check-in, intuitive user interfaces, and reliable data storage for academic environments. 

Features :  

### 🔐 User Authentication
- Secure login for students and instructors
- Email and ID-based authentication
- Role-based access (student vs instructor)

### 📸 QR Code Attendance
- Instructors generate unique QR codes for each class session
- Students scan QR codes to mark attendance
- Real-time validation to prevent duplicate or invalid scans

### 🧑‍🏫 Instructor Dashboard
- View class sessions
- Generate QR codes for new sessions
- Track attendance records for each student
- Monitor who attended and who missed class

### 🎓 Student Dashboard
- View upcoming and past classes
- Scan QR codes to check in
- See personal attendance history

### 🗄 Backend API (Node.js + Express)
- RESTful API endpoints for login, attendance, and session management
- MySQL database integration
- Secure data handling and validation

### 📱 Mobile App (React Native + Expo)
- Modern, clean UI
- Smooth navigation between screens
- Camera access for QR scanning
- Cross‑platform support (Android + iOS)

### 🧪 Test Cases
- Attendance flow test cases
- Login flow test cases
- Input/output examples included in the `tests/` folder

### 📄 Documentation
- Weekly logs (PDF)
- Cover page (PDF)
- Architecture diagram
- Database schema
- API documentation in `docs/`



Tools & Technologies: 

Mobile App:
Language: JavaScript
QR Scanning: react-native-camera / expo-barcode-scanner
Backend & Database:
Backend: Node.js + Express (or Firebase Functions)
Database: MySQL / PostgreSQL 
Infrastructure & Dev Tools:
Version Control: GitHub
API Testing: Postman / Thunder Client
IDE: VS Code / Android Studio
