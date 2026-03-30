/**
 * Kids Stories Page
 *
 * Display child's stories with option to create new ones.
 * Uses StorybookReader for new storybook-format stories.
 * Uses legacy dialog for older stories without pages.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStoriesByChild } from '@/hooks/queries/useStories';
import { QueryState } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, BookOpen, Star, Volume2, Pause, Square, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { StoryWithDetails } from '@/services/stories';
import { StorybookReader } from '@/components/storybook';
import { KidsStoryCreator } from '@/components/kids/story';
import { getUploadUrl } from '@/integrations/api/client';
import { generateSpeech, playAudioFromBase64, type TTSVoice } from '@/services/textToSpeech';

export function KidsStoriesPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { data: stories, isLoading, isError, refetch } = useStoriesByChild(childId);
  const [selectedStory, setSelectedStory] = useState<StoryWithDetails | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Legacy audio playback state (for old stories without pages)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if selected story has storybook pages
  const isStorybookFormat = selectedStory && (selectedStory as { has_pages?: boolean }).has_pages;

  // Get stored voice preference for legacy stories
  const getStoredVoice = useCallback((storyId: string): TTSVoice => {
    try {
      const voicePrefs = JSON.parse(localStorage.getItem('storyVoicePrefs') || '{}');
      return voicePrefs[storyId] || 'nova';
    } catch {
      return 'nova';
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setHasAudio(false);
  }, []);

  // Stop audio when dialog closes or story changes
  useEffect(() => {
    if (!selectedStory) {
      stopAudio();
    }
  }, [selectedStory, stopAudio]);

  const handlePlayAudio = useCallback(async () => {
    if (!selectedStory) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime > 0) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const voice = getStoredVoice(selectedStory.id);
      const response = await generateSpeech(selectedStory.content, { voice });

      stopAudio();

      const audio = playAudioFromBase64(response.audio);
      audioRef.current = audio;
      setIsPlaying(true);
      setHasAudio(true);

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setHasAudio(false);
        audioRef.current = null;
      });

      audio.addEventListener('error', () => {
        toast.error('Failed to play audio');
        setIsPlaying(false);
        setHasAudio(false);
        audioRef.current = null;
      });
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsLoadingAudio(false);
    }
  }, [selectedStory, isPlaying, getStoredVoice, stopAudio]);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  const handleCloseReader = () => {
    setSelectedStory(null);
  };

  const handleStoryCreated = (storyId: string) => {
    // Find the newly created story and open it
    refetch().then(() => {
      const newStory = stories?.find((s) => s.id === storyId);
      if (newStory) {
        setSelectedStory(newStory);
      }
    });
  };

  return (
    <div className="min-h-screen bg-kids-gradient safe-area-inset">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-body-lg font-display font-bold">My Stories</h1>

        {/* Create Story Button */}
        <Button
          size="icon"
          onClick={() => setIsCreatorOpen(true)}
          className="rounded-full bg-gradient-to-r from-primary/10 to-lolo/10 hover:from-primary/10 hover:to-lolo/10 shadow-lg"
        >
          <Sparkles className="h-5 w-5 text-white" />
        </Button>
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          data={stories}
          onRetry={refetch}
          emptyTitle="No stories yet!"
          emptyDescription="Tap the sparkle button to create your first story!"
          emptyIcon={BookOpen}
        >
          {(storyList) => (
            <div className="grid gap-4">
              {storyList.map((story) => {
                const hasPages = (story as { has_pages?: boolean }).has_pages;
                const coverUrl = (story as { cover_image_url?: string }).cover_image_url
                  || (story as { illustration_url?: string }).illustration_url;

                return (
                  <Card
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className="overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Cover thumbnail */}
                        <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-primary/20 to-lolo/20">
                          {coverUrl ? (
                            <img
                              src={getUploadUrl(coverUrl)}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Story info */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-display font-bold text-foreground truncate flex-1">
                              {story.title}
                            </h3>
                            {story.is_favorite && (
                              <Star className="h-4 w-4 text-lala fill-lala flex-shrink-0" />
                            )}
                          </div>
                          {story.theme && (
                            <p className="text-body-sm text-muted-foreground mt-0.5 capitalize">
                              {story.theme}
                            </p>
                          )}
                          <p className="text-caption text-muted-foreground mt-1">
                            {new Date(story.created_at).toLocaleDateString()}
                          </p>
                          {hasPages && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-caption rounded-full">
                              Storybook
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </QueryState>
      </main>

      {/* Storybook Reader - for new storybook format stories */}
      {selectedStory && isStorybookFormat && (
        <StorybookReader
          storyId={selectedStory.id}
          storyTitle={selectedStory.title}
          coverImageUrl={
            (selectedStory as { cover_image_url?: string }).cover_image_url ||
            (selectedStory as { illustration_url?: string }).illustration_url
          }
          theme={selectedStory.theme}
          mood={(selectedStory as { mood?: string }).mood}
          initialVoice={(selectedStory as { narrator_voice?: string }).narrator_voice || 'nova'}
          onClose={handleCloseReader}
        />
      )}

      {/* Legacy Story Dialog - for old stories without pages */}
      <Dialog open={!!selectedStory && !isStorybookFormat} onOpenChange={(open) => !open && setSelectedStory(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-b from-lolo/10 to-primary/10">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-body-lg font-display pr-8">
              {selectedStory?.title}
            </DialogTitle>
            {selectedStory?.theme && (
              <p className="text-body-sm text-muted-foreground">
                Theme: {selectedStory.theme}
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Illustration */}
            {(selectedStory as { illustration_url?: string })?.illustration_url && (
              <div className="rounded-xl overflow-hidden border-2 border-lolo">
                <img
                  src={getUploadUrl((selectedStory as { illustration_url?: string }).illustration_url!)}
                  alt={`Illustration for ${selectedStory?.title}`}
                  className="w-full h-auto max-h-[200px] object-cover"
                />
              </div>
            )}

            {/* Story Content */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {selectedStory?.content}
              </p>
            </div>
          </div>

          {/* Audio Controls & Mood */}
          <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex items-center justify-between">
              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayAudio}
                  disabled={isLoadingAudio}
                  className="gap-2"
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Read Aloud
                    </>
                  )}
                </Button>
                {(isPlaying || hasAudio) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopAudio}
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>

              {/* Mood */}
              {(selectedStory as { mood?: string })?.mood && (
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <span className="font-medium">Mood:</span>
                  <span className="capitalize">{(selectedStory as { mood?: string }).mood}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kids Story Creator */}
      {isCreatorOpen && (
        <KidsStoryCreator
          childId={childId!}
          onClose={() => setIsCreatorOpen(false)}
          onSuccess={handleStoryCreated}
        />
      )}
    </div>
  );
}
