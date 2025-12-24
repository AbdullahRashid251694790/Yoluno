/**
 * StorybookAudioControls Component
 *
 * Audio playback controls with page-by-page and full story modes.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Loader2, SkipForward, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSpeech, playAudioFromBase64 } from '@/services/textToSpeech';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StoryPage } from '@/services/storyPages';

type AudioMode = 'page' | 'full';

interface StorybookAudioControlsProps {
  storyId: string;
  pages: StoryPage[];
  currentPage: number; // 1-indexed (page 1 = first story page)
  narratorVoice: string;
  onPageChange: (page: number) => void;
}

export function StorybookAudioControls({
  storyId,
  pages,
  currentPage,
  narratorVoice,
  onPageChange,
}: StorybookAudioControlsProps) {
  const [mode, setMode] = useState<AudioMode>('page');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get current page data (currentPage is 1-indexed for story pages)
  const pageData = pages[currentPage - 1];

  // Stop audio when page changes or component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Stop audio when switching pages in page mode
  useEffect(() => {
    if (mode === 'page') {
      stopAudio();
    }
  }, [currentPage, mode]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(async () => {
    // If playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If paused and audio exists, resume
    if (!isPlaying && audioRef.current && audioRef.current.currentTime > 0) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Generate new audio
    setIsLoading(true);
    try {
      let textToRead: string;

      if (mode === 'page') {
        // Read current page only
        textToRead = pageData?.content || '';
      } else {
        // Read full story (all pages combined)
        textToRead = pages.map((p) => p.content).join('\n\n');
      }

      if (!textToRead) {
        toast.error('No content to read');
        return;
      }

      const response = await generateSpeech(textToRead, {
        voice: narratorVoice as 'shimmer' | 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx',
      });

      stopAudio();

      const audio = playAudioFromBase64(response.audio);
      audioRef.current = audio;
      setIsPlaying(true);

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        audioRef.current = null;

        // Auto-advance to next page in page mode
        if (mode === 'page' && autoAdvance && currentPage < pages.length) {
          onPageChange(currentPage + 1); // +1 because onPageChange expects 0-indexed where 0=cover
          // Small delay before starting next page audio
          setTimeout(() => {
            handlePlayPause();
          }, 500);
        }
      });

      audio.addEventListener('error', () => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
        audioRef.current = null;
      });
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, mode, pageData, pages, narratorVoice, autoAdvance, currentPage, onPageChange, stopAudio]);

  const toggleMode = useCallback(() => {
    stopAudio();
    setMode((prev) => (prev === 'page' ? 'full' : 'page'));
  }, [stopAudio]);

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvance((prev) => !prev);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Mode toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMode}
        className="text-white/80 hover:text-white hover:bg-white/20 text-xs"
      >
        {mode === 'page' ? 'Page Mode' : 'Full Story'}
      </Button>

      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        disabled={isLoading}
        className={cn(
          'rounded-full bg-white/20 hover:bg-white/30 text-white h-12 w-12',
          isPlaying && 'bg-white/30'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>

      {/* Stop button (only show when audio exists) */}
      {(isPlaying || audioRef.current) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={stopAudio}
          className="rounded-full bg-white/20 hover:bg-white/30 text-white"
        >
          <Square className="h-5 w-5" />
        </Button>
      )}

      {/* Auto-advance toggle (only in page mode) */}
      {mode === 'page' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoAdvance}
          className={cn(
            'text-xs gap-1',
            autoAdvance
              ? 'text-white hover:text-white/80 hover:bg-white/20'
              : 'text-white/50 hover:text-white/70 hover:bg-white/10'
          )}
        >
          <SkipForward className="h-4 w-4" />
          Auto
        </Button>
      )}
    </div>
  );
}
