import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth);

// POST /api/tts
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    if (!text || typeof text !== 'string') {
      throw new AppError(400, 'Text is required');
    }

    if (text.length > 4096) {
      throw new AppError(400, 'Text must be less than 4096 characters');
    }

    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      throw new AppError(400, `Voice must be one of: ${validVoices.join(', ')}`);
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      throw new AppError(500, 'Failed to generate speech');
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.json({
      audio: base64Audio,
      contentType: 'audio/mpeg',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
