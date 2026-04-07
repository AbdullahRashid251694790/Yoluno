/**
 * Buddy Chat Component
 *
 * Main buddy chat interface for children.
 * Uses buddy chat service with AI-powered conversations.
 * Enhanced with suggestion chips, star counter, and expressive avatar.
 *
 * Refactored to use avatarExpressionService for SOLID compliance.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useBuddyMessages,
  useChatBuddy,
  useSendBuddyMessage,
  useSessionMessages,
  useSendSessionMessage,
} from '@/hooks/queries/useBuddyChat';
import { queryKeys } from '@/hooks/queries/keys';
import { getSocket, joinChildRoom, leaveChildRoom, onNewMessage } from '@/integrations/api/socket';
import { avatarExpressionService } from '@/services/avatarExpression';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatAvatar, TypingIndicator } from './ChatAvatar';
import { SuggestionChips } from './SuggestionChips';
import { JourneyTasksPanel } from './JourneyTasksPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BuddyMessage } from '@/services/buddyChat';

interface BuddyChatProps {
  childId: string;
  childName: string;
  sessionId?: string;
  childAvatarUrl?: string;
}

export function BuddyChat({ childId, childName, sessionId, childAvatarUrl }: BuddyChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Fetch buddy data
  const { data: buddy, isLoading: buddyLoading } = useChatBuddy(childId);

  // Fetch messages - use session-based if sessionId is provided
  const { data: legacyMessages = [], isLoading: legacyMessagesLoading } = useBuddyMessages(
    sessionId ? undefined : childId // Only fetch if no session
  );
  const { data: sessionMessages = [], isLoading: sessionMessagesLoading } = useSessionMessages(
    sessionId ? childId : undefined,
    sessionId
  );

  // Use the appropriate messages based on whether we have a session
  const messages = sessionId ? sessionMessages : legacyMessages;
  const messagesLoading = sessionId ? sessionMessagesLoading : legacyMessagesLoading;

  // Send message mutations
  const { mutate: sendLegacyMessage, isPending: isLegacySending } = useSendBuddyMessage();
  const { mutate: sendSessionMsg, isPending: isSessionSending } = useSendSessionMessage();

  const isSending = sessionId ? isSessionSending : isLegacySending;

  // Find last buddy message
  const lastBuddyMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'buddy'),
    [messages]
  );

  // Calculate avatar expression using service
  const avatarExpression = useMemo(
    () =>
      avatarExpressionService.getExpression({
        isSending,
        isTyping,
        lastMessageContent: lastBuddyMessage?.content,
        messageCount: messages.length,
      }),
    [isSending, isTyping, lastBuddyMessage?.content, messages.length]
  );

  // Get contextual suggestions using service
  const suggestions = useMemo(
    () => avatarExpressionService.getSuggestions(lastBuddyMessage?.content),
    [lastBuddyMessage?.content]
  );

  // Star count (would come from gamification service)
  const starCount = messages.length * 2 + 10;

  // Real-time subscription for new messages via Socket.io
  useEffect(() => {
    if (!childId) return;

    const socket = getSocket();
    if (!socket) return;

    // Join the child's chat room
    joinChildRoom(childId);

    // Listen for new messages
    const unsubscribe = onNewMessage(() => {
      // Invalidate appropriate queries based on session mode
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.sessionMessages(childId, sessionId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.session(childId, sessionId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.sessions(childId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.buddyChat.messages(childId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(childId),
      });
    });

    return () => {
      leaveChildRoom(childId);
      unsubscribe();
    };
  }, [childId, sessionId, queryClient]);

  // Auto-scroll to bottom when new messages arrive or sending state changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has painted, then scroll
    const raf = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, isSending]);

  const handleSend = (content: string, image?: File) => {
    setIsTyping(false);
    if (sessionId) {
      sendSessionMsg({
        childId,
        sessionId,
        message: content,
        image,
      });
    } else {
      sendLegacyMessage({
        message: content,
        childId,
        image,
      });
    }
  };

  const handleSuggestionSelect = (suggestion: { label: string }) => {
    handleSend(suggestion.label);
  };

  // Check for recent red flags
  const hasRedFlag = messages.some(
    (msg: BuddyMessage) =>
      msg.safety_level === 'red' &&
      new Date(msg.created_at).getTime() > Date.now() - 5 * 60 * 1000
  );

  const isLoading = buddyLoading || messagesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-kids-gradient">
        <div className="flex flex-col items-center gap-4">
          <ChatAvatar expression="thinking" size="xl" />
          <p className="text-body-lg font-medium text-primary animate-pulse">
            Getting ready to chat...
          </p>
        </div>
      </div>
    );
  }

  const buddyName = 'Luno';

  return (
    <div className="flex h-full flex-col bg-kids-gradient">
      {/* Header with avatar and star counter */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <ChatAvatar
            expression={avatarExpression}
            size="sm"
            buddyName={buddyName}
          />
          <div>
            <h3 className="font-display font-semibold text-foreground">{buddyName}</h3>
            <p className="text-caption text-muted-foreground">
              {isSending ? 'Thinking...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-lala/10 px-3 py-1.5">
          <Star className="h-4 w-4 text-lala fill-lala" />
          <span className="text-body-sm font-bold text-lala">{starCount}</span>
        </div>
      </div>

      {/* Journey Tasks Panel */}
      <JourneyTasksPanel childId={childId} />

      {/* Safety alert */}
      {hasRedFlag && (
        <Alert variant="destructive" className="mx-4 mt-2 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-caption">
            A parent has been notified about your recent conversation.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ChatAvatar expression="excited" size="hero" showName buddyName={buddyName} />
            <p className="mt-6 text-body-lg text-center text-muted-foreground max-w-xs">
              Hi {childName}! I'm {buddyName}, your AI friend!
              What would you like to talk about today?
            </p>
            <div className="mt-6">
              <SuggestionChips
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message: BuddyMessage, index: number) => (
              <div
                key={message.id}
                className={index === messages.length - 1 ? 'animate-slide-up' : ''}
              >
                <ChatMessage
                  message={{
                    id: message.id,
                    role: message.role === 'child' ? 'user' : 'assistant',
                    content: message.content,
                    timestamp: message.created_at,
                    imageKey: message.image_key,
                  }}
                  childId={childId}
                  avatarUrl={childAvatarUrl}
                  childName={childName}
                />
              </div>
            ))}

            {isSending && (
              <TypingIndicator className="animate-fade-in" />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggestion chips (when not empty) */}
      {messages.length > 0 && !isSending && (
        <div className="px-4 py-2">
          <SuggestionChips
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
          />
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-white/70 backdrop-blur-sm p-4 safe-area-inset">
        <ChatInput
          onSend={handleSend}
          isDisabled={isSending}
          placeholder={`Chat with ${buddyName}...`}
          maxLength={500}
        />
      </div>
    </div>
  );
}
