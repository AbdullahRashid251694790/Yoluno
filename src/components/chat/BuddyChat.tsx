/**
 * Buddy Chat Component
 *
 * Main buddy chat interface for children.
 * Uses buddy chat service with AI-powered conversations.
 * Enhanced with suggestion chips, star counter, and expressive avatar.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBuddyMessages, useChatBuddy, useSendBuddyMessage } from '@/hooks/queries/useBuddyChat';
import { queryKeys } from '@/hooks/queries/keys';
import { getSocket, joinChildRoom, leaveChildRoom, onNewMessage } from '@/integrations/api/socket';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatAvatar, TypingIndicator } from './ChatAvatar';
import { SuggestionChips, defaultSuggestions } from './SuggestionChips';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AvatarExpression } from '@/types/domain';
import type { BuddyMessage } from '@/services/buddyChat';

interface BuddyChatProps {
  childId: string;
  childName: string;
}

// Smart avatar expression based on context
function getSmartExpression(
  isSending: boolean,
  isTyping: boolean,
  lastMessage?: BuddyMessage,
  messageCount?: number
): AvatarExpression {
  if (isSending) return 'thinking';
  if (isTyping) return 'listening';

  if (lastMessage) {
    const content = lastMessage.content.toLowerCase();
    // Check for educational content
    if (content.includes('learn') || content.includes('did you know') || content.includes('?')) {
      return 'teaching';
    }
    // Check for stories/creative content
    if (content.includes('once upon') || content.includes('story') || content.includes('imagine')) {
      return 'creative';
    }
    // Check for supportive content
    if (content.includes('great') || content.includes('proud') || content.includes('amazing')) {
      return 'proud';
    }
    // Check for empathetic content
    if (content.includes('understand') || content.includes('feel') || content.includes('okay')) {
      return 'caring';
    }
  }

  // First few messages - excited to chat
  if (messageCount !== undefined && messageCount < 3) {
    return 'excited';
  }

  return 'happy';
}

// Context-aware suggestions based on conversation
function getContextualSuggestions(messages: BuddyMessage[]) {
  if (messages.length === 0) {
    return defaultSuggestions;
  }

  const lastBuddyMessage = [...messages].reverse().find((m) => m.role === 'buddy');
  if (!lastBuddyMessage) return defaultSuggestions;

  const content = lastBuddyMessage.content.toLowerCase();

  // If asking a question, provide relevant follow-ups
  if (content.includes('?')) {
    if (content.includes('want to') || content.includes('would you like')) {
      return [
        { id: 'yes', label: 'Yes please!', emoji: '👍' },
        { id: 'no', label: 'Maybe later', emoji: '🤔' },
        { id: 'different', label: 'Something else', emoji: '💭' },
      ];
    }
    if (content.includes('animal') || content.includes('favorite')) {
      return [
        { id: 'dog', label: 'Dogs', emoji: '🐕' },
        { id: 'cat', label: 'Cats', emoji: '🐱' },
        { id: 'other', label: 'Something else', emoji: '🦋' },
      ];
    }
  }

  // Topic-based suggestions
  if (content.includes('space') || content.includes('planet') || content.includes('star')) {
    return [
      { id: 'moon', label: 'The Moon', emoji: '🌙' },
      { id: 'planets', label: 'Planets', emoji: '🪐' },
      { id: 'astronauts', label: 'Astronauts', emoji: '👨‍🚀' },
    ];
  }

  if (content.includes('dinosaur')) {
    return [
      { id: 'trex', label: 'T-Rex', emoji: '🦖' },
      { id: 'flying', label: 'Flying dinosaurs', emoji: '🦅' },
      { id: 'biggest', label: 'Biggest dinosaur', emoji: '🦕' },
    ];
  }

  return defaultSuggestions;
}

export function BuddyChat({ childId, childName }: BuddyChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Fetch buddy data
  const { data: buddy, isLoading: buddyLoading } = useChatBuddy(childId);

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useBuddyMessages(childId);

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useSendBuddyMessage();

  // Calculate avatar expression
  const lastBuddyMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'buddy'),
    [messages]
  );

  const avatarExpression = useMemo(
    () => getSmartExpression(isSending, isTyping, lastBuddyMessage, messages.length),
    [isSending, isTyping, lastBuddyMessage, messages.length]
  );

  // Get contextual suggestions
  const suggestions = useMemo(() => getContextualSuggestions(messages), [messages]);

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.messages(childId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(childId),
      });
    });

    return () => {
      leaveChildRoom(childId);
      unsubscribe();
    };
  }, [childId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    setIsTyping(false);
    sendMessage({
      message: content,
      childId,
    });
  };

  const handleSuggestionSelect = (suggestion: { label: string }) => {
    handleSend(suggestion.label);
  };

  // Check for recent red flags
  const hasRedFlag = messages.some(
    (msg) =>
      msg.safety_level === 'red' &&
      new Date(msg.created_at).getTime() > Date.now() - 5 * 60 * 1000
  );

  const isLoading = buddyLoading || messagesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-kids-gradient">
        <div className="flex flex-col items-center gap-4">
          <ChatAvatar expression="thinking" size="xl" />
          <p className="text-lg font-medium text-primary animate-pulse">
            Getting ready to chat...
          </p>
        </div>
      </div>
    );
  }

  const buddyName = buddy?.buddy_name || 'Cosmo';

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
            <p className="text-xs text-muted-foreground">
              {isSending ? 'Thinking...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold text-yellow-700">{starCount}</span>
        </div>
      </div>

      {/* Safety alert */}
      {hasRedFlag && (
        <Alert variant="destructive" className="mx-4 mt-2 rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            A parent has been notified about your recent conversation.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ChatAvatar expression="excited" size="hero" showName buddyName={buddyName} />
            <p className="mt-6 text-lg text-center text-muted-foreground max-w-xs">
              Hi {childName}! I'm {buddyName}, your buddy!
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
            {messages.map((message, index) => (
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
                  }}
                  avatarUrl={buddy?.buddy_avatar_url || undefined}
                  childName={childName}
                />
              </div>
            ))}

            {isSending && (
              <TypingIndicator className="animate-fade-in" />
            )}
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
