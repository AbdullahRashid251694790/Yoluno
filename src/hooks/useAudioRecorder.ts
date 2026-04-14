/**
 * Audio Recorder Hook
 *
 * Custom hook for recording audio using the MediaRecorder API.
 * Used for voice-to-text photo descriptions in the Family Tree feature.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

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

/**
 * Pick the first MIME type the browser actually supports. iOS Safari only
 * supports audio/mp4, Chrome/Firefox prefer audio/webm. Returning an empty
 * string lets the browser pick its own default as a final fallback.
 */
function pickSupportedMimeType(preferred?: string): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    preferred,
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
  ].filter((t): t is string => !!t);
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // some browsers throw on unknown types — ignore
    }
  }
  return '';
}

export function useAudioRecorder(options: AudioRecorderOptions = {}): AudioRecorderReturn {
  const {
    mimeType,
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
  const audioUrlRef = useRef<string | null>(null);

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
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      cleanup();

      if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
        throw new Error('Audio recording is not supported on this device or browser.');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the first MIME type this browser actually supports
      const actualMimeType = pickSupportedMimeType(mimeType);
      const recorderOptions = actualMimeType ? { mimeType: actualMimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the recorder's actual mimeType — what was negotiated with the OS
        const blobType = mediaRecorder.mimeType || actualMimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
        onRecordingComplete?.(blob);
      };

      mediaRecorder.onerror = () => {
        const errorMessage = 'Recording failed';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      };

      // Start recording — no timeslice so iOS Safari emits a single chunk on stop
      mediaRecorder.start();
      setState('recording');
      setDuration(0);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 250);

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
      cleanup();
    }
  }, [mimeType, maxDuration, onRecordingComplete, onError, cleanup]);

  const stopRecording = useCallback(() => {
    console.log('[useAudioRecorder] stopRecording called', {
      hasRecorder: !!mediaRecorderRef.current,
      recorderState: mediaRecorderRef.current?.state,
      hasStream: !!streamRef.current,
      hasTimer: !!timerRef.current,
    });

    // Always clear timers first — even if the recorder ref is gone or the
    // stop() call throws, the UI must not be stuck in the recording state.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch (err) {
        console.error('[useAudioRecorder] recorder.stop() threw', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState('stopped');
  }, []);

  // Always release the mic and clear timers when the host component unmounts.
  // Without this, navigating away mid-recording leaves the browser tab with
  // the microphone still active.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
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
    audioUrlRef.current = null;
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
