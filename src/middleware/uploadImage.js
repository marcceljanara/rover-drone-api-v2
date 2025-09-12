/* eslint-disable import/no-extraneous-dependencies */
import multer from 'multer';
import path from 'path';
import S3Service from '../services/storage/storageService.js';
import InvariantError from '../exceptions/InvariantError.js';

const storage = multer.memoryStorage(); // ✅ langsung di memory, bukan ke disk
const s3 = new S3Service(process.env.R2_BUCKET_NAME);

// middleware multer
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // ✅ 3 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      cb(new InvariantError('File harus berupa gambar (jpeg, jpg, png)'));
    }
  },
});

const uploadSingleImage = (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      req.uploadError = err.message;
      return next();
    }

    if (!req.file) {
      req.uploadError = 'Tidak ada file yang diupload';
      return next();
    }

    try {
      // generate unique name
      const uniqueName = `${Date.now()}-${path.basename(req.file.originalname)}`;

      // upload ke R2
      await s3.uploadObject(`delivery-proofs/${uniqueName}`, req.file.buffer, req.file.mimetype);

      // simpan informasi ke req untuk dipakai di handler berikutnya
      req.uploadedFile = {
        key: `delivery-proofs/${uniqueName}`,
        url: `https://${process.env.R2_BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/delivery-proofs/${uniqueName}`,
      };
    } catch (uploadErr) {
      req.uploadError = uploadErr.message;
    }

    return next();
  });
};

export default uploadSingleImage;
