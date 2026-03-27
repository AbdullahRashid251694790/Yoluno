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

  // Auto-show celebration for first unviewed reward
  useEffect(() => {
    if (unviewedRewards.length > 0 && !celebratingReward) {
      setCelebratingReward(unviewedRewards[0]);
      setShowConfetti(true);

      // Mark as viewed after showing
      const timer = setTimeout(() => {
        markViewed.mutate({
          rewardId: unviewedRewards[0].id,
          childId: effectiveChildId!,
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [unviewedRewards, celebratingReward, effectiveChildId, markViewed]);

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
            <h1 className="text-xl font-display font-bold">My Rewards</h1>
            <p className="text-sm text-muted-foreground">
              {rewards.length} treasure{rewards.length !== 1 ? 's' : ''} earned
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-lala/10 px-3 py-1.5">
            <Trophy className="h-4 w-4 text-lala" />
            <span className="text-sm font-bold text-lala">{rewards.length}</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className={cn(
                  'overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105',
                  !reward.viewed && 'ring-2 ring-lala ring-offset-2'
                )}
                onClick={() => handleRewardClick(reward)}
              >
                <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-lolo/10">
                  {reward.reward_image_url ? (
                    <img
                      src={reward.reward_image_url}
                      alt={reward.reward_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Trophy className="h-12 w-12 text-lala" />
                    </div>
                  )}
                  {!reward.viewed && (
                    <Badge className="absolute top-2 right-2 bg-lala/10 text-lala">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New!
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {reward.reward_title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(reward.earned_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Dialog */}
      <Dialog open={!!celebratingReward} onOpenChange={closeCelebration}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-lala fill-lala" />
              Journey Complete!
              <Star className="h-6 w-6 text-lala fill-lala" />
            </DialogTitle>
          </DialogHeader>

          {celebratingReward && (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-lolo/10">
                {celebratingReward.reward_image_url ? (
                  <img
                    src={celebratingReward.reward_image_url}
                    alt={celebratingReward.reward_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Trophy className="h-24 w-24 text-lala animate-bounce" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">
                  {celebratingReward.reward_title}
                </h3>
                <p className="text-muted-foreground">
                  You did an amazing job completing this journey!
                </p>
              </div>

              <Button onClick={closeCelebration} className="w-full" size="lg">
                <Trophy className="h-5 w-5 mr-2" />
                Add to Collection
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
