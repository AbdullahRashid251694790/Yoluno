/**
 * Kids Stories Page
 *
 * Display child's stories with option to create new ones.
 * Uses StorybookReader for immersive reading experience.
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStoriesByChild } from '@/hooks/queries/useStories';
import { QueryState } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, BookOpen, Star } from 'lucide-react';
import type { StoryWithDetails } from '@/services/stories';
import { StorybookReader } from '@/components/storybook';
import { getUploadUrl } from '@/integrations/api/client';

export function KidsStoriesPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { data: stories, isLoading, isError, refetch } = useStoriesByChild(childId);
  const [selectedStory, setSelectedStory] = useState<StoryWithDetails | null>(null);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  const handleCloseReader = () => {
    setSelectedStory(null);
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

        <h1 className="text-xl font-display font-bold">My Stories</h1>

        <Link to={`/story-wizard/${childId}`}>
          <Button
            size="icon"
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          data={stories}
          onRetry={refetch}
          emptyTitle="No stories yet!"
          emptyDescription="Create your first magical story"
          emptyIcon={BookOpen}
          emptyAction={{
            label: 'Create Story',
            onClick: () => navigate(`/story-wizard/${childId}`),
          }}
        >
          {(storyList) => (
            <div className="grid gap-4">
              {storyList.map((story) => {
                // Get cover image URL - prefer cover_image_url, fallback to illustration_url
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
                        <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-purple-200 to-pink-200">
                          {coverUrl ? (
                            <img
                              src={getUploadUrl(coverUrl)}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-purple-400" />
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
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          {story.theme && (
                            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                              {story.theme}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(story.created_at).toLocaleDateString()}
                          </p>
                          {/* Show badge if it's a storybook */}
                          {(story as { has_pages?: boolean }).has_pages && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
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

      {/* Storybook Reader */}
      {selectedStory && (
        <StorybookReader
          storyId={selectedStory.id}
          storyTitle={selectedStory.title}
          coverImageUrl={
            (selectedStory as { cover_image_url?: string }).cover_image_url ||
            (selectedStory as { illustration_url?: string }).illustration_url
          }
          theme={selectedStory.theme}
          mood={(selectedStory as { mood?: string }).mood}
          narratorVoice={(selectedStory as { narrator_voice?: string }).narrator_voice || 'nova'}
          onClose={handleCloseReader}
        />
      )}
    </div>
  );
}
