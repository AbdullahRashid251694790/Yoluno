/**
 * Audio Recorder Hook
 *
 * Custom hook for recording audio using the MediaRecorder API.
 * Used for voice-to-text photo descriptions in the Family Tree feature.
 */

import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface AudioRecorderOptions {
  /** Audio MIME type (default: 'audio/webm') */
  mimeType?: string;
  /** Called when recording is complete with the audio blob */
  onRecordingComplete?: (blob: Blob) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Maximum recording duration in milliseconds (default: 60000 = 1 minute) */
  maxDuration?: number;
}

export interface AudioRecorderReturn {
  /** Current recording state */
  state: RecordingState;
  /** Whether the recorder is currently recording */
  isRecording: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** The recorded audio blob (available after stopping) */
  audioBlob: Blob | null;
  /** Audio URL for playback (available after stopping) */
  audioUrl: string | null;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Pause recording */
  pauseRecording: () => void;
  /** Resume recording */
  resumeRecording: () => void;
  /** Reset the recorder to initial state */
  reset: () => void;
  /** Error message if any */
  error: string | null;
}

export function useAudioRecorder(options: AudioRecorderOptions = {}): AudioRecorderReturn {
  const {
    mimeType = 'audio/webm',
    onRecordingComplete,
    onError,
    maxDuration = 60000,
  } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      cleanup();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Check if the preferred MIME type is supported
      const actualMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType: actualMimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
      };

      mediaRecorder.onerror = (event) => {
        const errorMessage = 'Recording failed';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Set max duration timer
      maxDurationTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, maxDuration);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please grant permission.';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
      setState('idle');
    }
  }, [mimeType, maxDuration, onRecordingComplete, onError, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState('stopped');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');

      // Resume duration timer
      const pausedDuration = duration;
      const resumeTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(pausedDuration + Math.floor((Date.now() - resumeTime) / 1000));
      }, 100);
    }
  }, [duration]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [cleanup]);

  return {
    state,
    isRecording: state === 'recording',
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    error,
  };
}
