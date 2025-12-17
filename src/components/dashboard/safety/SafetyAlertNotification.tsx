/**
 * Safety Alert Notification Component
 *
 * Real-time notification system for RED flag safety alerts.
 * Shows toast notifications when new safety reports are created.
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { queryKeys } from '@/hooks/queries/keys';
import { getSocket, onSafetyAlert } from '@/integrations/api/socket';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import type { SafetyReport } from '@/services/buddyChat';

/**
 * This component should be mounted at the top level of the parent dashboard
 * to provide real-time safety alert notifications.
 */
export function SafetyAlertNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastReportId, setLastReportId] = useState<string | null>(null);

  // Get unread reports to check for initial state
  const { data: unreadReports = [] } = useSafetyReports(user?.id, true);

  // Set up real-time subscription for new safety reports via Socket.io
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    if (!socket) return;

    const unsubscribe = onSafetyAlert((payload: unknown) => {
      const newReport = payload as SafetyReport;

      // Avoid duplicate notifications
      if (lastReportId === newReport.id) return;
      setLastReportId(newReport.id);

      // Only show notification for RED flags
      if (newReport.severity === 'red') {
        toast({
          title: 'Safety Alert - Immediate Attention Required',
          description: newReport.issue_summary,
          variant: 'destructive',
          duration: 10000, // 10 seconds
          action: {
            altText: 'View Report',
            onClick: () => {
              window.location.href = '/dashboard/safety';
            },
          },
        });

        // Play notification sound (optional)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Yoluno Safety Alert', {
            body: newReport.issue_summary,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: `safety-${newReport.id}`,
          });
        }
      } else if (newReport.severity === 'yellow') {
        // Yellow flags get a less intrusive notification
        toast({
          title: 'Safety Notice',
          description: newReport.issue_summary,
          duration: 5000,
        });
      }

      // Invalidate safety reports query to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.safetyReports(user.id, false),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.safetyReports(user.id, true),
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, toast, queryClient, lastReportId]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show unread count badge (optional visual indicator)
  const unreadRedFlags = unreadReports.filter((r) => r.severity === 'red').length;

  if (unreadRedFlags > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-destructive-foreground shadow-lg">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <span className="font-semibold">
          {unreadRedFlags} urgent safety {unreadRedFlags === 1 ? 'alert' : 'alerts'}
        </span>
      </div>
    );
  }

  return null;
}
