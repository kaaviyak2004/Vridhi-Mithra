const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Expose these as exports to require them in faculty.js if needed, but it's better to just put them in faculty.js
