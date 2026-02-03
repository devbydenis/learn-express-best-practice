import multer from 'multer';
import path from 'path';
import { Request } from 'express';

/**
 * Storage configuration
 * Files disimpan di disk dengan unique filename
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Folder tujuan
  },

  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter - validate file type
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);  // Accept
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'));
  }
};

/**
 * Multer instance dengan configuration
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});
