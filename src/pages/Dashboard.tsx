/**
 * Dashboard Page
 *
 * Main parent dashboard with routing and navigation.
 * Refactored to use separate page components for SRP compliance.
 */

import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { SafetyDashboardPage } from './SafetyDashboard';
import { FamilyTreePage } from '@/components/dashboard/family';
import { SafetyAlertNotification } from '@/components/dashboard/safety';
import {
  DashboardHome,
  ChildrenPage,
  StoriesPage,
  JourneysPage,
  SettingsPage,
} from './dashboard';
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
} from 'lucide-react';
import yolunoLogo from '@/assets/yoluno-logo.svg';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/children', label: 'Children', icon: Users },
  { path: '/dashboard/family', label: 'Family', icon: TreePine },
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
            <Link to="/dashboard">
              <img src={yolunoLogo} alt="Yoluno" className="h-9" />
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
            <Route path="/family" element={<FamilyTreePage />} />
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
