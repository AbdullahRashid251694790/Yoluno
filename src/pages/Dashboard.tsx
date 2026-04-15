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
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  BookOpen,
  Settings,
  Shield,
  BarChart3,
  MessageSquare,
  Compass,
  Heart,
  Bookmark,
  Mic,
  Menu,
  X,
} from 'lucide-react';
import yolunoLogo from '@/assets/landing/yoluno-logo-original.png';

// Order, labels, and icons match loveable/DashboardLayout.tsx exactly.
const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/children', label: 'Children', icon: Users },
  { path: '/dashboard/insights', label: 'Insights', icon: BarChart3 },
  { path: '/dashboard/topics', label: 'Chat / Topics', icon: MessageSquare },
  { path: '/dashboard/stories', label: 'Stories', icon: BookOpen },
  { path: '/dashboard/journeys', label: 'Journeys', icon: Compass },
  { path: '/dashboard/family', label: 'Family', icon: Heart },
  { path: '/dashboard/voice-vault', label: 'Family Voices', icon: Mic },
  { path: '/dashboard/library', label: 'Keepsakes', icon: Bookmark },
  { path: '/dashboard/safety', label: 'Safety', icon: Shield },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { data: safetyReports = [] } = useSafetyReports(user?.id, true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadAlerts = safetyReports.length;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const sidebarNav = (
    <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-2 overflow-y-auto">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const showBadge = item.path === '/dashboard/safety' && unreadAlerts > 0;
        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] transition-all relative no-underline"
            style={{
              fontWeight: active ? 600 : 400,
              color: active ? '#2A2926' : '#6B675E',
              background: active ? '#FFFFFF' : 'transparent',
              borderLeft: active ? '3px solid #3ECDC6' : '3px solid transparent',
            }}
          >
            <item.icon size={18} style={{ color: active ? '#3ECDC6' : '#9B978E' }} />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <Badge
                variant="destructive"
                className="h-5 w-5 p-0 flex items-center justify-center text-caption"
              >
                {unreadAlerts}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div
      className="dashboard-scope flex min-h-screen"
      style={{ background: '#FAFAF7' }}
    >
      {/* Real-time safety alerts */}
      <SafetyAlertNotification />

      {/* Mobile header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{ background: '#FAF9F6', borderColor: '#E8E6E1' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md p-2 hover:bg-white/60"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" style={{ color: '#2A2926' }} />
        </button>
        <Link to="/dashboard">
          <img src={yolunoLogo} alt="Yoluno" className="h-8" />
        </Link>
        <NotificationBell />
      </header>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-[220px] min-h-screen border-r sticky top-0 h-screen"
        style={{ background: '#FAF9F6', borderColor: '#E8E6E1' }}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <Link to="/dashboard" className="flex-1">
            <img src={yolunoLogo} alt="Yoluno" className="h-8" />
          </Link>
          <NotificationBell />
        </div>
        {sidebarNav}
        <div className="px-5 py-4 text-[12px] truncate" style={{ color: '#9B978E' }}>
          {user?.email}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="relative w-[260px] h-full overflow-y-auto flex flex-col border-r"
            style={{ background: '#FAF9F6', borderColor: '#E8E6E1' }}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
                <img src={yolunoLogo} alt="Yoluno" className="h-8" />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-1 hover:bg-white/60"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" style={{ color: '#2A2926' }} />
              </button>
            </div>
            {sidebarNav}
            <div
              className="px-5 py-4 text-[12px] mt-auto truncate"
              style={{ color: '#9B978E' }}
            >
              {user?.email}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-[1060px] mx-auto px-6 md:px-10 py-8">
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
