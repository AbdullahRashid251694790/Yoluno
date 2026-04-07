/**
 * Chat Message Component
 *
 * Individual message bubble in the chat interface.
 * Supports displaying images attached to messages.
 */

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn, formatMessageTime } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/domain';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MiniAvatar } from '@/components/chat/ChatAvatar';
import { buddyChatService } from '@/services/buddyChat';
import { Loader2 } from 'lucide-react';

/** Fix markdown content — ensure table rows are on separate lines */
function formatMarkdownContent(content: string): string {
  // Split into lines, then find sequences that look like table rows jammed together
  // Pattern: "| ... | ... | ... || ... | ... |" (multiple rows on one line)
  let fixed = content;
  // Put each pipe-row on its own line: if we see "| " after a " |" without a newline between
  fixed = fixed.replace(/\s*\|\s*\n?\s*\|/g, ' |\n|');
  // Ensure separator row (|---|---|) is on its own line
  fixed = fixed.replace(/([^\n])((?:\|[\s:-]+)+\|)/g, '$1\n$2');
  fixed = fixed.replace(/((?:\|[\s:-]+)+\|)([^\n])/g, '$1\n$2');
  return fixed;
}

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

        {isUser ? (
          <p className="whitespace-pre-wrap text-body-sm">{message.content}</p>
        ) : (
          <div className="text-body-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-body prose-table:text-body-sm prose-table:w-full prose-table:border-collapse prose-table:rounded-lg prose-table:overflow-hidden prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:font-semibold prose-th:bg-primary/15 prose-th:border prose-th:border-primary/20 prose-td:px-3 prose-td:py-1.5 prose-td:border prose-td:border-primary/10 prose-tr:even:bg-primary/5 prose-strong:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {formatMarkdownContent(message.content)}
            </ReactMarkdown>
          </div>
        )}
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
