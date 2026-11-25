const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Files go to Cloudinary when its credentials are configured (production).
// Without them (local demo) they are stored in backend/uploads and served by Express.
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

const safeFileName = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
  return `${Date.now()}-${base}${ext}`;
};

let storage;
if (useCloudinary) {
  const { v2: cloudinary } = require('cloudinary');
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: process.env.CLOUDINARY_FOLDER || 'noc_portal_documents',
      resource_type: 'raw', // raw keeps PDFs intact
      public_id: (req, file) => safeFileName(file),
    },
  });
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, safeFileName(file)),
  });
}

function checkFileType(file, cb) {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Only PDF files are allowed.'));
}

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

// Controllers read `file.path`. For disk storage, turn the absolute OS path into the
// public "uploads/<name>" path (Cloudinary already gives a full https URL).
const normalizeLocalPaths = (req, res, next) => {
  if (!useCloudinary && req.files) {
    Object.values(req.files).flat().forEach((f) => { f.path = `uploads/${f.filename}`; });
  }
  next();
};

const upload = {
  fields: (spec) => [multerUpload.fields(spec), normalizeLocalPaths],
  single: (name) => [multerUpload.single(name), normalizeLocalPaths],
};

module.exports = upload;
module.exports.useCloudinary = useCloudinary;
