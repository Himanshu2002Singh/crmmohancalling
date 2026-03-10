// file: middleware/upload.js
const multer = require('multer');

// Use memory storage (no disk saving)
const storage = multer.memoryStorage();

// Only allow Excel files
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed!'), false);
  }
};

// Multer setup
const upload = multer({ storage, fileFilter });

module.exports = upload;
