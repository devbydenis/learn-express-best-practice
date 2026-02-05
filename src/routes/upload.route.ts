import express, { Request, Response } from "express";
import { upload } from "../config/multer";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

/**
 * POST /upload/single - Upload single file
 * Protected - requires authentication
 */
router.post(
  "/single",
  authMiddleware,
  upload.single("image"), // Fieldname: 'image'
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
      return;
    }

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`,
      },
    });
  }),
);

/**
 * POST /upload/multiple - Upload multiple files (max 5)
 * Protected
 */
router.post(
  "/multiple",
  authMiddleware,
  upload.array("images", 5), // Max 5 files
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: "No files uploaded",
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: `/uploads/${file.filename}`,
      })),
    });
  }),
);

export default router;
