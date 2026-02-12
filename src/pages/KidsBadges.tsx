/**
 * Kids Badges Gallery
 *
 * Page for children to view their earned and available badges.
 * Badges grouped by category with celebration on new unlock.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChildBadges, useAcknowledgeBadges } from '@/hooks/queries/useGamification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState } from '@/components/shared/feedback/LoadingState';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { ArrowLeft, Award, Sparkles, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeEarned, BadgeDefinition } from '@/services/gamification';
import Confetti from 'react-confetti';

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  streak: { label: 'Streak', emoji: '🔥' },
  learning: { label: 'Learning', emoji: '📚' },
  story: { label: 'Story', emoji: '📖' },
  journey: { label: 'Journey', emoji: '🗺️' },
  special: { label: 'Special', emoji: '⭐' },
  family: { label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  mood: { label: 'Mood', emoji: '😊' },
};

export function KidsBadgesPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { activeChild } = useChild();

  const effectiveChildId = childId || activeChild?.id;

  const { data: badgesData, isLoading } = useChildBadges(effectiveChildId);
  const acknowledgeBadges = useAcknowledgeBadges();

  const [celebratingBadge, setCelebratingBadge] = useState<BadgeDefinition | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const earned = badgesData?.earned ?? [];
  const available = badgesData?.available ?? [];
  const earnedBadgeIds = new Set(earned.map((e) => e.badge_definition_id));

  // Auto-celebrate unnotified badges
  useEffect(() => {
    const unnotified = earned.filter((e) => !e.notified);
    if (unnotified.length > 0 && !celebratingBadge) {
      setCelebratingBadge(unnotified[0].badge);
      setShowConfetti(true);
      acknowledgeBadges.mutate({
        childId: effectiveChildId!,
        badgeIds: unnotified.map((e) => e.badge_definition_id),
      });
    }
  }, [earned, celebratingBadge, effectiveChildId, acknowledgeBadges]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Group all badges by category
  const allBadges = available.map((badge) => ({
    badge,
    earned: earned.find((e) => e.badge_definition_id === badge.id),
  }));

  const categories = Object.entries(
    allBadges.reduce(
      (acc, item) => {
        const cat = item.badge.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      },
      {} as Record<string, typeof allBadges>
    )
  ).sort(([a], [b]) => {
    const order = ['streak', 'learning', 'story', 'journey', 'family', 'mood', 'special'];
    return order.indexOf(a) - order.indexOf(b);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <LoadingState message="Loading your badges..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kids-gradient">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          colors={['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#00CED1']}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">My Badges</h1>
            <p className="text-sm text-muted-foreground">
              {earned.length} of {available.length} earned
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-700">{earned.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {categories.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No badges yet!"
            description="Keep exploring to earn awesome badges!"
            className="py-12"
          />
        ) : (
          categories.map(([category, badges]) => {
            const catInfo = CATEGORY_LABELS[category] || { label: category, emoji: '🏅' };
            return (
              <div key={category}>
                <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                  <span>{catInfo.emoji}</span>
                  {catInfo.label}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {badges.map(({ badge, earned: earnedData }) => {
                    const isEarned = !!earnedData;
                    return (
                      <Card
                        key={badge.id}
                        className={cn(
                          'overflow-hidden cursor-pointer transition-all',
                          isEarned
                            ? 'hover:shadow-lg hover:scale-105'
                            : 'opacity-50 grayscale'
                        )}
                        onClick={() => {
                          if (isEarned) {
                            setCelebratingBadge(badge);
                          }
                        }}
                      >
                        <CardContent className="p-3 text-center">
                          <div className="relative mx-auto w-16 h-16 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100">
                            <Award className={cn(
                              'h-8 w-8',
                              isEarned ? 'text-yellow-500' : 'text-gray-400'
                            )} />
                            {!isEarned && (
                              <Lock className="absolute bottom-0 right-0 h-4 w-4 text-gray-500 bg-white rounded-full p-0.5" />
                            )}
                          </div>
                          <h3 className="font-medium text-xs line-clamp-2">
                            {badge.display_name}
                          </h3>
                          {isEarned && earnedData && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(earnedData.earned_at).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Celebration Dialog */}
      <Dialog open={!!celebratingBadge} onOpenChange={() => setCelebratingBadge(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              Badge Earned!
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </DialogTitle>
          </DialogHeader>

          {celebratingBadge && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100">
                <Award className="h-12 w-12 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{celebratingBadge.display_name}</h3>
                <p className="text-muted-foreground mt-1">{celebratingBadge.description}</p>
              </div>
              <Button onClick={() => setCelebratingBadge(null)} className="w-full" size="lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Awesome!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
