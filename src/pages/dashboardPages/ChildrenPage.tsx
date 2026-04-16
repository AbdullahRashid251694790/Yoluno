/**
 * Children Management Page
 *
 * Visual design mirrors the loveable DashboardChildrenPage exactly; data
 * comes from the live database (useChildProfiles, useAnalyticsOverview,
 * useTodaysMood, etc.).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAnalyticsOverview } from '@/hooks/queries/useAnalytics';
import { useTodaysMood } from '@/hooks/queries/useMoodCheckin';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { EditChildDialog } from '@/components/dashboard/children/EditChildDialog';
import { BoundariesAtAGlance } from '@/components/dashboard/children/BoundariesAtAGlance';
import { LoadingState } from '@/components/shared';
import { Plus, Compass, BookOpen, Settings } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';
import type { ChildOverview } from '@/services/analytics';

const ACCENT_COLORS = [
  { bar: '#3ECDC6', bg: '#E8F6F4' },
  { bar: '#9B8FD0', bg: '#F3EFF8' },
  { bar: '#E8945A', bg: '#FEF0EA' },
];

const MOOD_EMOJI: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Happy' },
  sad: { emoji: '😢', label: 'Sad' },
  angry: { emoji: '😠', label: 'Angry' },
  scared: { emoji: '😨', label: 'Scared' },
  calm: { emoji: '😌', label: 'Calm' },
  worried: { emoji: '😟', label: 'Worried' },
  tired: { emoji: '😴', label: 'Tired' },
  excited: { emoji: '🤩', label: 'Excited' },
  notsure: { emoji: '🤔', label: 'Not sure' },
};

interface ChildDetailCardProps {
  child: ChildProfileWithAvatar;
  accent: { bar: string; bg: string };
  overview?: ChildOverview;
  onEdit: () => void;
}

function ChildDetailCard({ child, accent, overview, onEdit }: ChildDetailCardProps) {
  const { data: todayMood } = useTodaysMood(child.id);

  const avatarUrl = getUploadUrl(child.avatarUrl || child.custom_avatar_url);
  const activeLabel = child.last_active_at
    ? `Active ${formatRelativeTime(child.last_active_at)}`
    : 'Not active yet';

  const messages = overview?.weekly_activity.messages ?? 0;
  const stories = overview?.weekly_activity.stories ?? 0;
  const journeys = overview?.stats.total_journeys_completed ?? 0;
  const topics = overview?.chat_topics ?? [];
  const hasActivity = messages > 0 || stories > 0 || journeys > 0;

  const moodConfig = todayMood ? MOOD_EMOJI[todayMood.mood] : null;
  const moodTime = todayMood?.created_at
    ? new Date(todayMood.created_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: accent.bar }} />

      <div className="px-4 py-5 flex-1 flex flex-col">
        {/* Row 1: Avatar + Identity */}
        <div className="flex items-start gap-3.5 mb-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={child.name}
              className="w-14 h-14 rounded-full object-cover shrink-0"
              style={{ background: accent.bg }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[17px] shrink-0"
              style={{ background: accent.bg, fontWeight: 600, color: '#2A2926' }}
            >
              {getInitials(child.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-[18px] leading-tight"
              style={{ fontWeight: 600, color: '#2A2926' }}
            >
              {child.name}
            </p>
            <p className="text-[14px]" style={{ color: '#9B978E' }}>
              Age {child.age}
            </p>
          </div>
          <span
            className="text-[12px] shrink-0 pt-1"
            style={{ color: '#9B978E' }}
          >
            {activeLabel}
          </span>
        </div>

        {/* Row 2: Activity */}
        <div className="mb-4">
          {hasActivity ? (
            <p className="text-[13px]" style={{ color: '#6B675E' }}>
              {messages} questions · {stories} stories · {journeys} journeys
            </p>
          ) : (
            <p className="text-[13px] italic" style={{ color: '#9B978E' }}>
              No activity yet — they can start exploring anytime
            </p>
          )}
        </div>

        {/* Row 3: Topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topics.slice(0, 5).map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-[12px]"
                style={{ background: '#F5F3EE', color: '#6B675E' }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Row 4: Mood */}
        <div className="mb-5">
          {moodConfig ? (
            <p className="text-[13px]" style={{ color: '#6B675E' }}>
              {moodConfig.emoji} {moodConfig.label}
              {moodTime ? ` — checked in at ${moodTime}` : ''}
            </p>
          ) : (
            <p className="text-[12px]" style={{ color: '#9B978E' }}>
              Mood check-in will appear when they start today's session
            </p>
          )}
        </div>

        {/* Row 5: Actions — mt-auto pins this to the bottom so all cards in
            a row align their action buttons even when topic or mood rows
            have different heights. */}
        <div className="flex gap-1.5 mt-auto">
          <Link
            to={`/kids/${child.id}/mood`}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12.5px] transition hover:opacity-80 whitespace-nowrap"
            style={{ background: '#3ECDC6', color: '#FFFFFF', fontWeight: 600 }}
          >
            <Compass size={12} /> Explore
          </Link>
          <Link
            to="/dashboard/stories"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12.5px] transition hover:bg-[#F5F3EE] whitespace-nowrap"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E6E1',
              color: '#6B675E',
              fontWeight: 500,
            }}
          >
            <BookOpen size={12} /> Stories
          </Link>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12.5px] transition hover:bg-[#F5F3EE] whitespace-nowrap"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E6E1',
              color: '#6B675E',
              fontWeight: 500,
            }}
          >
            <Settings size={12} /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChildrenPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useChildProfiles(user?.id);
  const { data: analyticsOverview } = useAnalyticsOverview();
  const [editingChild, setEditingChild] = useState<ChildProfileWithAvatar | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading children..." />;
  }

  const overviewByChildId = new Map<string, ChildOverview>();
  analyticsOverview?.children.forEach((c) => {
    overviewByChildId.set(c.child.id, c);
  });

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Your Children
          </h1>
          <p className="text-[15px]" style={{ color: '#6B675E' }}>
            Manage profiles, review activity, and adjust settings for each child.
          </p>
        </div>
        <CreateChildDialog
          trigger={
            <button
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] transition hover:bg-[#E8F6F4] shrink-0 md:w-auto w-full justify-center"
              style={{
                fontWeight: 600,
                color: '#3ECDC6',
                border: '1px solid #3ECDC6',
                background: '#FFFFFF',
              }}
            >
              <Plus size={16} /> Add Child
            </button>
          }
        />
      </div>

      {children.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center mb-12"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <p className="text-[15px] mb-4" style={{ color: '#6B675E' }}>
            No children yet. Add your first child profile to get started with Yoluno.
          </p>
          <CreateChildDialog
            trigger={
              <button
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px]"
                style={{
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: '#3ECDC6',
                  border: 'none',
                }}
              >
                <Plus size={16} /> Add Your First Child
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Child Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {children.map((child, i) => (
              <ChildDetailCard
                key={child.id}
                child={child}
                accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                overview={overviewByChildId.get(child.id)}
                onEdit={() => setEditingChild(child)}
              />
            ))}
          </div>

          {/* Boundaries at a Glance */}
          <BoundariesAtAGlance children={children} />
        </>
      )}

      {/* Edit Child Dialog */}
      <EditChildDialog
        child={editingChild}
        open={!!editingChild}
        onOpenChange={(open) => {
          if (!open) setEditingChild(null);
        }}
        onSuccess={() => setEditingChild(null)}
        onDelete={() => setEditingChild(null)}
      />
    </div>
  );
}
