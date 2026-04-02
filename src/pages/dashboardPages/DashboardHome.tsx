/**
 * Dashboard Home Page
 *
 * Main overview page for the parent dashboard.
 * All data from database - no hardcoding.
 */

import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { useAnalyticsOverview } from '@/hooks/queries/useAnalytics';
import { useTodaysMood } from '@/hooks/queries/useMoodCheckin';
import { ChildProfileCard } from '@/components/dashboard/children/ChildProfileCard';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { LoadingState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { onMoodCheckin } from '@/integrations/api/socket';
import { queryKeys } from '@/hooks/queries/keys';
import {
  Users,
  AlertTriangle,
  MessageCircle,
  Trophy,
  BookOpen,
  Shield,
  Plus,
  ChevronRight,
  Flame,
  Map,
  BarChart3,
  Heart,
} from 'lucide-react';

const MOOD_CONFIG: Record<string, { emoji: string; label: string; className: string }> = {
  happy:   { emoji: '😊', label: 'Happy',   className: 'text-lala bg-lala/10 border-lala' },
  sad:     { emoji: '😢', label: 'Sad',     className: 'text-primary bg-primary/5 border-primary' },
  angry:   { emoji: '😠', label: 'Angry',   className: 'text-destructive bg-destructive/5 border-destructive/20' },
  scared:  { emoji: '😨', label: 'Scared',  className: 'text-primary bg-primary/10 border-primary' },
  calm:    { emoji: '😌', label: 'Calm',    className: 'text-primary bg-primary/5 border-primary/20' },
  worried: { emoji: '😟', label: 'Worried', className: 'text-gold bg-gold/10 border-gold' },
  tired:   { emoji: '😴', label: 'Tired',   className: 'text-foreground/70 bg-muted border-border' },
  excited: { emoji: '🤩', label: 'Excited', className: 'text-lolo bg-lolo/10 border-lolo' },
};

function ChildMoodStatus({ childId, childName }: { childId: string; childName: string }) {
  const { data: todayMood, isLoading } = useTodaysMood(childId);
  const config = todayMood ? MOOD_CONFIG[todayMood.mood] : null;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-medium text-body-sm">{childName}</span>
      {isLoading ? (
        <span className="text-caption text-muted-foreground">Loading...</span>
      ) : config ? (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-body-sm font-medium ${config.className}`}>
          <span>{config.emoji}</span>
          {config.label}
          {todayMood?.created_at && (
            <span className="ml-1 opacity-60 text-caption">
              {new Date(todayMood.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </span>
      ) : (
        <span className="text-body-sm text-muted-foreground italic">Not checked in yet</span>
      )}
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

  // Real-time mood updates: invalidate a child's today mood when they check in
  useEffect(() => {
    const unsubscribe = onMoodCheckin(({ childId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moodCheckin.today(childId) });
    });
    return unsubscribe;
  }, [queryClient]);

  if (childrenLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // Aggregate analytics across all children
  const totalStats = analyticsOverview?.children.reduce(
    (acc, child) => ({
      messages: acc.messages + child.weekly_activity.messages,
      stories: acc.stories + child.weekly_activity.stories,
      points: acc.points + child.stats.total_points,
      streak: Math.max(acc.streak, child.stats.current_streak),
      journeysCompleted: acc.journeysCompleted + child.stats.total_journeys_completed,
    }),
    { messages: 0, stories: 0, points: 0, streak: 0, journeysCompleted: 0 }
  ) || { messages: 0, stories: 0, points: 0, streak: 0, journeysCompleted: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-body-lg sm:text-h4 lg:text-h3 font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your children's learning today.
        </p>
      </div>

      {/* Alert Banner */}
      {unreadAlerts > 0 && (
        <Link to="/dashboard/safety">
          <Card className="border-gold/20 bg-gold/5 hover:bg-gold/10 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gold/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-gold">
                    {unreadAlerts} item{unreadAlerts > 1 ? 's' : ''} need{unreadAlerts === 1 ? 's' : ''} your attention
                  </p>
                  <p className="text-body-sm text-gold">Review safety alerts</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gold" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Children Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body-lg font-semibold">Children Overview</h2>
          <CreateChildDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Child
              </Button>
            }
          />
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Users}
                title="No children yet"
                description="Add your first child profile to get started with Yoluno."
                action={
                  <CreateChildDialog
                    trigger={
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Your First Child
                      </Button>
                    }
                  />
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <ChildProfileCard
                key={child.id}
                child={child}
                avatarUrl={child.avatarUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Today's Moods */}
      {children.length > 0 && (
        <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lolo/10 to-lala/10 border border-lolo/15">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-body-lg flex items-center gap-2">
                  <div className="rounded-lg bg-lolo/10 p-1.5">
                    <Heart className="h-4 w-4 text-lolo" />
                  </div>
                  Today's Moods
                </CardTitle>
                <CardDescription>How your children are feeling today</CardDescription>
              </div>
              <Link to="/dashboard/insights">
                <Button variant="ghost" size="sm" className="text-caption gap-1">
                  View history
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {children.map((child) => (
                <ChildMoodStatus key={child.id} childId={child.id} childName={child.name} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {children.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="rounded-lg bg-primary/15 p-1.5">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                Weekly Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {analyticsLoading ? '...' : totalStats.messages}
              </div>
              <p className="text-caption text-muted-foreground">
                across all children
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lumi/10 to-lumi/20 border border-lumi/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="rounded-lg bg-lumi/15 p-1.5">
                  <BookOpen className="h-4 w-4 text-lumi" />
                </div>
                Stories This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {analyticsLoading ? '...' : totalStats.stories}
              </div>
              <p className="text-caption text-muted-foreground">
                created together
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-gold/10 to-gold/20 border border-gold/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="rounded-lg bg-gold/15 p-1.5">
                  <Flame className="h-4 w-4 text-gold" />
                </div>
                Best Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {analyticsLoading ? '...' : `${totalStats.streak} days`}
              </div>
              <p className="text-caption text-muted-foreground">
                current streak
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lumi/10 to-lumi/20 border border-lumi/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="rounded-lg bg-lumi/15 p-1.5">
                  <Trophy className="h-4 w-4 text-lumi" />
                </div>
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-h4 font-bold">
                {analyticsLoading ? '...' : totalStats.points.toLocaleString()}
              </div>
              <p className="text-caption text-muted-foreground">
                earned by all children
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Child Stats Cards */}
      {children.length > 0 && analyticsOverview && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body-lg font-semibold">This Week's Progress</h2>
            <Link to="/dashboard/insights">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Details
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {analyticsOverview.children.map((childData) => (
              <Card key={childData.child.id} className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-lala/10 border border-primary/15">
                <CardHeader>
                  <CardTitle className="text-body-lg flex items-center gap-2">
                    {childData.child.avatar_url && (
                      <img
                        src={childData.child.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {childData.child.name}
                  </CardTitle>
                  <CardDescription>Age {childData.child.age}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1"><MessageCircle className="h-3.5 w-3.5 text-primary" /></div>
                      <span>{childData.weekly_activity.messages} messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-lumi/10 p-1"><BookOpen className="h-3.5 w-3.5 text-lumi" /></div>
                      <span>{childData.weekly_activity.stories} stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-gold/10 p-1"><Flame className="h-3.5 w-3.5 text-gold" /></div>
                      <span>{childData.stats.current_streak} day streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-lolo/10 p-1"><Map className="h-3.5 w-3.5 text-lolo" /></div>
                      <span>{childData.stats.total_journeys_completed} journeys</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="shadow-md border border-border/50">
        <CardHeader>
          <CardTitle className="text-body-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/stories">
              <Button variant="outline" className="gap-2 border-lumi/30 hover:bg-lumi/5 hover:border-lumi/50">
                <BookOpen className="h-4 w-4 text-lumi" />
                View Stories
              </Button>
            </Link>
            <Link to="/dashboard/journeys">
              <Button variant="outline" className="gap-2 border-lolo/30 hover:bg-lolo/5 hover:border-lolo/50">
                <Map className="h-4 w-4 text-lolo" />
                Manage Journeys
              </Button>
            </Link>
            <Link to="/dashboard/insights">
              <Button variant="outline" className="gap-2 border-lumi/30 hover:bg-lumi/5 hover:border-lumi/50">
                <BarChart3 className="h-4 w-4 text-lumi" />
                View Insights
              </Button>
            </Link>
            <Link to="/dashboard/safety">
              <Button variant="outline" className="gap-2 border-gold/30 hover:bg-gold/5 hover:border-gold/50">
                <Shield className="h-4 w-4 text-gold" />
                Safety Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
