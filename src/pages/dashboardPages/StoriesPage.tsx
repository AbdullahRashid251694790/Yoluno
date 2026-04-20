/**
 * Stories Page
 *
 * Visual design mirrors loveable DashboardStoriesPage exactly; data from DB.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useRecentStories, useToggleFavorite } from '@/hooks/queries';
import { StorybookReader } from '@/components/storybook/StorybookReader';
import { LoadingSpinner } from '@/components/shared';
import { getUploadUrl, apiClient } from '@/integrations/api/client';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  BookOpen,
  Play,
  ChevronDown,
} from 'lucide-react';
import type { StoryRow } from '@/types/database';

type TabKey = 'all' | 'in-progress' | 'completed' | 'favorites';

const CHILD_COLORS = ['#3ECDC6', '#B8A5D4', '#E8945A', '#D4A843', '#9B8FD0'];
const CHILD_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA', '#FDF6E8', '#F3EFF8'];

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Extract a short 1-word label from a theme string (strip articles, take first meaningful word)
function shortTheme(theme: string | null | undefined): string {
  if (!theme) return '';
  const cleaned = theme.replace(/[!?.,]/g, '').trim();
  const words = cleaned.split(/\s+/);
  const STOP = new Set(['a', 'an', 'the', 'some', 'something', 'surprise', 'me']);
  const pick = words.find((w) => !STOP.has(w.toLowerCase())) || words[0] || '';
  return pick.replace(/-.*$/, '');
}

export function StoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children = [] } = useChildProfiles(user?.id);
  const { data: stories = [], isLoading } = useRecentStories(user?.id);
  const toggleFavorite = useToggleFavorite();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [childFilter, setChildFilter] = useState('all');
  const [readingStory, setReadingStory] = useState<StoryRow | null>(null);

  // Build child lookup with avatar URLs
  const childMap = useMemo(() => {
    const map: Record<string, { name: string; initial: string; bg: string; avatarUrl: string | undefined }> = {};
    children.forEach((c, i) => {
      map[c.id] = {
        name: c.name,
        initial: c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        bg: CHILD_BGS[i % CHILD_BGS.length],
        avatarUrl: getUploadUrl(c.avatarUrl || c.custom_avatar_url) || undefined,
      };
    });
    return map;
  }, [children]);

  // Local favorites set — synced from story data
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(() =>
    new Set(stories.filter((s) => s.is_favorite).map((s) => s.id))
  );

  const handleToggleFav = (id: string) => {
    const current = localFavorites.has(id);
    setLocalFavorites((prev) => {
      const n = new Set(prev);
      current ? n.delete(id) : n.add(id);
      return n;
    });
    toggleFavorite.mutate({ id, isFavorite: !current });
  };

  // Fetch reading progress for all children
  interface ReadingProgress {
    story_id: string;
    child_profile_id: string;
    last_page_read: number;
    total_pages: number;
  }
  const { data: readingProgress = [] } = useQuery<ReadingProgress[]>({
    queryKey: ['story-reading-progress'],
    queryFn: async () => {
      const res = await apiClient.get<ReadingProgress[]>('/stories/reading-progress');
      return res.data;
    },
    staleTime: 30_000,
  });

  // Build a map: storyId → best progress across children
  const progressByStory = useMemo(() => {
    const map: Record<string, ReadingProgress> = {};
    readingProgress.forEach((p) => {
      const existing = map[p.story_id];
      // Keep the one with most progress
      if (!existing || p.last_page_read > existing.last_page_read) {
        map[p.story_id] = p;
      }
    });
    return map;
  }, [readingProgress]);

  // Derive status: if a child has started reading but not finished → in-progress
  // If they reached the last page → completed. Otherwise → not-started.
  const getStatus = (s: StoryRow): 'completed' | 'in-progress' | 'not-started' => {
    const progress = progressByStory[s.id];
    if (!progress || progress.last_page_read === 0) return 'not-started';
    if (progress.last_page_read >= progress.total_pages - 1) return 'completed';
    return 'in-progress';
  };

  const filtered = stories.filter((s) => {
    if (childFilter !== 'all' && s.child_profile_id !== childFilter) return false;
    if (activeTab === 'in-progress' && getStatus(s) !== 'in-progress') return false;
    if (activeTab === 'completed' && getStatus(s) !== 'completed') return false;
    if (activeTab === 'favorites' && !localFavorites.has(s.id)) return false;
    return true;
  });

  const totalStories = stories.length;
  const inProgressCount = stories.filter((s) => getStatus(s) === 'in-progress').length;
  const completedCount = stories.filter((s) => getStatus(s) === 'completed').length;
  const favCount = localFavorites.size;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Stories' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'favorites', label: 'Favorites' },
  ];

  const handleCreateStory = () => {
    const childId = childFilter !== 'all' ? childFilter : children[0]?.id;
    if (childId) navigate(`/story-wizard/${childId}?from=dashboard`);
  };

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Your Children's Stories
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Every story your children have created with Lumi — read, print, or let them
            continue where they left off.
          </p>
        </div>
        <button
          onClick={handleCreateStory}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] transition hover:bg-[#F3EFF8] shrink-0 md:w-auto w-full justify-center"
          style={{
            fontWeight: 600,
            color: '#B8A5D4',
            border: '1px solid #B8A5D4',
            background: '#FFFFFF',
          }}
        >
          <Play size={14} /> Start a Story Session
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div
          className="flex gap-1 p-1 rounded-lg overflow-x-auto"
          style={{ background: '#F5F3EE' }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-4 py-2 rounded-md text-[13px] whitespace-nowrap transition"
              style={{
                fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? '#2A2926' : '#6B675E',
                background: activeTab === t.key ? '#FFFFFF' : 'transparent',
                boxShadow:
                  activeTab === t.key ? '0 1px 3px rgba(42,41,38,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={childFilter}
            onChange={(e) => setChildFilter(e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 rounded-lg text-[13px] border cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderColor: '#E8E6E1',
              color: '#2A2926',
            }}
          >
            <option value="all">All children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#9B978E' }}
          />
        </div>
      </div>

      {/* Stats */}
      <p className="text-[13px] mb-6" style={{ color: '#9B978E' }}>
        {totalStories} stories created · {inProgressCount} in progress · {completedCount} completed
        · {favCount} favorited
      </p>

      {/* Story Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen
            size={36}
            className="mx-auto mb-3 opacity-30"
            style={{ color: '#B8A5D4' }}
          />
          <p className="text-[15px]" style={{ color: '#9B978E' }}>
            {activeTab === 'favorites'
              ? 'No favorites yet — tap the heart on any story to save it here.'
              : 'No stories yet — when your children create a story with Lumi, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((story) => {
            const child = childMap[story.child_profile_id];
            const status = getStatus(story);
            const coverUrl = getUploadUrl(
              (story as any).cover_image_url || story.illustration_url
            );
            const isFav = localFavorites.has(story.id);
            const tags = [
              shortTheme(story.theme),
              story.mood,
              ...(story.values?.slice(0, 1) || []),
            ].filter(Boolean) as string[];

            return (
              <div
                key={story.id}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
              >
                {/* Cover / illustration */}
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #F3EFF8, #E8E6F0)',
                    aspectRatio: '1 / 1',
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen
                      size={28}
                      style={{ color: '#B8A5D4', opacity: 0.5 }}
                    />
                  )}
                </div>

                <div className="p-5">
                  {/* Child attribution */}
                  <div className="flex items-center gap-2 mb-2">
                    {child?.avatarUrl ? (
                      <img
                        src={child.avatarUrl}
                        alt={child.name}
                        className="w-6 h-6 rounded-full object-cover"
                        style={{ background: child.bg }}
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                        style={{
                          background: child?.bg || '#F5F3EE',
                          fontWeight: 600,
                          color: '#2A2926',
                        }}
                      >
                        {child?.initial || '?'}
                      </div>
                    )}
                    <span className="text-[12px]" style={{ color: '#9B978E' }}>
                      {(story as any).child_name || child?.name || 'Child'} · with
                      Lumi
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[16px] mb-1.5 line-clamp-2"
                    style={{ fontWeight: 600, color: '#2A2926' }}
                  >
                    {story.title}
                  </h3>

                  {/* Preview */}
                  <p
                    className="text-[13px] mb-3 line-clamp-2"
                    style={{ color: '#6B675E', lineHeight: 1.5 }}
                  >
                    {story.content?.slice(0, 160)}...
                  </p>

                  {/* Status + Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {status === 'in-progress' && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{
                          background: '#F3EFF8',
                          color: '#B8A5D4',
                          fontWeight: 600,
                        }}
                      >
                        In Progress
                      </span>
                    )}
                    {status === 'completed' && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{
                          background: '#E8F6F4',
                          color: '#3ECDC6',
                          fontWeight: 600,
                        }}
                      >
                        Complete
                      </span>
                    )}
                    {status === 'not-started' && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{
                          background: '#F5F3EE',
                          color: '#9B978E',
                          fontWeight: 500,
                        }}
                      >
                        New
                      </span>
                    )}
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-xl text-[11px]"
                        style={{ background: '#F5F3EE', color: '#9B978E' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: '#9B978E' }}>
                      {formatRelativeDate(story.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReadingStory(story)}
                        className="px-3 py-1.5 rounded-full text-[12px] transition hover:bg-[#F5F3EE]"
                        style={{
                          border: '1px solid #E8E6E1',
                          color: '#6B675E',
                          fontWeight: 500,
                        }}
                      >
                        Read
                      </button>
                      <button
                        onClick={() => handleToggleFav(story.id)}
                        className="p-1 transition hover:scale-110"
                        aria-label="Favorite"
                      >
                        <Heart
                          size={16}
                          fill={isFav ? '#D4A843' : 'none'}
                          style={{
                            color: isFav ? '#D4A843' : '#9B978E',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Story Reader Overlay */}
      {readingStory && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <StorybookReader
            storyId={readingStory.id}
            storyTitle={readingStory.title}
            coverImageUrl={
              (readingStory as any).cover_image_url || readingStory.illustration_url
            }
            theme={readingStory.theme}
            mood={readingStory.mood}
            initialVoice={
              (readingStory as any).narrator_voice || 'nova'
            }
            onClose={() => setReadingStory(null)}
          />
        </div>
      )}
    </div>
  );
}
