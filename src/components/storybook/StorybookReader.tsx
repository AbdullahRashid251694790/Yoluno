/**
 * StorybookReader Component
 *
 * Full-screen storybook reader with page navigation and audio controls.
 * Supports AI TTS voices and Voice Vault family recordings.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/hooks/queries/keys';
import { useStory } from '@/hooks/queries';
import { useStoryPages, useIllustrationStatus } from '@/hooks/queries/useStoryPages';
import { StorybookCover } from './StorybookCover';
import { StorybookPage } from './StorybookPage';
import { StorybookNavigation } from './StorybookNavigation';
import { StorybookAudioControls } from './StorybookAudioControls';
import { NarratorVoiceSelector, type NarratorVoice } from './NarratorVoiceSelector';
import { cn } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';
import { apiClient } from '@/integrations/api/client';
import { ShareWithParentButton } from '@/components/kids/ShareWithParentButton';

interface StorybookReaderProps {
  storyId: string;
  storyTitle: string;
  coverImageUrl?: string | null;
  theme?: string | null;
  mood?: string | null;
  childId?: string;
  initialVoice?: string;
  onClose: () => void;
}

export function StorybookReader({
  storyId,
  storyTitle,
  coverImageUrl,
  theme,
  mood,
  childId,
  initialVoice = 'nova',
  onClose,
}: StorybookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1+ = story pages
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [autoPlayOnStart, setAutoPlayOnStart] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [narratorVoice, setNarratorVoice] = useState<NarratorVoice>({
    type: 'ai',
    voiceId: initialVoice,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const prevInProgressRef = useRef(true);

  // Fetch story data (for live cover image updates)
  const { data: storyData } = useStory(storyId);
  const liveCoverUrl = (storyData as { cover_image_url?: string })?.cover_image_url;
  const resolvedCoverUrl = liveCoverUrl || coverImageUrl;

  // Poll illustration status (for the progress counter)
  const { data: illustrationStatus } = useIllustrationStatus(storyId);

  // Check if illustrations are still being generated (from status polling)
  const illustrationsInProgress = !!illustrationStatus &&
    illustrationStatus.completed + illustrationStatus.failed < illustrationStatus.total_pages;

  // Fetch story pages — polls every 4s while illustrations are in progress
  const { data: pages, isLoading: isLoadingPages } = useStoryPages(storyId, {
    illustrationsInProgress,
  });

  // Final refetch when all illustrations complete (catches the last image + cover)
  useEffect(() => {
    if (prevInProgressRef.current && !illustrationsInProgress && storyId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.storyPages.forStory(storyId),
      });
      // Also refresh stories list to pick up the cover image
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.all,
      });
    }
    prevInProgressRef.current = illustrationsInProgress;
  }, [illustrationsInProgress, storyId, queryClient]);

  const totalPages = (pages?.length ?? 0) + 1; // +1 for cover
  const progressLoadedRef = useRef(false);

  // Load saved reading progress on mount (kids only)
  useEffect(() => {
    if (!childId || !storyId || progressLoadedRef.current || totalPages <= 1) return;
    apiClient
      .get<{ last_page_read: number; total_pages: number }>(
        `/stories/${storyId}/progress/${childId}`
      )
      .then((res) => {
        const { last_page_read } = res.data;
        if (last_page_read > 0 && last_page_read < totalPages) {
          setCurrentPage(last_page_read);
        }
        progressLoadedRef.current = true;
      })
      .catch(() => {
        progressLoadedRef.current = true;
      });
  }, [childId, storyId, totalPages]);

  // Save progress on every page change (kids only, fire-and-forget)
  useEffect(() => {
    if (!childId || !storyId || currentPage === 0 || totalPages <= 1) return;
    apiClient
      .post(`/stories/${storyId}/progress`, {
        child_profile_id: childId,
        last_page_read: currentPage,
        total_pages: totalPages,
      })
      .catch(() => {});
  }, [childId, storyId, currentPage, totalPages]);

  // Regenerate failed illustrations (resets failed → pending, server re-queues them)
  const handleRegenerateIllustrations = useCallback(async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      await apiClient.post(`/generate-story/${storyId}/regenerate-illustrations`);
      // Invalidate so the reader picks up the new 'pending' status and resumes polling
      queryClient.invalidateQueries({ queryKey: queryKeys.storyPages.forStory(storyId) });
    } catch (error) {
      console.error('Failed to regenerate illustrations:', error);
    } finally {
      setIsRegenerating(false);
    }
  }, [storyId, isRegenerating, queryClient]);

  // Preload adjacent page images so transitions are instant
  useEffect(() => {
    if (!pages) return;
    const pagesToPreload = [currentPage, currentPage + 1].filter(
      (p) => p >= 1 && p <= (pages.length ?? 0)
    );
    for (const p of pagesToPreload) {
      const page = pages[p - 1];
      if (page?.illustration_url) {
        const url = getUploadUrl(page.illustration_url);
        if (url) {
          const img = new Image();
          img.src = url;
        }
      }
    }
  }, [currentPage, pages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onClose]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentPage, totalPages, isTransitioning]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage((prev) => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentPage, isTransitioning]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages && page !== currentPage && !isTransitioning) {
        setIsTransitioning(true);
        setCurrentPage(page);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    },
    [currentPage, totalPages, isTransitioning]
  );

  // Handle swipe gestures
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    }

    touchStartX.current = null;
  };

  // Handle tap navigation (tap left 20% = prev, right 20% = next)
  const handleTap = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.2) {
      goToPreviousPage();
    } else if (x > width * 0.8) {
      goToNextPage();
    }
  };

  // Get current page data
  const getCurrentPageData = () => {
    if (currentPage === 0) return null; // Cover page
    return pages?.[currentPage - 1] ?? null;
  };

  const currentPageData = getCurrentPageData();

  // Calculate illustration progress
  const illustrationProgress = illustrationStatus
    ? {
        completed: illustrationStatus.completed,
        total: illustrationStatus.total_pages,
        percentage: Math.round(
          (illustrationStatus.completed / illustrationStatus.total_pages) * 100
        ),
      }
    : null;

  if (isLoadingPages) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-body-lg">Loading storybook...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Voice selector toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setShowVoiceSelector(!showVoiceSelector);
          }}
          className="rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Voice selector dropdown */}
      {showVoiceSelector && (
        <div
          className="absolute top-16 right-4 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <NarratorVoiceSelector
            value={narratorVoice}
            onChange={(voice) => {
              setNarratorVoice(voice);
              setShowVoiceSelector(false);
            }}
            childId={childId}
            className="w-48 bg-black/80 border-white/20 text-white"
          />
        </div>
      )}

      {/* Illustration progress indicator */}
      {illustrationProgress && illustrationProgress.completed < illustrationProgress.total && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2 text-white text-body-sm">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          Generating illustrations: {illustrationProgress.completed}/{illustrationProgress.total}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
        <div
          className={cn(
            'w-full h-full max-w-2xl rounded-2xl overflow-hidden transition-all duration-300',
            isTransitioning && 'opacity-0 scale-95'
          )}
        >
          {currentPage === 0 ? (
            <StorybookCover
              title={storyTitle}
              coverImageUrl={resolvedCoverUrl ? getUploadUrl(resolvedCoverUrl) : undefined}
              theme={theme}
              mood={mood}
              onStart={() => { setAutoPlayOnStart(true); goToNextPage(); }}
            />
          ) : (
            <StorybookPage
              page={currentPageData!}
              pageNumber={currentPage}
              totalPages={totalPages - 1}
              isActive={!isTransitioning}
              onRegenerate={currentPageData?.illustration_status === 'failed' ? handleRegenerateIllustrations : undefined}
              isRegenerating={isRegenerating}
            />
          )}
        </div>
      </div>

      {/* Navigation and Audio Controls */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Share with parent button moved to My Moments page
          {childId && currentPage === totalPages - 1 && totalPages > 1 && (
            <div className="flex justify-center">
              <ShareWithParentButton
                childId={childId}
                momentType="story_read"
                title={`Finished reading — ${storyTitle}`}
                context={`${storyTitle} — all ${totalPages - 1} pages read`}
                referenceId={storyId}
                label="Share with your parent"
                className="shadow-lg"
              />
            </div>
          )}
          */}

          {/* Audio controls (only show on story pages) */}
          {currentPage > 0 && currentPageData && (
            <StorybookAudioControls
              storyId={storyId}
              pages={pages || []}
              currentPage={currentPage}
              narratorVoice={narratorVoice}
              onPageChange={goToPage}
              autoPlayOnStart={autoPlayOnStart}
              onAutoPlayStarted={() => setAutoPlayOnStart(false)}
            />
          )}

          {/* Navigation */}
          <StorybookNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            onGoToPage={goToPage}
          />
        </div>
      </div>
    </div>
  );
}
