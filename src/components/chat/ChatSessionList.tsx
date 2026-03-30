/**
 * Chat Session List Component
 *
 * Inline sidebar panel displaying chat sessions (ChatGPT-style).
 * Parent controls collapsed/expanded state.
 * Supports inline rename and archive/delete per session.
 */

import { useState, useRef, useEffect } from 'react';
import { useChatSessions, useUpdateChatSession } from '@/hooks/queries/useBuddyChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, MessageCircle, Loader2, PanelLeftClose, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ChatSession } from '@/services/buddyChat';

interface ChatSessionListProps {
  childId: string;
  currentSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isNewSessionLoading?: boolean;
}

export function ChatSessionList({
  childId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  isCollapsed,
  onToggleCollapse,
  isNewSessionLoading,
}: ChatSessionListProps) {
  const { data: sessions = [], isLoading } = useChatSessions(childId);
  const updateSession = useUpdateChatSession();

  const handleRename = (sessionId: string, newTitle: string) => {
    updateSession.mutate({ childId, sessionId, input: { title: newTitle } });
  };

  const handleDelete = (sessionId: string) => {
    updateSession.mutate({ childId, sessionId, input: { is_active: false } });
  };

  // Format mood emoji
  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const moodEmojis: Record<string, string> = {
      happy: '\u{1F60A}',
      sad: '\u{1F622}',
      angry: '\u{1F620}',
      scared: '\u{1F628}',
      calm: '\u{1F60C}',
    };
    return moodEmojis[mood] || null;
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-white/90 backdrop-blur-sm border-r border-border h-full transition-all duration-300 overflow-hidden',
        isCollapsed ? 'w-0 border-r-0' : 'w-72'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <h2 className="font-semibold text-body-sm text-foreground whitespace-nowrap">Chat History</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-muted-foreground shrink-0"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b shrink-0">
        <Button
          onClick={onNewSession}
          disabled={isNewSessionLoading}
          className="w-full gap-2 whitespace-nowrap"
          variant="default"
        >
          {isNewSessionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4" />
          )}
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-body-sm text-muted-foreground">
              No chat history yet.
              <br />
              Start a new conversation!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions
              .filter((session) => session.id === currentSessionId || session.message_count > 0)
              .map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                moodEmoji={getMoodEmoji(session.mood)}
                onSelect={() => onSessionSelect(session)}
                onRename={(title) => handleRename(session.id, title)}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  moodEmoji: string | null;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, moodEmoji, onSelect, onRename, onDelete }: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const timeAgo = session.last_message_at
    ? formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })
    : formatDistanceToNow(new Date(session.started_at), { addSuffix: true });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editTitle if session.title changes (e.g. auto-generated)
  useEffect(() => {
    if (!isEditing) setEditTitle(session.title);
  }, [session.title, isEditing]);

  const handleSaveRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditTitle(session.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') handleCancelRename();
  };

  if (isEditing) {
    return (
      <div className={cn(
        'w-full px-3 py-2 rounded-lg',
        isActive && 'bg-primary/10 border border-primary/20'
      )}>
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveRename}
          className="w-full text-body-sm font-medium bg-white border border-border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
          maxLength={60}
        />
        <div className="flex gap-1 mt-1.5">
          <button
            onClick={handleSaveRename}
            className="p-1 rounded hover:bg-primary/10 text-primary"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCancelRename}
            className="p-1 rounded hover:bg-destructive/10 text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group w-full text-left px-3 py-2.5 rounded-lg transition-colors relative',
        'hover:bg-muted/50',
        isActive && 'bg-primary/10 border border-primary/20'
      )}
    >
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start gap-2">
          {moodEmoji && (
            <span className="text-body-lg flex-shrink-0">{moodEmoji}</span>
          )}
          <div className="flex-1 min-w-0 pr-12">
            <p className="font-medium text-body-sm truncate">
              {session.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-caption text-muted-foreground">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Delete confirmation bar */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/20 px-3">
          <span className="text-caption font-medium text-destructive">Delete chat?</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setIsConfirmingDelete(false); }}
              className="px-2 py-1 text-caption font-medium rounded bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
              className="px-2 py-1 text-caption font-medium rounded bg-white text-foreground border border-border hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit / Delete actions — visible on hover */}
      {!isConfirmingDelete && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
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
      className="text-muted-foreground"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageSquarePlus className="h-5 w-5" />
      )}
    </Button>
  );
}
