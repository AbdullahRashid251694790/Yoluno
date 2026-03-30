/**
 * Voice Recorder Component
 *
 * Audio recording component for voice-to-text photo descriptions.
 * Uses the Whisper API for transcription.
 */

import { useState, useCallback } from 'react';
import { Mic, Square, Loader2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { whisperService } from '@/services/whisper';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  value?: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceRecorder({
  value = '',
  onChange,
  placeholder = 'Describe this photo or record your voice...',
  disabled = false,
  className,
}: VoiceRecorderProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState(value);

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      try {
        const result = await whisperService.transcribe(blob, { format: 'webm' });
        const newText = transcribedText
          ? `${transcribedText} ${result.text}`
          : result.text;
        setTranscribedText(newText);
        onChange(newText);
        toast.success('Voice transcribed successfully');
      } catch (error) {
        console.error('Transcription error:', error);
        toast.error('Failed to transcribe voice. Please try again.');
      } finally {
        setIsTranscribing(false);
      }
    },
    [transcribedText, onChange]
  );

  const {
    state,
    isRecording,
    duration,
    startRecording,
    stopRecording,
    reset,
    error: recorderError,
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: (err) => {
      toast.error(err.message || 'Microphone access denied');
    },
    maxDuration: 60000, // 1 minute max
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTranscribedText(newText);
    onChange(newText);
  };

  const handleClear = () => {
    setTranscribedText('');
    onChange('');
    reset();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Recording Controls */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled || isTranscribing}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Record Voice
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2 animate-pulse"
          >
            <Square className="h-4 w-4" />
            Stop ({formatDuration(duration)})
          </Button>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </div>
        )}

        {transcribedText && !isRecording && !isTranscribing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
          <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-body-sm font-medium">Recording... Speak now</span>
        </div>
      )}

      {/* Error Display */}
      {recorderError && (
        <p className="text-body-sm text-destructive">{recorderError}</p>
      )}

      {/* Text Area */}
      <Textarea
        value={transcribedText}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled || isRecording || isTranscribing}
        rows={4}
        className="resize-none"
      />

      {/* Helper Text */}
      <p className="text-caption text-muted-foreground">
        You can type a description or record your voice (max 1 minute)
      </p>
    </div>
  );
}
