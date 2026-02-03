/**
 * Kids Chat Page
 *
 * Child-facing AI chat interface with buddy chat.
 * Supports session-based chats like ChatGPT.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChat } from '@/contexts/ChatContext';
import { useChildProfile } from '@/hooks/queries';
import { useChatSessions, useCreateChatSession } from '@/hooks/queries/useBuddyChat';
import { LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { BuddyChat, ChatSessionList, NewChatButton } from '@/components/chat';
import { ArrowLeft } from 'lucide-react';
import type { ChatSession } from '@/services/buddyChat';

export function KidsChatPage() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { startSession, endSession } = useChat();
  const { data: child, isLoading, isError } = useChildProfile(childId);
  const { data: sessions = [] } = useChatSessions(childId);
  const createSession = useCreateChatSession();

  // Get session ID from URL or state
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    searchParams.get('session') || undefined
  );

  // Get mood from URL params (passed from mood check page)
  const moodParam = searchParams.get('mood');

  // Create a new session when page loads with mood param or if no session exists
  useEffect(() => {
    if (!childId || isLoading) return;

    // If we have a mood param and no current session, create a new session with that mood
    if (moodParam && !currentSessionId) {
      createSession.mutate(
        { childId, input: { mood: moodParam } },
        {
          onSuccess: (newSession) => {
            setCurrentSessionId(newSession.id);
            // Update URL to include session ID and remove mood param
            setSearchParams({ session: newSession.id });
          },
        }
      );
    }
    // If no session is selected and sessions exist, use the most recent one
    else if (!currentSessionId && sessions.length > 0) {
      const latestSession = sessions[0];
      setCurrentSessionId(latestSession.id);
      setSearchParams({ session: latestSession.id });
    }
    // If no sessions exist and no mood param, create a fresh session
    else if (!currentSessionId && sessions.length === 0 && !moodParam && !createSession.isPending) {
      createSession.mutate(
        { childId },
        {
          onSuccess: (newSession) => {
            setCurrentSessionId(newSession.id);
            setSearchParams({ session: newSession.id });
          },
        }
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
    setCurrentSessionId(session.id);
    setSearchParams({ session: session.id });
  }, [setSearchParams]);

  const handleNewSession = useCallback(() => {
    if (!childId) return;
    createSession.mutate(
      { childId },
      {
        onSuccess: (newSession) => {
          setCurrentSessionId(newSession.id);
          setSearchParams({ session: newSession.id });
        },
      }
    );
  }, [childId, createSession, setSearchParams]);

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
    <div className="flex h-screen flex-col bg-gradient-to-b from-pastel-blue to-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-charcoal-muted">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit
          </Button>
          <ChatSessionList
            childId={childId!}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
          />
        </div>
        <h1 className="text-lg font-semibold text-charcoal">Hi, {child.name}!</h1>
        <NewChatButton
          onClick={handleNewSession}
          isLoading={createSession.isPending}
        />
      </header>

      {/* Buddy Chat */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-4xl">
          <BuddyChat
            childId={childId!}
            childName={child.name}
            sessionId={currentSessionId}
          />
        </div>
      </main>
    </div>
  );
}
