/**
 * Dashboard Header
 *
 * Header component for the dashboard.
 */

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Bell, Search } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user } = useAuth();
  const userEmail = user?.email ?? 'User';

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <div>
        {title && <h1 className="text-h4 font-bold">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(userEmail)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
