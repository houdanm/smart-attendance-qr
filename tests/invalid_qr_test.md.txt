# Test Case: Student Scans Invalid QR Code

## Description
This test ensures the system rejects invalid or expired QR codes.

## Input
- QR Code Content: "invalid-data"

## Expected Output
- API Response: `{ "status": "error", "message": "Invalid QR code" }`
- No attendance record is created.
