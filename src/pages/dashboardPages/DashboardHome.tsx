/**
 * Dashboard Home Page
 *
 * Main overview page for the parent dashboard.
 * Visual design mirrors the loveable reference; data comes from the live DB.
 */

import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { useAnalyticsOverview } from '@/hooks/queries/useAnalytics';
import { useTodaysMood } from '@/hooks/queries/useMoodCheckin';
import { useSharedMoments, useMarkSharedMomentSeen } from '@/hooks/queries/useSharedMoments';
import type { SharedMoment } from '@/services/sharedMoments';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { LoadingState } from '@/components/shared';
import { onMoodCheckin } from '@/integrations/api/socket';
import { queryKeys } from '@/hooks/queries/keys';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';
import {
  Info,
  ChevronRight,
  Plus,
  Compass,
  BookOpen,
  Settings,
  MessageCircle,
  Map,
  BarChart3,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';

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

// Loveable pastel avatar backgrounds — rotated per child
const AVATAR_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA', '#FDF6E8'];

function ChildMoodRow({ childId, childName }: { childId: string; childName: string }) {
  const { data: todayMood, isLoading } = useTodaysMood(childId);
  const config = todayMood ? MOOD_EMOJI[todayMood.mood] : null;
  const time = todayMood?.created_at
    ? new Date(todayMood.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[14px]" style={{ color: '#2A2926' }}>
        {childName}
      </span>
      {isLoading ? (
        <span className="text-[13px]" style={{ color: '#9B978E' }}>Loading…</span>
      ) : config ? (
        <span className="text-[13px]" style={{ color: '#6B675E' }}>
          {config.emoji} {config.label}
          {time ? ` — ${time}` : ''}
        </span>
      ) : (
        <span className="text-[13px]" style={{ color: '#9B978E' }}>
          Moods appear as your children start their sessions
        </span>
      )}
    </div>
  );
}

function formatSharedTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  if (isToday) return `Shared today at ${timeStr}`;
  if (isYesterday) return `Shared yesterday at ${timeStr}`;
  return `Shared ${date.toLocaleDateString()} at ${timeStr}`;
}

function SharedWithYouSection() {
  const { data: moments = [] } = useSharedMoments();
  const markSeen = useMarkSharedMomentSeen();

  if (moments.length === 0) return null;

  return (
    <div className="mb-7">
      <h2 className="text-[18px] mb-3" style={{ fontWeight: 600, color: '#2A2926' }}>
        Shared with you
      </h2>
      <div className="flex flex-col gap-3">
        {moments.map((m: SharedMoment) => (
          <div
            key={m.id}
            className="rounded-xl px-5 py-4"
            style={{ background: '#FDF6E8', borderLeft: '3px solid #D4A843' }}
          >
            <p className="text-[14px] mb-1.5" style={{ fontWeight: 500, color: '#2A2926' }}>
              {m.child_name} wanted to share this with you:
            </p>
            <p className="text-[16px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
              {m.title}
            </p>
            {m.context && (
              <p className="text-[14px] mb-1" style={{ color: '#6B675E' }}>
                {m.context}
              </p>
            )}
            {m.reflection && (
              <p className="text-[14px] mb-2 italic" style={{ color: '#6B675E' }}>
                "{m.reflection}"
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[12px]" style={{ color: '#9B978E' }}>
                {formatSharedTime(m.shared_at)}
              </span>
              <button
                onClick={() => markSeen.mutate(m.id)}
                className="text-[13px] hover:underline"
                style={{
                  color: '#3ECDC6',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Mark as seen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChildOverviewCardProps {
  child: ChildProfileWithAvatar;
  bg: string;
}

function ChildOverviewCard({ child, bg }: ChildOverviewCardProps) {
  const avatarUrl = getUploadUrl(child.avatarUrl || child.custom_avatar_url);
  const activeLabel = child.last_active_at
    ? `Active ${formatRelativeTime(child.last_active_at)}`
    : 'Not active yet';

  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[18px] mb-3 overflow-hidden"
        style={{ background: bg, fontWeight: 600, color: '#2A2926' }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={child.name} className="w-full h-full object-cover" />
        ) : (
          getInitials(child.name)
        )}
      </div>
      <p className="text-[15px] mb-0.5" style={{ fontWeight: 600, color: '#2A2926' }}>
        {child.name}
      </p>
      <p className="text-[13px] mb-1" style={{ color: '#6B675E' }}>
        {child.age} years old
      </p>
      <p className="text-[12px] mb-4" style={{ color: '#9B978E' }}>
        {activeLabel}
      </p>
      <div className="flex gap-2">
        <Link
          to={`/kids/${child.id}/mood`}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] transition hover:opacity-80"
          style={{ background: '#3ECDC6', color: '#FFFFFF', fontWeight: 600 }}
        >
          <Compass size={13} /> Explore
        </Link>
        <Link
          to="/dashboard/stories"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] transition hover:opacity-80"
          style={{ background: '#F3EFF8', color: '#6B675E', fontWeight: 500 }}
        >
          <BookOpen size={13} /> Story
        </Link>
        <Link
          to="/dashboard/children"
          className="p-1.5 rounded-full transition hover:bg-[#F5F3EE] flex items-center justify-center"
          style={{ color: '#9B978E' }}
          aria-label={`${child.name} settings`}
        >
          <Settings size={14} />
        </Link>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);
  const { data: analyticsOverview, isLoading: analyticsLoading } = useAnalyticsOverview();

  const unreadAlerts = safetyReports.length;

  useEffect(() => {
    const unsubscribe = onMoodCheckin(({ childId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moodCheckin.today(childId) });
    });
    return unsubscribe;
  }, [queryClient]);

  if (childrenLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const metrics = [
    {
      label: 'Topics Explored',
      value: analyticsLoading ? '…' : analyticsOverview?.topics_explored ?? 0,
      sub: 'across all children',
      bg: '#E8F6F4',
      icon: MessageCircle,
      iconColor: '#3ECDC6',
    },
    {
      label: 'Stories Created',
      value: analyticsLoading ? '…' : analyticsOverview?.stories_created ?? 0,
      sub: 'created together',
      bg: '#F3EFF8',
      icon: BookOpen,
      iconColor: '#9B8FD0',
    },
    {
      label: 'Active Journeys',
      value: analyticsLoading ? '…' : analyticsOverview?.active_journeys ?? 0,
      sub: 'in progress',
      bg: '#FEF0EA',
      icon: Map,
      iconColor: '#E8945A',
    },
    {
      label: 'Family Memories',
      value: analyticsLoading ? '…' : analyticsOverview?.family_memories ?? 0,
      sub: 'shared moments',
      bg: '#FDF6E8',
      icon: ImageIcon,
      iconColor: '#E8B630',
    },
  ];

  return (
    <div className="dashboard-scope">
      {/* Welcome */}
      <h1 className="text-[28px] mb-1" style={{ fontWeight: 700, color: '#2A2926' }}>
        Welcome back
      </h1>
      <p className="text-[15px] mb-6" style={{ color: '#6B675E' }}>
        Here's what's happening with your children's learning today.
      </p>

      {/* Safety Alert */}
      {unreadAlerts > 0 && (
        <Link
          to="/dashboard/safety"
          className="flex items-center gap-3 rounded-xl px-5 py-4 mb-7 transition hover:brightness-[0.98]"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E6E1',
            borderLeft: '3px solid #3ECDC6',
          }}
        >
          <Info size={20} style={{ color: '#3ECDC6', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-[14px]" style={{ fontWeight: 600, color: '#2A2926' }}>
              {unreadAlerts} item{unreadAlerts > 1 ? 's' : ''} need{unreadAlerts === 1 ? 's' : ''}{' '}
              your attention
            </p>
            <p className="text-[13px]" style={{ color: '#6B675E' }}>
              Tap to review the safety dashboard
            </p>
          </div>
          <ChevronRight size={18} style={{ color: '#9B978E' }} />
        </Link>
      )}

      {/* Children Overview */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px]" style={{ fontWeight: 600, color: '#2A2926' }}>
          Children Overview
        </h2>
        <CreateChildDialog
          trigger={
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] transition hover:bg-[#E8F6F4]"
              style={{
                fontWeight: 600,
                color: '#3ECDC6',
                border: '1px solid #3ECDC6',
                background: '#FFFFFF',
              }}
            >
              <Plus size={15} /> Add Child
            </button>
          }
        />
      </div>

      {children.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <p className="text-[15px] mb-3" style={{ color: '#6B675E' }}>
            No children yet. Add your first child profile to get started with Yoluno.
          </p>
          <CreateChildDialog
            trigger={
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px]"
                style={{
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: '#3ECDC6',
                  border: 'none',
                }}
              >
                <Plus size={15} /> Add Your First Child
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {children.map((child, i) => (
            <ChildOverviewCard
              key={child.id}
              child={child}
              bg={AVATAR_BGS[i % AVATAR_BGS.length]}
            />
          ))}
        </div>
      )}

      {/* Shared with you */}
      <SharedWithYouSection />

      {/* Today's Moods */}
      {children.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">💛</span>
              <h3 className="text-[16px]" style={{ fontWeight: 600, color: '#2A2926' }}>
                Today's Moods
              </h3>
            </div>
            <Link
              to="/dashboard/insights?tab=mood"
              className="text-[13px] flex items-center gap-1 hover:underline"
              style={{ color: '#6B675E' }}
            >
              View history <ChevronRight size={14} />
            </Link>
          </div>
          <p className="text-[14px] mb-3" style={{ color: '#9B978E' }}>
            How your children are feeling today
          </p>
          <div className="flex flex-col gap-2">
            {children.map((child) => (
              <ChildMoodRow key={child.id} childId={child.id} childName={child.name} />
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl p-5" style={{ background: m.bg }}>
              <div className="flex items-center gap-2 mb-2">
                <m.icon size={16} style={{ color: m.iconColor }} />
                <span className="text-[13px]" style={{ fontWeight: 500, color: '#6B675E' }}>
                  {m.label}
                </span>
              </div>
              <p className="text-[32px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
                {m.value}
              </p>
              <p className="text-[12px]" style={{ color: '#9B978E' }}>
                {m.sub}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* This Week's Progress */}
      {children.length > 0 && analyticsOverview && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px]" style={{ fontWeight: 600, color: '#2A2926' }}>
              This Week's Progress
            </h2>
            <Link
              to="/dashboard/insights"
              className="flex items-center gap-1 text-[13px] hover:underline"
              style={{ color: '#6B675E' }}
            >
              <BarChart3 size={14} /> View Details
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {analyticsOverview.children.map((childData) => (
              <div
                key={childData.child.id}
                className="rounded-2xl p-5"
                style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
              >
                <p className="text-[15px] mb-0.5" style={{ fontWeight: 600, color: '#2A2926' }}>
                  {childData.child.name}
                </p>
                <p className="text-[13px] mb-3" style={{ color: '#9B978E' }}>
                  Age {childData.child.age}
                </p>
                <div
                  className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] mb-3"
                  style={{ color: '#6B675E' }}
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={13} style={{ color: '#3ECDC6' }} />
                    {childData.weekly_activity.messages} messages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} style={{ color: '#9B8FD0' }} />
                    {childData.weekly_activity.stories} stories
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Compass size={13} style={{ color: '#E8945A' }} />
                    {childData.stats.total_journeys_completed} journeys
                  </span>
                </div>
                {childData.chat_topics.length > 0 && (
                  <div>
                    <p className="text-[12px] mb-1.5" style={{ color: '#9B978E' }}>
                      What they explored
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {childData.chat_topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-3 py-1 rounded-full text-[13px]"
                          style={{ background: '#F5F3EE', color: '#6B675E' }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="text-[18px] mb-4" style={{ fontWeight: 600, color: '#2A2926' }}>
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        {[
          { icon: BookOpen, label: 'View Stories', to: '/dashboard/stories' },
          { icon: Compass, label: 'Manage Journeys', to: '/dashboard/journeys' },
          { icon: BarChart3, label: 'View Insights', to: '/dashboard/insights' },
          { icon: Shield, label: 'Safety Settings', to: '/dashboard/safety' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] transition hover:bg-[#F5F3EE]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E6E1',
              color: '#6B675E',
              fontWeight: 500,
            }}
          >
            <action.icon size={15} style={{ color: '#9B978E' }} /> {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
