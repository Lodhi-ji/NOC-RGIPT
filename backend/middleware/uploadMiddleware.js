const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir); 
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

function checkFileType(file, cb) {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: PDFs Only!');
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB max
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
