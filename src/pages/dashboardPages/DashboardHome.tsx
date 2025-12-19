/**
 * Dashboard Home Page
 *
 * Main overview page for the parent dashboard.
 * All data from database - no hardcoding.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { useAnalyticsOverview } from '@/hooks/queries/useAnalytics';
import { ChildProfileCard } from '@/components/dashboard/children/ChildProfileCard';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { LoadingState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  AlertTriangle,
  MessageCircle,
  Trophy,
  BookOpen,
  TrendingUp,
  Clock,
  Shield,
  Plus,
  ChevronRight,
  Flame,
  Map,
  BarChart3,
} from 'lucide-react';

export function DashboardHome() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);
  const { data: analyticsOverview, isLoading: analyticsLoading } = useAnalyticsOverview();

  const unreadAlerts = safetyReports.length;

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
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your children's learning today.
        </p>
      </div>

      {/* Alert Banner */}
      {unreadAlerts > 0 && (
        <Link to="/dashboard/safety">
          <Card className="border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">
                    {unreadAlerts} item{unreadAlerts > 1 ? 's' : ''} need{unreadAlerts === 1 ? 's' : ''} your attention
                  </p>
                  <p className="text-sm text-amber-700">Review safety alerts</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-600" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Children Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Children Overview</h2>
          <CreateChildDialog
            trigger={
              <Button size="sm" variant="outline" className="gap-2">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Quick Stats */}
      {children.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Weekly Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : totalStats.messages}
              </div>
              <p className="text-xs text-muted-foreground">
                across all children
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Stories This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : totalStats.stories}
              </div>
              <p className="text-xs text-muted-foreground">
                created together
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Best Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : `${totalStats.streak} days`}
              </div>
              <p className="text-xs text-muted-foreground">
                current streak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? '...' : totalStats.points.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
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
            <h2 className="text-xl font-semibold">This Week's Progress</h2>
            <Link to="/dashboard/insights">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Details
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyticsOverview.children.map((childData) => (
              <Card key={childData.child.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span>{childData.weekly_activity.messages} messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span>{childData.weekly_activity.stories} stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{childData.stats.current_streak} day streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-green-500" />
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/stories">
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                View Stories
              </Button>
            </Link>
            <Link to="/dashboard/journeys">
              <Button variant="outline" className="gap-2">
                <Map className="h-4 w-4" />
                Manage Journeys
              </Button>
            </Link>
            <Link to="/dashboard/insights">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Insights
              </Button>
            </Link>
            <Link to="/dashboard/safety">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Safety Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
