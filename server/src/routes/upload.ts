import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3.js';

const router = Router();

router.use(requireAuth);

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

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
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const key = `${bucket}/${userId}/${filename}`;

    const url = await uploadToS3(key, req.file.buffer, req.file.mimetype);

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
    const key = `${bucket}/${userId}/${filename}`;

    await deleteFromS3(key);

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
