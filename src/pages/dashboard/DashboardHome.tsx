/**
 * Dashboard Home Page
 *
 * Main overview page for the parent dashboard.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
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
  Sparkles,
} from 'lucide-react';

// Mock activity data (would come from API)
const recentActivity = [
  { id: '1', childName: 'Max', action: 'asked about dinosaurs', time: '2 hours ago', icon: MessageCircle },
  { id: '2', childName: 'Luna', action: 'completed reading journey step', time: '3 hours ago', icon: Trophy },
  { id: '3', childName: 'Max', action: 'started new story "Space Adventure"', time: '5 hours ago', icon: BookOpen },
  { id: '4', childName: 'Luna', action: 'earned "Curious Mind" badge', time: 'Yesterday', icon: Trophy },
];

// Mock insights (would come from analytics service)
const weeklyInsights = {
  totalMessages: 127,
  messageChange: 12,
  topicsExplored: 8,
  avgSessionTime: '15 min',
};

export function DashboardHome() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);

  const unreadAlerts = safetyReports.length;

  if (childrenLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

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

      {/* Recent Activity & Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>What your children have been up to</CardDescription>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Add a child to start tracking activity.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 4).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.childName}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Insights</CardTitle>
            <CardDescription>Learning summary for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Messages</span>
                </div>
                <p className="text-2xl font-bold mt-1">{weeklyInsights.totalMessages}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{weeklyInsights.messageChange}% from last week
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Topics</span>
                </div>
                <p className="text-2xl font-bold mt-1">{weeklyInsights.topicsExplored}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique topics explored
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg Session</span>
                </div>
                <p className="text-2xl font-bold mt-1">{weeklyInsights.avgSessionTime}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per interaction
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Safety</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-green-600">100%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Content appropriate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
