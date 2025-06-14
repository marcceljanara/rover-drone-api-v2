/* eslint-disable import/no-extraneous-dependencies */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import InvariantError from '../exceptions/InvariantError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/delivery-proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // ✅ Maksimal 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      // ✅ Gunakan MulterError dengan kode khusus untuk identifikasi
      cb(new InvariantError('File harus berupa gambar (jpeg, jpg, png)'));
    }
  },
});

const uploadSingleImage = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      req.uploadError = err.message; // tandai error secara manual
    }
    return next(); // lanjut ke handler apapun kondisinya
  });
};

export default uploadSingleImage;
