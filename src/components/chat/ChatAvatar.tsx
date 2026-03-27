/**
 * Chat Avatar Component
 *
 * Animated AI buddy avatar with 12 emotional expressions.
 * Designed to be engaging and friendly for children.
 */

import { cn } from '@/lib/utils';
import type { AvatarExpression } from '@/types/domain';
import { BUDDY_EXPRESSIONS } from '@/types/domain';

// Default buddy avatar images (from landing page characters)
const BUDDY_AVATARS: Record<string, string> = {
  Luno: '/avatars/Luno.png',
  Lumi: '/avatars/Lumi.png',
  Lolo: '/avatars/Lolo.png',
  Lala: '/avatars/Lala.png',
};

// Mood-specific Luno face images
export const MOOD_IMAGES: Record<string, string> = {
  happy: '/avatars/moods/happy.webp',
  sad: '/avatars/moods/sad.webp',
  angry: '/avatars/moods/angry.webp',
  calm: '/avatars/moods/calm.webp',
  worried: '/avatars/moods/worried.webp',
  tired: '/avatars/moods/tired.webp',
  excited: '/avatars/moods/excited.webp',
};

interface ChatAvatarProps {
  imageUrl?: string;
  moodImage?: string;
  buddyName?: string;
  expression?: AvatarExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showName?: boolean;
  showExpression?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-12 w-12 text-2xl',
  md: 'h-20 w-20 text-4xl',
  lg: 'h-28 w-28 text-5xl',
  xl: 'h-36 w-36 text-6xl',
  hero: 'h-44 w-44 text-7xl',
};

const nameSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  hero: 'text-xl',
};

export function ChatAvatar({
  imageUrl,
  moodImage,
  buddyName = 'Luno',
  expression = 'neutral',
  size = 'md',
  showName = false,
  showExpression = false,
  className,
}: ChatAvatarProps) {
  const config = BUDDY_EXPRESSIONS[expression];
  // Use mood image first, then provided imageUrl, then default buddy avatar
  const avatarSrc = moodImage ?? imageUrl ?? BUDDY_AVATARS[buddyName] ?? BUDDY_AVATARS.Luno;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Avatar Container */}
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 overflow-hidden',
          config.color,
          sizeClasses[size],
          config.animation,
          'flex items-center justify-center'
        )}
      >
        <img
          src={avatarSrc}
          alt={`${buddyName} avatar`}
          className="h-full w-full rounded-full object-cover"
        />

        {/* Thinking indicator dots */}
        {expression === 'thinking' && (
          <div className="absolute -right-1 -top-1 flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Listening indicator waves */}
        {expression === 'listening' && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <div className="flex items-end gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-primary"
                  style={{
                    height: `${8 + Math.random() * 8}px`,
                    animation: 'typing-dots 0.8s ease-in-out infinite',
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Excited sparkles */}
        {expression === 'excited' && (
          <>
            <span className="absolute -right-2 -top-2 text-lg animate-sparkle">✨</span>
            <span className="absolute -left-2 top-0 text-sm animate-sparkle" style={{ animationDelay: '0.3s' }}>⭐</span>
            <span className="absolute -bottom-1 -right-1 text-sm animate-sparkle" style={{ animationDelay: '0.6s' }}>💫</span>
          </>
        )}

        {/* Proud glow ring */}
        {expression === 'proud' && (
          <div className="absolute inset-0 rounded-full animate-pulse-glow" />
        )}

        {/* Sleepy Zzz */}
        {expression === 'sleepy' && (
          <div className="absolute -right-3 -top-3 flex flex-col text-primary font-bold">
            <span className="text-xs animate-float" style={{ animationDelay: '0s' }}>z</span>
            <span className="text-sm animate-float -ml-1" style={{ animationDelay: '0.2s' }}>z</span>
            <span className="text-base animate-float -ml-2" style={{ animationDelay: '0.4s' }}>Z</span>
          </div>
        )}

        {/* Caring hearts */}
        {expression === 'caring' && (
          <>
            <span className="absolute -right-2 top-0 text-lolo text-sm animate-float">💕</span>
            <span className="absolute -left-1 -top-1 text-lolo text-xs animate-float" style={{ animationDelay: '0.5s' }}>💗</span>
          </>
        )}
      </div>

      {/* Name label */}
      {showName && (
        <span className={cn(
          'font-display font-semibold text-foreground/80',
          nameSizeClasses[size]
        )}>
          {buddyName}
        </span>
      )}

      {/* Expression label (for debugging/demo) */}
      {showExpression && (
        <span className="text-xs text-muted-foreground capitalize">
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Typing indicator with animated dots
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-2">
        <div className="animate-typing-dots flex gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  );
}

/**
 * Mini avatar for message bubbles
 */
export function MiniAvatar({
  expression = 'neutral',
  buddyName = 'Luno',
  imageUrl,
  className,
}: {
  expression?: AvatarExpression;
  buddyName?: string;
  imageUrl?: string;
  className?: string;
}) {
  const config = BUDDY_EXPRESSIONS[expression];
  const avatarSrc = imageUrl ?? BUDDY_AVATARS[buddyName] ?? BUDDY_AVATARS.Luno;

  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center overflow-hidden',
        config.color,
        className
      )}
    >
      <img
        src={avatarSrc}
        alt={`${buddyName} avatar`}
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  );
}
