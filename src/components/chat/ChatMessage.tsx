/**
 * Chat Message Component
 *
 * Individual message bubble in the chat interface.
 * Supports displaying images attached to messages.
 */

import { useState, useEffect } from 'react';
import { cn, formatMessageTime } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/domain';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MiniAvatar } from '@/components/chat/ChatAvatar';
import { buddyChatService } from '@/services/buddyChat';
import { Loader2 } from 'lucide-react';

interface ChatMessageWithImage extends ChatMessageType {
  imageKey?: string | null;
}

interface ChatMessageProps {
  message: ChatMessageWithImage;
  childId?: string;
  avatarUrl?: string;
  childName?: string;
}

export function ChatMessage({ message, childId, avatarUrl, childName }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load signed URL for image if present
  useEffect(() => {
    if (message.imageKey && childId) {
      setImageLoading(true);
      buddyChatService.getMessageImageUrl(childId, message.id)
        .then((url) => setImageUrl(url))
        .catch(console.error)
        .finally(() => setImageLoading(false));
    }
  }, [message.id, message.imageKey, childId]);

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={childName ?? 'User'} />
          ) : null}
          <AvatarFallback className="bg-child-primary/20 text-child-primary">
            {childName?.[0] ?? 'U'}
          </AvatarFallback>
        </Avatar>
      ) : (
        <MiniAvatar expression="happy" className="shrink-0" />
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-child-primary text-white'
            : 'bg-primary/20'
        )}
      >
        {/* Image display */}
        {message.imageKey && (
          <div className="mb-2">
            {imageLoading ? (
              <div className="w-48 h-36 rounded-lg bg-muted/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Attached"
                className="max-w-full max-h-48 rounded-lg object-contain"
                loading="lazy"
              />
            ) : null}
          </div>
        )}

        <p className="whitespace-pre-wrap text-body-sm">{message.content}</p>
        {/* Timestamp - hidden for now
        <span
          className={cn(
            'mt-1 block text-[10px] leading-tight',
            isUser ? 'text-white/60' : 'text-muted-foreground/60'
          )}
        >
          {formatMessageTime(message.timestamp)}
        </span>
        */}
      </div>
    </div>
  );
}
