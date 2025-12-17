import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth);

// POST /api/transcribe
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audio, mimeType = 'audio/webm' } = req.body;

    if (!audio) {
      throw new AppError(400, 'Audio data is required');
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

    // Determine file extension from mime type
    const extensionMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/m4a': 'm4a',
      'audio/ogg': 'ogg',
    };
    const extension = extensionMap[mimeType] || 'webm';

    // Create form data for OpenAI
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new AppError(500, 'Failed to transcribe audio');
    }

    const data = (await response.json()) as { text: string; duration?: number };

    res.json({
      text: data.text,
      duration: data.duration,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
