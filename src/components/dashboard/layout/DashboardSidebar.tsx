/**
 * Dashboard Sidebar
 *
 * Navigation sidebar for the dashboard.
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/children', label: 'Children', icon: Users },
  { path: '/dashboard/stories', label: 'Stories', icon: BookOpen },
  { path: '/dashboard/journeys', label: 'Journeys', icon: Map },
  { path: '/dashboard/safety', label: 'Safety', icon: Shield },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-body-lg font-bold">Yoluno</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-3', isActive && 'bg-secondary')}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t p-3">
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
  );
}
