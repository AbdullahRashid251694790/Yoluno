/**
 * Chat Container Component
 *
 * Main chat interface container.
 */

import { useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useActiveChild } from '@/contexts/ChildContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatAvatar } from './ChatAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { MessageCircle } from 'lucide-react';

interface ChatContainerProps {
  avatarUrl?: string;
}

export function ChatContainer({ avatarUrl }: ChatContainerProps) {
  const { messages, isTyping, sendMessage, avatarExpression } = useChat();
  const activeChild = useActiveChild();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Avatar section */}
      <div className="flex justify-center py-4">
        <ChatAvatar
          imageUrl={avatarUrl}
          expression={avatarExpression}
          size="lg"
        />
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Start a conversation"
            description="Say hi to begin chatting!"
            className="py-12"
          />
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                avatarUrl={avatarUrl}
                childName={activeChild?.name}
              />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-0" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-100" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-200" />
                </div>
                <span className="text-body-sm">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-card p-4">
        <ChatInput
          onSend={handleSend}
          isDisabled={isTyping}
          placeholder={`What would you like to talk about, ${activeChild?.name ?? 'friend'}?`}
        />
      </div>
    </div>
  );
}
