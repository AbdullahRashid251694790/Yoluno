import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadFile, deleteFile, getFileUrl } from '../utils/storage.js';

const router = Router();

router.use(requireAuth);

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow images, audio, and video
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default (for video uploads)
  },
});

// POST /api/upload/:bucket - Upload a file
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

    await uploadFile(key, req.file.buffer, req.file.mimetype);

    // Return URL for immediate use
    const url = await getFileUrl(key, 86400);

    res.json({
      key,
      url,
      filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/upload/signed-url/:key(*) - Get a signed URL for an existing file
router.get('/signed-url/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.params[0];
    if (!key) {
      throw new AppError(400, 'Key is required');
    }

    const url = await getFileUrl(key, 3600);

    res.json({ url });
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

    await deleteFile(key);

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
