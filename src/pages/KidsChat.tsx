/**
 * Kids Chat Page
 *
 * Child-facing AI chat interface with buddy chat.
 * Supports session-based chats with a ChatGPT-style sidebar.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useChild } from '@/contexts/ChildContext';
import { useChat } from '@/contexts/ChatContext';
import { useChildProfile } from '@/hooks/queries';
import { queryKeys } from '@/hooks/queries/keys';
import { useChatSessions, useCreateChatSession } from '@/hooks/queries/useBuddyChat';
import { greetSession } from '@/services/buddyChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { BuddyChat, ChatSessionList, NewChatButton } from '@/components/chat';
import { ArrowLeft, PanelLeft } from 'lucide-react';
import { getUploadUrl } from '@/integrations/api/client';
import type { ChatSession } from '@/services/buddyChat';

export function KidsChatPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { startSession, endSession } = useChat();
  const { data: child, isLoading, isError } = useChildProfile(childId);
  const { data: sessions = [] } = useChatSessions(childId);
  const createSession = useCreateChatSession();
  const isMobile = useIsMobile();

  // Sidebar state: collapsed on mobile by default, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Get session ID from URL or state
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    searchParams.get('session') || undefined
  );

  // Get mood from URL params (passed from mood check page)
  const moodParam = searchParams.get('mood');

  const activateSession = useCallback((sessionId: string, closeSidebar = false) => {
    setCurrentSessionId(sessionId);
    setSearchParams({ session: sessionId }, { replace: true });
    if (closeSidebar && isMobile) setSidebarCollapsed(true);
  }, [setSearchParams, isMobile]);

  // Create a new session when page loads with mood param or if no session exists
  useEffect(() => {
    if (!childId || isLoading) return;

    if (moodParam && !currentSessionId) {
      createSession.mutate(
        { childId, input: { mood: moodParam } },
        {
          onSuccess: (s) => {
            activateSession(s.id);
            // Trigger Luno's mood-aware opening message, then refetch messages
            greetSession(childId, s.id)
              .then(() => {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.buddyChat.sessionMessages(childId, s.id),
                });
              })
              .catch(() => {});
          },
        }
      );
    } else if (!currentSessionId && sessions.length > 0) {
      activateSession(sessions[0].id);
    } else if (!currentSessionId && sessions.length === 0 && !moodParam && !createSession.isPending) {
      createSession.mutate(
        { childId },
        { onSuccess: (s) => activateSession(s.id) }
      );
    }
  }, [childId, sessions, currentSessionId, moodParam, isLoading]);

  useEffect(() => {
    if (child && childId) {
      enterKidsMode(child);
      startSession(childId);
    }

    return () => {
      endSession();
      exitKidsMode();
    };
  }, [child, childId, enterKidsMode, exitKidsMode, startSession, endSession]);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  const handleSessionSelect = useCallback((session: ChatSession) => {
    activateSession(session.id, true);
  }, [activateSession]);

  const handleNewSession = useCallback(() => {
    if (!childId) return;
    // If current session is empty, just stay on it (GPT-style)
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession && currentSession.message_count === 0) return;
    createSession.mutate(
      { childId },
      { onSuccess: (s) => activateSession(s.id, true) }
    );
  }, [childId, createSession, activateSession, sessions, currentSessionId]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading..." fullPage />;
  }

  if (isError || !child) {
    return (
      <ErrorState
        title="Child not found"
        message="The child profile could not be loaded."
        onRetry={handleBack}
        retryLabel="Back to Dashboard"
        fullPage
      />
    );
  }

  return (
    <div className="flex h-screen bg-kids-chat overflow-hidden">
      {/* Mobile backdrop overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? 'fixed inset-y-0 left-0 z-50'
            : 'relative shrink-0'
        }
      >
        <ChatSessionList
          childId={childId!}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isNewSessionLoading={createSession.isPending}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-primary/10 bg-kids-chat px-4 py-3 shadow-sm shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-muted-foreground"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div />
        </header>

        {/* Buddy Chat */}
        <main className="flex-1 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-4xl">
            <BuddyChat
              childId={childId!}
              childName={child.name}
              sessionId={currentSessionId}
              childAvatarUrl={getUploadUrl(child.avatarUrl || child.custom_avatar_url)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
