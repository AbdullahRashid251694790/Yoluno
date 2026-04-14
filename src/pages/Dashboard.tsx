/**
 * Dashboard Page
 *
 * Main parent dashboard with routing and navigation.
 * Responsive: collapsible sidebar on mobile, fixed on desktop.
 */

import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { SafetyDashboardPage } from './SafetyDashboard';
import { FamilyTreePage } from '@/components/dashboard/family';
import { SafetyAlertNotification } from '@/components/dashboard/safety';
import { NotificationBell } from '@/components/dashboard/layout/NotificationBell';
import {
  DashboardHome,
  ChildrenPage,
  StoriesPage,
  JourneysPage,
  InsightsPage,
  TopicsPage,
  ContentLibraryPage,
  VoiceVaultPage,
  SettingsPage,
} from './dashboardPages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Shield,
  Map,
  TreePine,
  BarChart3,
  Tag,
  Library,
  Mic,
  Menu,
  X,
} from 'lucide-react';
import yolunoLogo from '@/assets/landing/yoluno-logo.png';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/children', label: 'Children', icon: Users },
  { path: '/dashboard/family', label: 'Family', icon: TreePine },
  { path: '/dashboard/stories', label: 'Stories', icon: BookOpen },
  { path: '/dashboard/journeys', label: 'Journeys', icon: Map },
  { path: '/dashboard/insights', label: 'Insights', icon: BarChart3 },
  { path: '/dashboard/topics', label: 'Topics', icon: Tag },
  { path: '/dashboard/library', label: 'Keepsakes', icon: Library },
  { path: '/dashboard/voice-vault', label: 'Family Voices', icon: Mic },
  { path: '/dashboard/safety', label: 'Safety', icon: Shield },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadAlerts = safetyReports.length;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Real-time safety alerts */}
      <SafetyAlertNotification />

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-card/95 backdrop-blur-md px-4 py-3 shadow-warm lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-2 hover:bg-secondary"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/dashboard">
          <img src={yolunoLogo} alt="Yoluno" className="h-8" />
        </Link>
        <NotificationBell />
      </header>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card/95 backdrop-blur-xl shadow-warm transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo and Notifications */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <Link to="/dashboard">
              <img src={yolunoLogo} alt="Yoluno" className="h-9" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden lg:block">
                <NotificationBell />
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1 hover:bg-secondary lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              const showBadge = item.path === '/dashboard/safety' && unreadAlerts > 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-foreground shadow-sm border-l-[3px] border-l-primary pl-[11px]'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-caption">
                      {unreadAlerts}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Sign out */}
          <div className="border-t p-3 space-y-2">
            <div className="px-3 py-2 text-body-sm text-muted-foreground truncate">
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
      <main className="flex-1 pt-16 lg:pt-0 lg:ml-64">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/children" element={<ChildrenPage />} />
            <Route path="/family" element={<FamilyTreePage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/journeys" element={<JourneysPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/library" element={<ContentLibraryPage />} />
            <Route path="/voice-vault" element={<VoiceVaultPage />} />
            <Route path="/safety" element={<SafetyDashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
