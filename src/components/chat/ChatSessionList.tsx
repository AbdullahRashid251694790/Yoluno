/**
 * Chat Session List Component
 *
 * Displays a list of chat sessions for session-based chat like ChatGPT.
 * Allows creating new sessions and switching between sessions.
 */

import { useState } from 'react';
import { useChatSessions, useCreateChatSession } from '@/hooks/queries/useBuddyChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MessageSquarePlus, History, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ChatSession } from '@/services/buddyChat';

interface ChatSessionListProps {
  childId: string;
  currentSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
}

export function ChatSessionList({
  childId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: ChatSessionListProps) {
  const [open, setOpen] = useState(false);
  const { data: sessions = [], isLoading } = useChatSessions(childId);

  const handleSessionSelect = (session: ChatSession) => {
    onSessionSelect(session);
    setOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setOpen(false);
  };

  // Format mood emoji
  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      scared: '😨',
      calm: '😌',
    };
    return moodEmojis[mood] || null;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-charcoal-muted">
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Chat History</SheetTitle>
          <SheetDescription>
            Your conversations with Luno
          </SheetDescription>
        </SheetHeader>

        <div className="p-3 border-b">
          <Button
            onClick={handleNewSession}
            className="w-full gap-2"
            variant="default"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No chat history yet.
                <br />
                Start a new conversation!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  moodEmoji={getMoodEmoji(session.mood)}
                  onSelect={() => handleSessionSelect(session)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  moodEmoji: string | null;
  onSelect: () => void;
}

function SessionItem({ session, isActive, moodEmoji, onSelect }: SessionItemProps) {
  const timeAgo = session.last_message_at
    ? formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })
    : formatDistanceToNow(new Date(session.started_at), { addSuffix: true });

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isActive && 'bg-primary/10 border border-primary/20'
      )}
    >
      <div className="flex items-start gap-2">
        {moodEmoji && (
          <span className="text-lg flex-shrink-0">{moodEmoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {session.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
            {session.message_count > 0 && (
              <span className="text-xs text-muted-foreground">
                · {session.message_count} messages
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// New Chat Button for header use
interface NewChatButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function NewChatButton({ onClick, isLoading }: NewChatButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className="text-charcoal-muted"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageSquarePlus className="h-5 w-5" />
      )}
    </Button>
  );
}
