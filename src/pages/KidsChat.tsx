/**
 * Kids Chat Page
 *
 * Child-facing AI chat interface with buddy chat.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChat } from '@/contexts/ChatContext';
import { useChildProfile } from '@/hooks/queries';
import { LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { BuddyChat } from '@/components/chat';
import { ArrowLeft } from 'lucide-react';

export function KidsChatPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { enterKidsMode, exitKidsMode } = useChild();
  const { startSession, endSession } = useChat();
  const { data: child, isLoading, isError } = useChildProfile(childId);

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-pastel-blue to-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm">
        <Button variant="ghost" size="sm" onClick={handleBack} className="text-charcoal-muted">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit
        </Button>
        <h1 className="text-lg font-semibold text-charcoal">Hi, {child.name}!</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      {/* Buddy Chat */}
      <main className="flex flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-4xl">
          <BuddyChat childId={childId!} childName={child.name} />
        </div>
      </main>
    </div>
  );
}
