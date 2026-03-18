/**
 * Badge Celebration Component
 *
 * Displays earned badges with confetti celebration.
 * All data from database - no hardcoding.
 */

const BADGE_EMOJIS: Record<string, string> = {
  first_chat: '💬', chat_explorer: '🗣️', chat_master: '🏆',
  storyteller: '📝', story_collector: '📚', story_master: '🌟',
  journey_starter: '🚀', journey_finisher: '🏁', journey_explorer: '🧭',
  streak_3: '🔥', streak_7: '⚡', streak_14: '💪', streak_30: '👑',
  points_100: '⭐', points_500: '🌟', points_1000: '💫', points_5000: '🏅',
  family_first: '👨‍👩‍👧', family_explorer: '👨‍👩‍👧‍👦', family_champion: '🏠',
  mood_first: '😊', mood_explorer: '🌈', mood_master: '🧘',
};

import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Star, Flame, Award } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: 'streak' | 'learning' | 'story' | 'journey' | 'special';
  icon_url?: string;
}

interface BadgeCelebrationProps {
  badge: BadgeData | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (badgeId: string) => void;
}

const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  streak: Flame,
  learning: Star,
  story: Sparkles,
  journey: Award,
  special: Trophy,
};

const CATEGORY_COLORS: Record<string, string> = {
  streak: 'from-orange-400 to-red-500',
  learning: 'from-blue-400 to-indigo-500',
  story: 'from-purple-400 to-pink-500',
  journey: 'from-green-400 to-teal-500',
  special: 'from-yellow-400 to-amber-500',
};

export function BadgeCelebration({
  badge,
  isOpen,
  onClose,
  onAcknowledge,
}: BadgeCelebrationProps) {
  const { fireBadge } = useConfetti();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isOpen && badge && !hasAnimated) {
      // Delay confetti slightly for dramatic effect
      const timer = setTimeout(() => {
        fireBadge();
        setHasAnimated(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, badge, hasAnimated, fireBadge]);

  useEffect(() => {
    if (!isOpen) {
      setHasAnimated(false);
    }
  }, [isOpen]);

  if (!badge) return null;

  const CategoryIcon = CATEGORY_ICONS[badge.category] || Trophy;
  const gradientClass = CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.special;

  const handleClose = () => {
    if (onAcknowledge) {
      onAcknowledge(badge.id);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          {/* Animated badge icon */}
          <div className="relative mb-4">
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg animate-bounce`}
            >
              {badge.name ? (
                <span className="text-5xl">{BADGE_EMOJIS[badge.name] || '🏅'}</span>
              ) : (
                <CategoryIcon className="w-12 h-12 text-white" />
              )}
            </div>
            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-yellow-400 animate-pulse delay-100" />
          </div>

          <DialogTitle className="text-2xl font-bold">
            🎉 Badge Earned! 🎉
          </DialogTitle>

          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <Badge
                variant="secondary"
                className={`text-lg px-4 py-1 bg-gradient-to-r ${gradientClass} text-white border-0`}
              >
                {badge.display_name}
              </Badge>

              <p className="text-muted-foreground text-base">
                {badge.description}
              </p>

              <p className="text-sm text-muted-foreground italic">
                Keep up the great work!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleClose}
            size="lg"
            className={`bg-gradient-to-r ${gradientClass} hover:opacity-90 text-white border-0`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage badge celebration queue
 */
export function useBadgeCelebration() {
  const [celebrationQueue, setCelebrationQueue] = useState<BadgeData[]>([]);
  const [currentBadge, setCurrentBadge] = useState<BadgeData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const addBadges = (badges: BadgeData[]) => {
    setCelebrationQueue((prev) => [...prev, ...badges]);
  };

  const showNext = () => {
    if (celebrationQueue.length > 0) {
      const [next, ...rest] = celebrationQueue;
      setCurrentBadge(next);
      setCelebrationQueue(rest);
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Show next badge after a short delay
    setTimeout(() => {
      if (celebrationQueue.length > 0) {
        showNext();
      } else {
        setCurrentBadge(null);
      }
    }, 500);
  };

  useEffect(() => {
    if (!isOpen && !currentBadge && celebrationQueue.length > 0) {
      showNext();
    }
  }, [celebrationQueue, isOpen, currentBadge]);

  return {
    currentBadge,
    isOpen,
    addBadges,
    handleClose,
    pendingCount: celebrationQueue.length,
  };
}
