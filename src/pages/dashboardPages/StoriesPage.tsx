/**
 * Stories Page
 *
 * Page for viewing and managing stories.
 * Parents can create stories for their children from here.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useRecentStories, useToggleFavorite } from '@/hooks/queries';
import { StoryCard } from '@/components/dashboard/stories/StoryCard';
import { QueryState } from '@/components/shared/feedback/QueryState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Plus } from 'lucide-react';

export function StoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children, isLoading: childrenLoading } = useChildProfiles(user?.id);
  const { data: stories, isLoading, isError, error, refetch } = useRecentStories(user?.id);
  const toggleFavorite = useToggleFavorite();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  const filteredStories = stories?.filter((story) => {
    if (selectedChildId !== 'all' && story.child_profile_id !== selectedChildId) return false;
    if (activeTab === 'favorites') return story.is_favorite;
    return true;
  });

  const handleToggleFavorite = (storyId: string, currentStatus: boolean) => {
    toggleFavorite.mutate({ id: storyId, isFavorite: !currentStatus });
  };

  const handleCreateStory = () => {
    if (selectedChildId && selectedChildId !== 'all') {
      navigate(`/story-wizard/${selectedChildId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-body-lg sm:text-h4 lg:text-h3 font-bold">Stories</h1>
          <p className="text-muted-foreground mt-1">
            View and manage stories created for your children.
          </p>
        </div>

        {/* Create Story Controls */}
        {children && children.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateStory} disabled={selectedChildId === 'all'} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Story
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <QueryState
            isLoading={isLoading || childrenLoading}
            isError={isError}
            error={error}
            data={filteredStories}
            loadingMessage="Loading stories..."
            emptyIcon={BookOpen}
            emptyTitle={activeTab === 'favorites' ? 'No favorites yet' : 'No stories yet'}
            emptyDescription={
              activeTab === 'favorites'
                ? 'Mark stories as favorites to see them here.'
                : 'Create your first story using the controls above!'
            }
            onRetry={refetch}
          >
            {(storyList) => (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {storyList.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onRead={() => {
                      // Navigate to kid's story view for reading
                      navigate(`/kids/${story.child_profile_id}/stories`);
                    }}
                    onToggleFavorite={() =>
                      handleToggleFavorite(story.id, story.is_favorite)
                    }
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
