const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",   // your MySQL password if you set one
  database: "attendance_db"
});

module.exports = db;
