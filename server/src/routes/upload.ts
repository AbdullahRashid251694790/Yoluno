import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth);

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const bucket = req.params.bucket || 'misc';
    const userId = req.user?.id || 'anonymous';
    const destPath = path.join(uploadDir, bucket, userId);

    try {
      await fs.mkdir(destPath, { recursive: true });
      cb(null, destPath);
    } catch (error) {
      cb(error as Error, destPath);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow images and audio
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/m4a',
    'audio/ogg',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `File type ${file.mimetype} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// POST /api/upload/:bucket
router.post('/:bucket', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const bucket = req.params.bucket;
    const userId = req.user!.id;
    const filename = req.file.filename;

    const url = `/uploads/${bucket}/${userId}/${filename}`;

    res.json({
      url,
      filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/upload/:bucket/:filename
router.delete('/:bucket/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bucket, filename } = req.params;
    const userId = req.user!.id;

    const filepath = path.join(uploadDir, bucket, userId, filename);

    // Verify the file exists and belongs to user
    try {
      await fs.access(filepath);
    } catch {
      throw new AppError(404, 'File not found');
    }

    await fs.unlink(filepath);

    res.json({ message: 'File deleted' });
  } catch (error) {
    next(error);
  }
});

// Error handler for multer errors
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
