/**
 * Story List
 *
 * Grid of story cards with filtering.
 */

import { useState } from 'react';
import { useRecentStories, useToggleFavorite, useDeleteStory } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { StoryCard } from './StoryCard';
import { QueryState } from '@/components/shared/feedback/QueryState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen } from 'lucide-react';

export function StoryList() {
  const { user } = useAuth();
  const { data: stories, isLoading, isError, error, refetch } = useRecentStories(user?.id);
  const toggleFavorite = useToggleFavorite();
  const deleteStory = useDeleteStory();
  const [activeTab, setActiveTab] = useState('all');

  const filteredStories = stories?.filter((story) => {
    if (activeTab === 'favorites') return story.is_favorite;
    return true;
  });

  const handleToggleFavorite = (storyId: string, currentStatus: boolean) => {
    toggleFavorite.mutate({ id: storyId, isFavorite: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h4 font-bold">Stories</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={filteredStories}
            loadingMessage="Loading stories..."
            emptyIcon={BookOpen}
            emptyTitle={activeTab === 'favorites' ? 'No favorites yet' : 'No stories yet'}
            emptyDescription={
              activeTab === 'favorites'
                ? 'Mark stories as favorites to see them here.'
                : 'Create your first story using the Story Wizard!'
            }
            onRetry={refetch}
          >
            {(storyList) => (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {storyList.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onRead={() => {
                      // TODO: Open story reader
                    }}
                    onToggleFavorite={() =>
                      handleToggleFavorite(story.id, story.is_favorite)
                    }
                    onDelete={() => {
                      if (window.confirm('Are you sure you want to delete this story?')) {
                        deleteStory.mutate(story.id);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </QueryState>
        </TabsContent>
      </Tabs>
    </div>
  );
}
