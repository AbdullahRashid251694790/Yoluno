/**
 * StorybookAudioControls Component
 *
 * Audio playback controls for storybook reading.
 * - Play: reads the current page, stays on it
 * - Auto: reads current page then advances and reads the next, and so on until the end
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Loader2, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSpeech, playAudioFromBase64 } from '@/services/textToSpeech';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { StoryPage } from '@/services/storyPages';
import type { NarratorVoice } from './NarratorVoiceSelector';

interface StorybookAudioControlsProps {
  storyId: string;
  pages: StoryPage[];
  currentPage: number; // 1-indexed (page 1 = first story page)
  narratorVoice: NarratorVoice;
  onPageChange: (page: number) => void;
  autoPlayOnStart?: boolean;
  onAutoPlayStarted?: () => void;
}

export function StorybookAudioControls({
  storyId,
  pages,
  currentPage,
  narratorVoice,
  onPageChange,
  autoPlayOnStart,
  onAutoPlayStarted,
}: StorybookAudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoModeRef = useRef(false); // ref to avoid stale closures
  const stoppedRef = useRef(false); // tracks if user explicitly stopped

  // Keep ref in sync with state
  useEffect(() => {
    autoModeRef.current = isAutoMode;
  }, [isAutoMode]);

  const getVoiceId = useCallback((): 'shimmer' | 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' => {
    if (narratorVoice.type === 'ai') {
      return narratorVoice.voiceId as 'shimmer' | 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx';
    }
    return 'nova';
  }, [narratorVoice]);

  const stopAudio = useCallback(() => {
    stoppedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsAutoMode(false);
  }, []);

  // Play audio for a given text, returns a promise that resolves when audio ends
  const playPageAudio = useCallback((text: string): Promise<'ended' | 'stopped'> => {
    return new Promise(async (resolve) => {
      if (!text) {
        resolve('ended');
        return;
      }

      setIsLoading(true);
      try {
        const response = await generateSpeech(text, { voice: getVoiceId() });

        // Check if user stopped while we were generating
        if (stoppedRef.current) {
          resolve('stopped');
          return;
        }

        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = playAudioFromBase64(response.audio);
        audioRef.current = audio;
        setIsPlaying(true);

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          audioRef.current = null;
          resolve('ended');
        });

        audio.addEventListener('error', () => {
          toast.error('Failed to play audio');
          setIsPlaying(false);
          audioRef.current = null;
          resolve('stopped');
        });
      } catch (error) {
        console.error('TTS error:', error);
        toast.error('Failed to generate audio');
        setIsPlaying(false);
        resolve('stopped');
      } finally {
        setIsLoading(false);
      }
    });
  }, [getVoiceId]);

  // Play current page only
  const handlePlay = useCallback(async () => {
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

    // Generate and play current page
    const pageData = pages[currentPage - 1];
    if (!pageData?.content) {
      toast.error('No content to read');
      return;
    }

    stoppedRef.current = false;
    setIsAutoMode(false);
    await playPageAudio(pageData.content);
  }, [isPlaying, pages, currentPage, playPageAudio]);

  // Auto mode: read current page, advance, read next, etc.
  const handleAutoPlay = useCallback(async () => {
    // If already in auto mode, stop
    if (isAutoMode) {
      stopAudio();
      return;
    }

    stoppedRef.current = false;
    setIsAutoMode(true);

    // Start from current page and read through to the end
    for (let pageIdx = currentPage; pageIdx <= pages.length; pageIdx++) {
      // Check if user stopped
      if (stoppedRef.current) break;

      // Navigate to the page (if not already there)
      if (pageIdx !== currentPage) {
        onPageChange(pageIdx);
      }

      const pageData = pages[pageIdx - 1];
      if (!pageData?.content) continue;

      // Small delay between pages for natural transition
      if (pageIdx !== currentPage) {
        await new Promise((r) => setTimeout(r, 500));
      }

      if (stoppedRef.current) break;

      const result = await playPageAudio(pageData.content);
      if (result === 'stopped') break;
    }

    // Done with all pages or stopped
    setIsAutoMode(false);
    setIsPlaying(false);
  }, [isAutoMode, currentPage, pages, onPageChange, playPageAudio, stopAudio]);

  // Stop audio when page changes manually (user swipes/clicks navigation)
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      // Only stop if NOT in auto mode (auto mode handles its own page changes)
      if (!autoModeRef.current && audioRef.current) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        setIsPlaying(false);
      }
    }
  }, [currentPage]);

  // Trigger auto play when coming from cover page "Tap to begin reading"
  const autoPlayTriggeredRef = useRef(false);
  useEffect(() => {
    if (autoPlayOnStart && !autoPlayTriggeredRef.current) {
      autoPlayTriggeredRef.current = true;
      onAutoPlayStarted?.();
      // Small delay to let the page render before starting audio
      setTimeout(() => handleAutoPlay(), 300);
    }
  }, [autoPlayOnStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Play/Pause button — reads current page only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlay}
        disabled={isLoading && !isAutoMode}
        className={cn(
          'rounded-full bg-white/20 hover:bg-white/30 text-white h-12 w-12',
          isPlaying && !isAutoMode && 'bg-white/30'
        )}
      >
        {isLoading && !isAutoMode ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isPlaying && !isAutoMode ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>

      {/* Stop button */}
      {(isPlaying || isAutoMode) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={stopAudio}
          className="rounded-full bg-white/20 hover:bg-white/30 text-white"
        >
          <Square className="h-5 w-5" />
        </Button>
      )}

      {/* Auto play toggle — reads all pages sequentially */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAutoPlay}
        disabled={isLoading && !isAutoMode}
        className={cn(
          'text-caption gap-1',
          isAutoMode
            ? 'text-white bg-white/30 hover:bg-white/20 hover:text-white'
            : 'text-white/70 hover:text-white hover:bg-white/20'
        )}
      >
        {isAutoMode && isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SkipForward className="h-4 w-4" />
        )}
        Auto
      </Button>
    </div>
  );
}
