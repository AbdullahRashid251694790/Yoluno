/**
 * Text-to-Speech Service
 *
 * Client-side service for TTS functionality.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  voice?: TTSVoice;
  speed?: number;
  childProfileId?: string;
}

export interface TTSResponse {
  audio: string; // base64 encoded
  contentType: string;
}

export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResponse> {
  const { voice = 'nova', speed = 1.0 } = options;

  try {
    const { data } = await apiClient.post<TTSResponse>('/tts', {
      text,
      voice,
      speed,
    });

    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'textToSpeech.generateSpeech',
      strategy: 'throw',
    });
  }
}

export function playAudioFromBase64(base64Audio: string): HTMLAudioElement {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  audio.play();
  return audio;
}

export async function speakText(
  text: string,
  options: TTSOptions = {}
): Promise<HTMLAudioElement> {
  const response = await generateSpeech(text, options);
  return playAudioFromBase64(response.audio);
}

// Child-friendly voice recommendations by age
export function getRecommendedVoice(age: number): TTSVoice {
  if (age <= 6) return 'shimmer'; // Warm, friendly
  if (age <= 10) return 'nova'; // Neutral, clear
  return 'echo'; // Slightly more mature
}

export const textToSpeechService = {
  generate: generateSpeech,
  play: playAudioFromBase64,
  speak: speakText,
  getRecommendedVoice,
};
