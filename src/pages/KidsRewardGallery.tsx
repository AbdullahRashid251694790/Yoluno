/**
 * Kids Reward Gallery
 *
 * Page for children to view their earned journey rewards.
 * Shows earned journey images as collectibles.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useEarnedRewards, useUnviewedRewards, useMarkRewardViewed } from '@/hooks/queries/useJourneyRewards';
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
import { ArrowLeft, Trophy, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyReward } from '@/services/journeyRewards';
import Confetti from 'react-confetti';

export function KidsRewardGalleryPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { activeChild } = useChild();

  const effectiveChildId = childId || activeChild?.id;

  const { data: rewards = [], isLoading } = useEarnedRewards(effectiveChildId);
  const { data: unviewedRewards = [] } = useUnviewedRewards(effectiveChildId);
  const markViewed = useMarkRewardViewed();

  const [celebratingReward, setCelebratingReward] = useState<JourneyReward | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoShown, setAutoShown] = useState(false);

  // Auto-show celebration for first unviewed reward (once only)
  useEffect(() => {
    if (unviewedRewards.length > 0 && !celebratingReward && !autoShown) {
      setAutoShown(true);
      setCelebratingReward(unviewedRewards[0]);
      setShowConfetti(true);
    }
  }, [unviewedRewards, celebratingReward, autoShown]);

  // Stop confetti after delay
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleRewardClick = (reward: JourneyReward) => {
    setCelebratingReward(reward);
    if (!reward.viewed) {
      setShowConfetti(true);
      markViewed.mutate({
        rewardId: reward.id,
        childId: effectiveChildId!,
      });
    }
  };

  const closeCelebration = () => {
    // Mark as viewed when closing
    if (celebratingReward && !celebratingReward.viewed && effectiveChildId) {
      markViewed.mutate({
        rewardId: celebratingReward.id,
        childId: effectiveChildId,
      });
    }
    setCelebratingReward(null);
    setShowConfetti(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <LoadingState message="Loading your rewards..." />
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
            <h1 className="text-body-lg font-display font-bold">My Rewards</h1>
            <p className="text-body-sm text-muted-foreground">
              {rewards.length} treasure{rewards.length !== 1 ? 's' : ''} earned
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-lala/10 px-3 py-1.5">
            <Trophy className="h-4 w-4 text-lala" />
            <span className="text-body-sm font-bold text-lala">{rewards.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {rewards.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No rewards yet!"
            description="Complete journeys to earn awesome rewards!"
            className="py-12"
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {rewards.map((reward) => (
              <button
                key={reward.id}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all',
                  'bg-card border-2 hover:shadow-warm',
                  !reward.viewed ? 'border-lala shadow-warm-sm' : 'border-border'
                )}
                onClick={() => handleRewardClick(reward)}
              >
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-lala/10 to-gold/10 flex items-center justify-center">
                  {reward.reward_image_url && reward.reward_image_url.startsWith('http') ? (
                    <img src={reward.reward_image_url} alt={reward.reward_title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-h3">{(reward as any).badge_emoji || '🏆'}</span>
                  )}
                  {!reward.viewed && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-lala rounded-full border-2 border-card" />
                  )}
                </div>
                <p className="text-caption font-medium text-center line-clamp-1 w-full">{reward.reward_title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Dialog */}
      <Dialog open={!!celebratingReward} onOpenChange={closeCelebration}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center text-body-lg font-display flex items-center justify-center gap-2">
              ⭐ Journey Complete! ⭐
            </DialogTitle>
          </DialogHeader>

          {celebratingReward && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-lala/10 to-gold/10 flex items-center justify-center">
                  {celebratingReward.reward_image_url && celebratingReward.reward_image_url.startsWith('http') ? (
                    <img src={celebratingReward.reward_image_url} alt={celebratingReward.reward_title} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-h1 animate-bounce">{(celebratingReward as any).badge_emoji || '🏆'}</span>
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-body font-bold">{celebratingReward.reward_title}</h3>
                <p className="text-caption text-muted-foreground">Amazing job!</p>
              </div>

              <Button onClick={closeCelebration} className="w-full" size="sm">
                🎉 Awesome!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
