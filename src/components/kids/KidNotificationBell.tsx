/**
 * Kid Notification Bell Component
 *
 * Bell icon with unread count for kids mode.
 * Shows notifications like story completion in a friendly popup.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Check, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useKidNotifications,
  useKidUnreadCount,
  useMarkKidNotificationRead,
  useMarkAllKidNotificationsRead,
  useDeleteKidNotification,
  useAddKidNotificationToCache,
} from '@/hooks/queries';
import { useSocket, joinChildRoom } from '@/integrations/api/socket';
import type { KidNotification } from '@/services/kidNotifications';
import { formatDistanceToNow } from 'date-fns';

interface KidNotificationBellProps {
  childId: string;
}

export function KidNotificationBell({ childId }: KidNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [] } = useKidNotifications(childId);
  const { data: unreadCount = 0 } = useKidUnreadCount(childId);
  const markAsRead = useMarkKidNotificationRead(childId);
  const markAllAsRead = useMarkAllKidNotificationsRead(childId);
  const deleteNotification = useDeleteKidNotification(childId);
  const addToCache = useAddKidNotificationToCache(childId);
  const socket = useSocket();

  // Join child room and listen for real-time notifications
  useEffect(() => {
    if (!socket || !childId) return;

    joinChildRoom(childId);

    const handleNotification = (notification: KidNotification) => {
      addToCache(notification);
    };

    socket.on('kid-notification', handleNotification);
    return () => {
      socket.off('kid-notification', handleNotification);
    };
  }, [socket, childId, addToCache]);

  const handleNotificationClick = (notification: KidNotification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    // Navigate to story if it's a story completion notification
    if (notification.notification_type === 'story_complete' && notification.metadata?.storyId) {
      setIsOpen(false);
      navigate(`/kids/${childId}/stories`);
    } else if (notification.notification_type === 'family_update') {
      setIsOpen(false);
      navigate(`/kids/${childId}/family`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'story_complete':
        return <BookOpen className="h-4 w-4 text-lumi" />;
      case 'family_update':
        return <Users className="h-4 w-4 text-lala" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-caption"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0 rounded-2xl" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-display font-bold text-body-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-caption h-auto py-1 px-2"
              onClick={() => markAllAsRead.mutate()}
            >
              <Check className="h-3 w-3 mr-1" />
              Read all
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[250px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-body-sm text-muted-foreground">No notifications yet!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'px-4 py-3 hover:bg-muted/50 transition-colors',
                    !notification.is_read && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left"
                      >
                        <p className={cn(
                          'text-body-sm',
                          !notification.is_read && 'font-bold'
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-caption text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-caption"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead.mutate(notification.id);
                            }}
                            disabled={markAsRead.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 px-2 text-caption text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate(notification.id);
                          }}
                          disabled={deleteNotification.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
