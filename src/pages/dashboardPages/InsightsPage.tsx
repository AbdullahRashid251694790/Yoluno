/**
 * Insights Page
 *
 * Parent dashboard analytics view. Markup mirrors the loveable
 * DashboardInsightsPage exactly; every tab is wired to real database data.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useActivityTimeline,
  useWeeklySummary,
  useChatTopics,
  useJourneyProgressAnalytics,
  useAnalyticsOverview,
} from '@/hooks/queries/useAnalytics';
import { useMoodHistory } from '@/hooks/queries/useMoodCheckin';
import { useChildSharedMoments } from '@/hooks/queries/useSharedMoments';
import { LoadingSpinner } from '@/components/shared';
import {
  ChevronDown,
  MessageCircle,
  BookOpen,
  Map,
  Heart,
  Eye,
} from 'lucide-react';
import type { MoodType } from '@/services/moodCheckin';
import type { SharedMomentType } from '@/services/sharedMoments';

type Tab = 'topics' | 'mood' | 'activity' | 'journeys' | 'moments';

const VALID_TABS: Tab[] = ['topics', 'mood', 'activity', 'journeys', 'moments'];

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  calm: '😌',
  worried: '😟',
  tired: '😴',
  excited: '🤩',
  notsure: '🤔',
};

const MOOD_LABEL: Record<MoodType, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  calm: 'Calm',
  worried: 'Worried',
  tired: 'Tired',
  excited: 'Excited',
  notsure: 'Not sure',
};

const MOMENT_COLORS: Record<SharedMomentType | 'curiosity' | 'family' | 'mood', { border: string; bg: string }> = {
  journey_complete: { border: '#E8946A', bg: '#FEF0EA' },
  story_created: { border: '#B8A5D4', bg: '#F3EFF8' },
  story_read: { border: '#B8A5D4', bg: '#F3EFF8' },
  curiosity: { border: '#3ECDC6', bg: '#E8F6F4' },
  family: { border: '#D4A843', bg: '#FDF6E8' },
  mood: { border: '#9B978E', bg: '#F5F3EE' },
};

const JOURNEY_PALETTE = ['#B8A5D4', '#E8946A', '#3ECDC6', '#D4A843'];

function formatShortDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatLongDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InsightsPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'topics'
  );

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const { data: overview } = useAnalyticsOverview();

  const activeChildId = selectedChildId || children[0]?.id || '';
  const selectedChild = children.find((c) => c.id === activeChildId);

  // All data queries scoped to the active child
  const { data: activityTimeline = [] } = useActivityTimeline(activeChildId, 7);
  const { data: weeklySummary } = useWeeklySummary(activeChildId);
  const { data: chatTopics = [] } = useChatTopics(activeChildId, 5);
  const { data: journeyProgress = [] } = useJourneyProgressAnalytics(activeChildId);
  const { data: moodHistory = [] } = useMoodHistory(activeChildId, 14);
  const { data: childMoments = [] } = useChildSharedMoments(activeChildId);

  // Metric 1: Questions asked this week (weekly summary)
  const questionsAsked = parseInt(String(weeklySummary?.total_messages ?? '0'), 10);
  const questionsPerDay = Math.round(questionsAsked / 7);

  // Metric 2: Stories created this week
  const storiesCreated = parseInt(String(weeklySummary?.total_stories ?? '0'), 10);

  // Metric 3: Most recently active journey
  const activeJourney = useMemo(
    () => journeyProgress.find((j) => j.status === 'active'),
    [journeyProgress]
  );

  // Metric 4: Family memories count from overview
  const familyMemories = overview?.family_memories ?? 0;

  // Topics tab: top 5 topics by mention count
  const maxTopicCount = useMemo(
    () => Math.max(1, ...chatTopics.map((t) => t.mention_count)),
    [chatTopics]
  );
  const curriculumAreas = useMemo(() => {
    const set = new Set<string>();
    chatTopics.forEach((t) => {
      if (t.category_name) set.add(t.category_name);
    });
    return Array.from(set);
  }, [chatTopics]);

  // Mood tab: 14 days, oldest → newest, with empty placeholders for missing days
  const moodGrid = useMemo(() => {
    const items: { day: string; emoji: string | null; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Map existing entries by YYYY-MM-DD
    const moodByDate = new Map<string, MoodType>();
    moodHistory.forEach((entry) => {
      const d = new Date(entry.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      if (!moodByDate.has(key)) moodByDate.set(key, entry.mood);
    });

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const mood = moodByDate.get(key);
      items.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        emoji: mood ? MOOD_EMOJI[mood] : null,
        isToday: i === 0,
      });
    }
    return items;
  }, [moodHistory]);

  // Most common mood
  const moodStats = useMemo(() => {
    if (moodHistory.length === 0) return null;
    const counts: Partial<Record<MoodType, number>> = {};
    moodHistory.forEach((m) => {
      counts[m.mood] = (counts[m.mood] ?? 0) + 1;
    });
    const sorted = (Object.entries(counts) as [MoodType, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    const top = sorted[0];
    const transitions = [...moodHistory]
      .slice(0, 4)
      .reverse()
      .map((m) => MOOD_LABEL[m.mood]);
    return {
      topMood: top[0],
      topCount: top[1],
      totalDays: moodHistory.length,
      transitions,
    };
  }, [moodHistory]);

  // Activity tab: max minutes for bar chart
  const maxMinutes = useMemo(
    () =>
      Math.max(
        1,
        ...activityTimeline.map(
          (d) => d.message_count + d.story_count * 2 + d.journey_steps_completed * 2
        )
      ),
    [activityTimeline]
  );

  // Journeys tab
  const activeJourneys = journeyProgress.filter((j) => j.status === 'active');
  const completedJourneys = journeyProgress.filter((j) => j.status === 'completed');

  // Weekly summary sentence — computed client-side
  const weeklySummarySentence = useMemo(() => {
    if (!selectedChild) return '';
    const parts: string[] = [];
    if (chatTopics.length > 0) {
      const topTopic = chatTopics[0].topic;
      parts.push(`was most curious about ${topTopic}`);
    }
    if (storiesCreated > 0) {
      parts.push(`created ${storiesCreated} ${storiesCreated === 1 ? 'story' : 'stories'}`);
    }
    if (activeJourney) {
      parts.push(
        `reached step ${activeJourney.steps_completed} of ${activeJourney.total_steps} of ${activeJourney.title}`
      );
    }
    if (moodStats) {
      parts.push(`checked in as ${MOOD_LABEL[moodStats.topMood].toLowerCase()} most days`);
    }

    if (parts.length === 0) {
      return `This week, ${selectedChild.name} hasn't logged much activity yet — that's okay. A gentle prompt at check-in time can help.`;
    }
    return `This week, ${selectedChild.name} ${parts.join(', and ')}.`;
  }, [selectedChild, chatTopics, storiesCreated, activeJourney, moodStats]);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <p className="text-[15px]" style={{ color: '#6B675E' }}>
          Add a child profile to start seeing insights.
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'topics', label: 'Topics' },
    { key: 'mood', label: 'Mood' },
    { key: 'activity', label: 'Activity' },
    { key: 'journeys', label: 'Journeys' },
    { key: 'moments', label: 'Moments' },
  ];

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Insights
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Understand what your child is curious about, how they're feeling, and how
            they're growing — without hovering.
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            value={activeChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-lg text-[14px] border cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderColor: '#E8E6E1',
              color: '#2A2926',
              fontWeight: 500,
            }}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#9B978E' }}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: '#E8F6F4' }}>
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={15} style={{ color: '#3ECDC6' }} />
            <span className="text-[13px]" style={{ fontWeight: 500, color: '#6B675E' }}>
              Questions Asked
            </span>
          </div>
          <p className="text-[32px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
            {questionsAsked}
          </p>
          <p className="text-[12px]" style={{ color: '#9B978E' }}>
            this week · ~{questionsPerDay} per day
          </p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#F3EFF8' }}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} style={{ color: '#B8A5D4' }} />
            <span className="text-[13px]" style={{ fontWeight: 500, color: '#6B675E' }}>
              Stories Created
            </span>
          </div>
          <p className="text-[32px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
            {storiesCreated}
          </p>
          <p className="text-[12px]" style={{ color: '#9B978E' }}>
            this week
          </p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#FEF0EA' }}>
          <div className="flex items-center gap-2 mb-2">
            <Map size={15} style={{ color: '#E8946A' }} />
            <span className="text-[13px]" style={{ fontWeight: 500, color: '#6B675E' }}>
              Journey Progress
            </span>
          </div>
          {activeJourney ? (
            <>
              <p className="text-[28px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
                Step {activeJourney.steps_completed} of {activeJourney.total_steps}
              </p>
              <p className="text-[12px]" style={{ color: '#9B978E' }}>
                {activeJourney.title}
              </p>
            </>
          ) : (
            <>
              <p className="text-[28px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
                —
              </p>
              <p className="text-[12px]" style={{ color: '#9B978E' }}>
                No active journey
              </p>
            </>
          )}
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#FDF6E8' }}>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={15} style={{ color: '#D4A843' }} />
            <span className="text-[13px]" style={{ fontWeight: 500, color: '#6B675E' }}>
              Family Moments
            </span>
          </div>
          <p className="text-[32px] mb-0.5" style={{ fontWeight: 700, color: '#2A2926' }}>
            {familyMemories}
          </p>
          <p className="text-[12px]" style={{ color: '#9B978E' }}>
            memories saved
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-lg mb-6 overflow-x-auto w-fit"
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

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            What They're Curious About
          </h2>
          <p className="text-[14px] mb-6" style={{ color: '#9B978E' }}>
            Topics your child explored this week
          </p>
          {chatTopics.length === 0 ? (
            <p className="text-[14px] py-8 text-center" style={{ color: '#9B978E' }}>
              No topics tracked yet. They'll appear as your child chats with Luno.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-6">
                {chatTopics.map((t, i) => (
                  <div
                    key={t.topic}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                  >
                    <span
                      className="text-[13px] w-5 text-right"
                      style={{ color: '#9B978E' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[14px]"
                          style={{ fontWeight: 500, color: '#2A2926' }}
                        >
                          {t.topic}
                        </span>
                        <span className="text-[12px]" style={{ color: '#9B978E' }}>
                          {t.mention_count} conversations
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: '#F5F3EE' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(t.mention_count / maxTopicCount) * 100}%`,
                            background: '#3ECDC6',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {curriculumAreas.length > 0 && (
                <div>
                  <p className="text-[13px] mb-2" style={{ color: '#9B978E' }}>
                    Curriculum areas touched this week:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {curriculumAreas.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-full text-[12px]"
                        style={{ background: '#F5F3EE', color: '#6B675E' }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            How They're Feeling
          </h2>
          <p className="text-[14px] mb-6" style={{ color: '#9B978E' }}>
            Mood check-ins over the past 14 days
          </p>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            {moodGrid.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-[44px]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]"
                  style={{
                    background: m.isToday ? '#E8F6F4' : '#F5F3EE',
                    border: m.isToday ? '2px solid #3ECDC6' : '1px solid transparent',
                  }}
                >
                  {m.emoji || (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: '#D4D2CD' }}
                    />
                  )}
                </div>
                <span className="text-[11px]" style={{ color: '#9B978E' }}>
                  {m.day}
                </span>
              </div>
            ))}
          </div>
          {moodStats ? (
            <div className="flex flex-col gap-2 mb-5">
              <p className="text-[14px]" style={{ color: '#2A2926' }}>
                Most common mood: {MOOD_EMOJI[moodStats.topMood]} {MOOD_LABEL[moodStats.topMood]}{' '}
                ({moodStats.topCount} of {moodStats.totalDays} days)
              </p>
              {moodStats.transitions.length > 1 && (
                <p className="text-[14px]" style={{ color: '#6B675E' }}>
                  Recent changes: {moodStats.transitions.join(' → ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[14px] mb-5 italic" style={{ color: '#9B978E' }}>
              No check-ins yet. Moods will appear once your child starts their daily
              sessions.
            </p>
          )}
          <p className="text-[13px]" style={{ color: '#9B978E' }}>
            Mood data helps you see patterns over time. If you notice sustained changes,
            it might be a good conversation starter.
          </p>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Daily Activity
          </h2>
          <p className="text-[14px] mb-5" style={{ color: '#9B978E' }}>
            What happened each day this week
          </p>
          {activityTimeline.length === 0 ? (
            <p className="text-[14px] py-8 text-center" style={{ color: '#9B978E' }}>
              No activity yet. It'll appear as your child uses the app.
            </p>
          ) : (
            <>
              {/* Mini bar chart */}
              <div className="flex items-end gap-3 mb-6 h-[50px]">
                {activityTimeline
                  .slice()
                  .reverse()
                  .map((d, i) => {
                    const score =
                      d.message_count + d.story_count * 2 + d.journey_steps_completed * 2;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: score > 0 ? `${(score / maxMinutes) * 40}px` : 2,
                            background: score > 0 ? '#3ECDC6' : '#E8E6E1',
                            minHeight: 2,
                          }}
                        />
                        <span className="text-[10px]" style={{ color: '#9B978E' }}>
                          {formatShortDay(d.date)}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="flex flex-col gap-0">
                {activityTimeline.map((d) => {
                  const hasActivity =
                    d.message_count > 0 ||
                    d.story_count > 0 ||
                    d.journey_steps_completed > 0;
                  return (
                    <div
                      key={d.date}
                      className="py-3 border-b last:border-b-0"
                      style={{ borderColor: '#F5F3EE' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span
                          className="text-[14px] sm:w-[180px] shrink-0"
                          style={{ fontWeight: 600, color: '#2A2926' }}
                        >
                          {formatLongDay(d.date)}
                        </span>
                        {!hasActivity ? (
                          <span className="text-[14px] italic" style={{ color: '#9B978E' }}>
                            No session
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
                            <span className="text-[14px]" style={{ color: '#6B675E' }}>
                              {d.message_count} questions · {d.story_count} stories ·{' '}
                              {d.journey_steps_completed} journey steps
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Journeys Tab */}
      {activeTab === 'journeys' && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Journey Progress
          </h2>
          <p className="text-[14px] mb-5" style={{ color: '#9B978E' }}>
            Where each journey stands
          </p>
          {journeyProgress.length === 0 ? (
            <p className="text-[14px] py-8 text-center" style={{ color: '#9B978E' }}>
              No journeys yet. Start one from the Journeys page to see progress here.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-6">
                {activeJourneys.map((j, i) => {
                  const color = JOURNEY_PALETTE[i % JOURNEY_PALETTE.length];
                  return (
                    <div
                      key={j.id}
                      className="rounded-xl p-4"
                      style={{
                        border: '1px solid #E8E6E1',
                        borderLeft: `4px solid ${color}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[15px]"
                            style={{ fontWeight: 600, color: '#2A2926' }}
                          >
                            {j.title}
                          </span>
                          <span
                            className="text-[12px] px-2 py-0.5 rounded-full"
                            style={{ background: '#FEF0EA', color: '#E8946A' }}
                          >
                            In Progress
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 h-2 rounded-full"
                          style={{ background: '#F5F3EE' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${j.progress_percent}%`,
                              background: color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[12px] shrink-0"
                          style={{ color: '#9B978E' }}
                        >
                          Step {j.steps_completed} of {j.total_steps}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {completedJourneys.length > 0 && (
                <>
                  <h3
                    className="text-[15px] mb-3"
                    style={{ fontWeight: 600, color: '#9B978E' }}
                  >
                    Completed
                  </h3>
                  <div className="flex flex-col gap-2">
                    {completedJourneys.map((j) => (
                      <div
                        key={j.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
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
                          <span className="text-[14px]" style={{ color: '#2A2926' }}>
                            {j.title}
                          </span>
                          {j.completed_at && (
                            <span className="text-[12px]" style={{ color: '#9B978E' }}>
                              · {formatShortDate(j.completed_at)}
                            </span>
                          )}
                        </div>
                        <button
                          className="flex items-center gap-1 text-[12px] hover:underline"
                          style={{ color: '#3ECDC6', fontWeight: 600 }}
                        >
                          <Eye size={12} /> View Reflections
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeJourneys.length === 0 && completedJourneys.length === 0 && (
                <p className="text-[14px] py-8 text-center" style={{ color: '#9B978E' }}>
                  No journeys in progress.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Moments Tab */}
      {activeTab === 'moments' && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h2 className="text-[20px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Growth Journal
          </h2>
          <p className="text-[14px] mb-5" style={{ color: '#9B978E' }}>
            Meaningful moments your child has experienced — far more valuable than
            points or badges.
          </p>
          {childMoments.length === 0 ? (
            <p className="text-[14px] py-8 text-center" style={{ color: '#9B978E' }}>
              No moments yet. They'll appear as your child shares experiences with you.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {childMoments.map((m) => {
                const mc = MOMENT_COLORS[m.moment_type] ?? MOMENT_COLORS.curiosity;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl p-5"
                    style={{
                      border: '1px solid #E8E6E1',
                      borderLeft: `4px solid ${mc.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4
                          className="text-[16px]"
                          style={{ fontWeight: 600, color: '#2A2926' }}
                        >
                          {m.title}
                        </h4>
                        <span className="text-[13px]" style={{ color: '#9B978E' }}>
                          {formatShortDate(m.shared_at)}
                        </span>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap"
                        style={{
                          background: '#FDF6E8',
                          color: '#D4A843',
                          fontWeight: 600,
                        }}
                      >
                        Shared with you
                      </span>
                    </div>
                    {m.context && (
                      <p className="text-[14px] mb-2" style={{ color: '#6B675E' }}>
                        {m.context}
                      </p>
                    )}
                    {m.reflection && (
                      <div className="rounded-lg px-4 py-3" style={{ background: '#F5F3EE' }}>
                        <p className="text-[14px] italic" style={{ color: '#6B675E' }}>
                          "{m.reflection}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Weekly Summary */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#F5F3EE', borderLeft: '3px solid #3ECDC6' }}
      >
        <h3 className="text-[18px] mb-3" style={{ fontWeight: 600, color: '#2A2926' }}>
          This Week in a Sentence
        </h3>
        <p
          className="text-[16px] mb-3"
          style={{ color: '#6B675E', lineHeight: 1.7 }}
        >
          {weeklySummarySentence}
        </p>
        <p className="text-[12px]" style={{ color: '#9B978E' }}>
          This summary is generated from your child's activity this week. Full
          conversation logs are available in each section.
        </p>
      </div>
    </div>
  );
}
