/**
 * Kids Home Dashboard
 *
 * Central hub for children with buddy preview, activity cards,
 * daily challenges, and gamification elements.
 */

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChildProfile } from '@/hooks/queries';
import { useGamificationStats, useChildBadges } from '@/hooks/queries/useGamification';
import { useRewardCount } from '@/hooks/queries/useJourneyRewards';
import { useChatBuddy } from '@/hooks/queries/useBuddyChat';
import { ErrorState } from '@/components/shared';
import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageCircle,
  BookOpen,
  Map,
  Users,
  Trophy,
  Flame,
  ArrowLeft,
  Star,
  Sparkles,
  Gift,
} from 'lucide-react';
import { PasswordChangeRequestButton } from '@/components/kids/PasswordChangeRequestButton';
import type { AvatarExpression } from '@/types/domain';

// Badge emoji mapping (matches KidsBadges page)
const BADGE_EMOJIS: Record<string, string> = {
  first_chat: '💬', chat_explorer: '🗣️', chat_master: '🏆',
  storyteller: '📝', story_collector: '📚', story_master: '🌟',
  journey_starter: '🚀', journey_finisher: '🏁', journey_explorer: '🧭',
  streak_3: '🔥', streak_7: '⚡', streak_14: '💪', streak_30: '👑',
  points_100: '⭐', points_500: '🌟', points_1000: '💫', points_5000: '🏅',
  family_first: '👨‍👩‍👧', family_explorer: '👨‍👩‍👧‍👦', family_champion: '🏠',
  mood_first: '😊', mood_explorer: '🌈', mood_master: '🧘',
};

// Time-aware greeting
function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (hour < 20) return { text: 'Good evening', emoji: '🌅' };
  return { text: 'Good night', emoji: '🌙' };
}

// Get buddy expression based on time of day
function getBuddyExpression(): AvatarExpression {
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) return 'sleepy';
  if (hour < 12) return 'excited';
  return 'happy';
}

// Activity card data
const activities = [
  {
    id: 'chat',
    title: 'Chat',
    description: "Let's talk!",
    icon: MessageCircle,
    color: 'from-lumi to-primary/10',
    bgColor: 'bg-lumi/10',
    path: '/chat',
  },
  {
    id: 'stories',
    title: 'Stories',
    description: 'Read & create',
    icon: BookOpen,
    color: 'from-lolo/10 to-lolo',
    bgColor: 'bg-lolo/10',
    path: '/stories',
  },
  {
    id: 'journeys',
    title: 'Journeys',
    description: 'Goals & habits',
    icon: Map,
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    path: '/journeys',
  },
  {
    id: 'family',
    title: 'Family',
    description: 'Photo album',
    icon: Users,
    color: 'from-gold/50 to-gold/50',
    bgColor: 'bg-gold/10',
    path: '/family',
  },
];

// Daily challenges
const dailyChallenges = [
  { text: 'Ask Luno about dinosaurs!', emoji: '🦖' },
  { text: 'Learn something new about space!', emoji: '🚀' },
  { text: 'Tell Luno about your day!', emoji: '📝' },
  { text: "Ask 'Why?' about something!", emoji: '🤔' },
  { text: 'Create a fun story together!', emoji: '📖' },
  { text: 'Learn about an animal!', emoji: '🐾' },
  { text: 'Talk about your favorite things!', emoji: '⭐' },
];

function getDailyChallenge() {
  const today = new Date().toDateString();
  const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return dailyChallenges[index % dailyChallenges.length];
}

export function KidsHomePage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { data: child, isLoading, isError } = useChildProfile(childId);

  // Fetch real gamification data from database
  const { data: gamificationData } = useGamificationStats(childId);
  const { data: badgesData } = useChildBadges(childId);
  const { data: rewardCountData } = useRewardCount(childId);
  const { data: buddy } = useChatBuddy(childId);
  const buddyName = buddy?.buddy_name || 'Luno';

  const greeting = useMemo(() => getGreeting(), []);
  const buddyExpression = useMemo(() => getBuddyExpression(), []);
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);

  // Extract real stats from API response
  const streakCount = gamificationData?.stats?.current_streak ?? 0;
  const starCount = gamificationData?.stats?.total_points ?? 0;
  const unnotifiedBadgeCount = gamificationData?.unnotifiedBadges?.length ?? 0;
  const earnedBadges = badgesData?.earned ?? [];
  const recentBadges = earnedBadges.slice(0, 3);

  useEffect(() => {
    if (child) {
      enterKidsMode(child);
    }
    return () => {
      exitKidsMode();
    };
  }, [child, enterKidsMode, exitKidsMode]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <div className="text-center">
          <ChatAvatar expression="thinking" size="xl" />
          <p className="mt-4 text-lg font-medium text-primary">Getting ready...</p>
        </div>
      </div>
    );
  }

  if (isError || !child) {
    return (
      <ErrorState
        title="Oops!"
        message="We couldn't find your profile."
        onRetry={handleBack}
        retryLabel="Go Back"
        fullPage
      />
    );
  }

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

        <div className="flex items-center gap-3">
          {/* Streak counter */}
          {streakCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5">
              <Flame className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold text-gold">{streakCount}</span>
            </div>
          )}

          {/* Star counter */}
          <div className="flex items-center gap-1.5 rounded-full bg-lala/10 px-3 py-1.5">
            <Star className="h-4 w-4 text-lala fill-lala" />
            <span className="text-sm font-bold text-lala">{starCount}</span>
          </div>

          {/* Password Change Request (Settings gear icon) */}
          <PasswordChangeRequestButton
            childId={childId!}
            childName={child.name}
            className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">
        {/* Greeting */}
        <div className="text-center mb-6">
          <p className="text-lg text-muted-foreground">
            {greeting.emoji} {greeting.text}
          </p>
          <h1 className="text-3xl font-display font-bold text-foreground mt-1">
            {child.name}!
          </h1>
        </div>

        {/* Buddy Section */}
        <Card className="mb-6 overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <ChatAvatar
                expression={buddyExpression}
                size="xl"
                showName
                buddyName={buddyName}
              />

              <p className="mt-4 text-lg text-muted-foreground">
                "Ready for an adventure today?"
              </p>

              <Link to={`/kids/${childId}/chat`} className="w-full mt-4">
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold rounded-full bg-gradient-to-r from-primary to-child-secondary hover:opacity-90 transition-opacity touch-target-kids"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Let's Chat!
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Activity Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const isChat = activity.id === 'chat';
            const href = isChat
              ? `/kids/${childId}/chat`
              : `/kids/${childId}${activity.path}`;

            return (
              <Link key={activity.id} to={href}>
                <Card className="group overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-all hover-scale cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div
                      className={`rounded-2xl p-3 mb-2 ${activity.bgColor} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-8 w-8 bg-gradient-to-br ${activity.color} bg-clip-text text-transparent`} style={{ stroke: 'url(#gradient)' }} />
                      <svg width="0" height="0">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" />
                            <stop offset="100%" stopColor="currentColor" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <h3 className="font-display font-bold text-foreground">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Daily Challenge */}
        <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-primary/10 to-child-secondary/10 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/80 p-2.5">
                <span className="text-2xl">{dailyChallenge.emoji}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary uppercase tracking-wide">
                  Today's Challenge
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {dailyChallenge.text}
                </p>
              </div>
              <Link to={`/kids/${childId}/chat`}>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full bg-white hover:bg-white/80"
                >
                  Go!
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Badges Teaser */}
        <Link to={`/kids/${childId}/badges`}>
          <Card className="overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-lala" />
                  <div>
                    <h3 className="font-display font-bold text-foreground">My Badges</h3>
                    <p className="text-xs text-muted-foreground">
                      {unnotifiedBadgeCount > 0
                        ? `${unnotifiedBadgeCount} new to collect!`
                        : earnedBadges.length > 0
                        ? `${earnedBadges.length} earned`
                        : 'Start collecting!'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {recentBadges.length > 0 ? (
                    <>
                      {recentBadges.map((badge, i) => (
                        <div
                          key={badge.id}
                          className="h-8 w-8 rounded-full flex items-center justify-center bg-lala/10 border-2 border-white"
                        >
                          <span className="text-lg">
                            {badge.badge?.name ? (BADGE_EMOJIS[badge.badge.name] || '🏅') : '🏆'}
                          </span>
                        </div>
                      ))}
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted border-2 border-white">
                        <span className="text-sm font-medium text-muted-foreground">+</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {['🎯', '⭐', '🏅', '?'].map((emoji, i) => (
                        <div
                          key={i}
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-lg border-2 border-white ${
                            i === 3 ? 'bg-muted' : 'bg-lala/10'
                          }`}
                        >
                          {emoji}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Journey Rewards Teaser */}
        <Link to={`/kids/${childId}/rewards`}>
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/10 to-lolo/10 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-display font-bold text-foreground">My Rewards</h3>
                    <p className="text-xs text-muted-foreground">
                      {rewardCountData?.unviewed && rewardCountData.unviewed > 0
                        ? `${rewardCountData.unviewed} new to see!`
                        : rewardCountData?.total && rewardCountData.total > 0
                        ? `${rewardCountData.total} treasure${rewardCountData.total !== 1 ? 's' : ''} earned`
                        : 'Complete journeys to earn!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rewardCountData?.unviewed && rewardCountData.unviewed > 0 && (
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/50 text-white text-xs font-bold animate-pulse">
                      {rewardCountData.unviewed}
                    </span>
                  )}
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-lolo/20 flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
