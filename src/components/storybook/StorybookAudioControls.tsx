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
  const shouldAutoPlayRef = useRef(false);
  const previousPageRef = useRef(currentPage);

  // Get current page data (currentPage is 1-indexed for story pages)
  const pageData = pages[currentPage - 1];

  // Define stopAudio first (no dependencies)
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Generate and play audio for a specific page
  const generateAndPlayAudio = useCallback(async (text: string, isAutoAdvanceEnabled: boolean, currentPageNum: number, totalPages: number) => {
    if (!text) {
      toast.error('No content to read');
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateSpeech(text, {
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
        if (isAutoAdvanceEnabled && currentPageNum < totalPages) {
          // Set flag so the useEffect knows to auto-play after page change
          shouldAutoPlayRef.current = true;
          onPageChange(currentPageNum + 1);
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
  }, [narratorVoice, stopAudio, onPageChange]);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle page changes - stop current audio and auto-play if needed
  useEffect(() => {
    // Only act when page actually changed
    if (previousPageRef.current !== currentPage) {
      const wasAutoPlay = shouldAutoPlayRef.current;
      previousPageRef.current = currentPage;

      if (mode === 'page') {
        stopAudio();

        // If this was an auto-advance, trigger playback for the new page
        if (wasAutoPlay) {
          shouldAutoPlayRef.current = false;
          // Small delay to ensure state is updated, then generate audio for new page
          const newPageData = pages[currentPage - 1];
          if (newPageData?.content) {
            setTimeout(() => {
              generateAndPlayAudio(newPageData.content, autoAdvance, currentPage, pages.length);
            }, 100);
          }
        }
      }
    }
  }, [currentPage, mode, stopAudio, pages, autoAdvance, generateAndPlayAudio]);

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
    let textToRead: string;

    if (mode === 'page') {
      // Read current page only
      textToRead = pageData?.content || '';
      await generateAndPlayAudio(textToRead, autoAdvance, currentPage, pages.length);
    } else {
      // Read full story (all pages combined)
      textToRead = pages.map((p) => p.content).join('\n\n');
      await generateAndPlayAudio(textToRead, false, currentPage, pages.length);
    }
  }, [isPlaying, mode, pageData, pages, autoAdvance, currentPage, generateAndPlayAudio]);

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
