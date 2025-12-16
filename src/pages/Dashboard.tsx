/**
 * Dashboard Page
 *
 * Main parent dashboard with child management and overview.
 */

import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { SafetyDashboardPage } from './SafetyDashboard';
import { SafetyAlertNotification } from '@/components/dashboard/safety';
import { ChildProfileCard } from '@/components/dashboard/children/ChildProfileCard';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { LoadingState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Sparkles,
  Shield,
  Map,
  AlertTriangle,
  MessageCircle,
  Trophy,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
} from 'lucide-react';

// Dashboard Home - Main overview
function DashboardHome() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);

  const unreadAlerts = safetyReports.length;

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

// Children Management Page
function ChildrenPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useChildProfiles(user?.id);

  if (isLoading) {
    return <LoadingState message="Loading children..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-muted-foreground mt-1">
            Manage your child profiles and settings.
          </p>
        </div>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <ChildProfileCard
              key={child.id}
              child={child}
              avatarUrl={child.avatarUrl}
              onEdit={() => {
                // TODO: Open edit dialog
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Stories Page
function StoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stories</h1>
        <p className="text-muted-foreground mt-1">
          View and manage stories created for your children.
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={BookOpen}
            title="No stories yet"
            description="Stories created with your children will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Journeys Page
function JourneysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Journeys</h1>
        <p className="text-muted-foreground mt-1">
          Track learning progress and habit-building journeys.
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Map}
            title="No journeys yet"
            description="Learning journeys will appear here when your children start them."
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Page
function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account ID</label>
              <p className="mt-1 font-mono text-sm">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Safety Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when content is flagged
                </p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/children', label: 'Children', icon: Users },
  { path: '/dashboard/stories', label: 'Stories', icon: BookOpen },
  { path: '/dashboard/journeys', label: 'Journeys', icon: Map },
  { path: '/dashboard/safety', label: 'Safety', icon: Shield },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);

  const unreadAlerts = safetyReports.length;

  return (
    <div className="flex min-h-screen bg-pastel-blue/30">
      {/* Real-time safety alerts */}
      <SafetyAlertNotification />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center border-b px-6 py-4">
            <Link to="/dashboard" className="font-logo text-2xl tracking-tight">
              <span className="text-charcoal">Yoluno</span>
              <span className="text-cyan"> AI</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              const showBadge = item.path === '/dashboard/safety' && unreadAlerts > 0;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start gap-3', isActive && 'bg-secondary')}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadAlerts}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User & Sign out */}
          <div className="border-t p-3 space-y-2">
            <div className="px-3 py-2 text-sm text-muted-foreground truncate">
              {user?.email}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/children" element={<ChildrenPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/journeys" element={<JourneysPage />} />
            <Route path="/safety" element={<SafetyDashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
