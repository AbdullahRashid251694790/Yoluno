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

// Character-to-voice mapping
export const CHARACTER_VOICES = [
  { voiceId: 'echo' as TTSVoice, character: 'Luno', description: 'Calm & comforting', gender: 'male' },
  { voiceId: 'fable' as TTSVoice, character: 'Lolo', description: 'Expressive & adventurous', gender: 'male' },
  { voiceId: 'shimmer' as TTSVoice, character: 'Lumi', description: 'Warm & gentle', gender: 'female' },
  { voiceId: 'nova' as TTSVoice, character: 'Lala', description: 'Clear & friendly', gender: 'female' },
  // { voiceId: 'alloy' as TTSVoice, character: 'Alloy', description: 'Balanced & natural', gender: 'neutral' },
  // { voiceId: 'onyx' as TTSVoice, character: 'Onyx', description: 'Deep & resonant', gender: 'male' },
] as const;

// Get character name from voice ID
export function getCharacterForVoice(voiceId: string): string {
  return CHARACTER_VOICES.find((v) => v.voiceId === voiceId)?.character || voiceId;
}

// Child-friendly voice recommendations by age
export function getRecommendedVoice(age: number): TTSVoice {
  if (age <= 6) return 'shimmer'; // Lumi - Warm, friendly
  if (age <= 10) return 'nova'; // Lala - Clear, friendly
  return 'echo'; // Luno - Calm, comforting
}

export const textToSpeechService = {
  generate: generateSpeech,
  play: playAudioFromBase64,
  speak: speakText,
  getRecommendedVoice,
};
