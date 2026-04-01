import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth);

// POST /api/transcribe — transcribe audio using Gemini via OpenRouter
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audio, mimeType = 'audio/webm' } = req.body;

    if (!audio) {
      throw new AppError(400, 'Audio data is required');
    }

    if (!process.env.OPENROUTER_API_KEY) {
      throw new AppError(500, 'Transcription service not configured');
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');

    // Reject very short/empty recordings (likely silence)
    if (audioBuffer.length < 5000) {
      res.json({ text: '', duration: 0 });
      return;
    }

    // Use Gemini Flash via OpenRouter for transcription
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: audio,
                  format: mimeType.replace('audio/', ''),
                },
              },
              {
                type: 'text',
                text: 'Transcribe this audio recording exactly as spoken. If the audio is silent or contains no speech, respond with exactly "EMPTY". Do not add any commentary, just the transcription.',
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter transcription error:', response.status, errorText);
      throw new AppError(500, 'Failed to transcribe audio');
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    let text = data.choices?.[0]?.message?.content?.trim() || '';

    // Filter out empty/hallucination responses
    const hallucinations = [
      'empty', 'thank you', 'thanks for watching', 'subscribe',
      'like and subscribe', 'see you next time', 'bye', 'goodbye',
      'thank you for watching', 'thanks for listening',
      'no speech detected', 'silence', 'inaudible',
    ];
    const lowerText = text.toLowerCase().replace(/[.!?]/g, '').trim();
    if (hallucinations.includes(lowerText) || text.length < 3) {
      text = '';
    }

    res.json({
      text,
      duration: 0,
    });
  } catch (error) {
    console.error('Transcription error:', (error as Error).message);
    next(error);
  }
});

export default router;
