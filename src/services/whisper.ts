/**
 * Whisper Transcription Service
 *
 * Client-side service for transcribing audio to text using OpenAI Whisper API.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export interface TranscribeOptions {
  format?: 'webm' | 'mp3' | 'wav' | 'm4a' | 'ogg';
  language?: string;
}

export interface TranscribeResult {
  text: string;
  duration?: number;
}

/**
 * Convert a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get MIME type from format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    webm: 'audio/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/m4a',
    ogg: 'audio/ogg',
  };
  return mimeTypes[format] || 'audio/webm';
}

/**
 * Transcribe audio blob to text using OpenAI Whisper API
 *
 * @param audioBlob - The audio blob to transcribe
 * @param options - Transcription options (format, language)
 * @returns The transcribed text and duration
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscribeOptions = {}
): Promise<TranscribeResult> {
  const { format = 'webm' } = options;

  try {
    // Convert blob to base64
    const audioBase64 = await blobToBase64(audioBlob);
    const mimeType = getMimeType(format);

    // Call the API
    const { data } = await apiClient.post<TranscribeResult>('/transcribe', {
      audio: audioBase64,
      mimeType,
    });

    if (!data || typeof data.text !== 'string') {
      throw new Error('Invalid response from transcription service');
    }

    return {
      text: data.text,
      duration: data.duration,
    };
  } catch (error) {
    throw handleError(error, {
      context: 'whisper.transcribeAudio',
      strategy: 'throw',
    });
  }
}

export const whisperService = {
  transcribe: transcribeAudio,
};
