/**
 * Journey Card Component
 *
 * Displays an active or completed journey with progress.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trophy,
  Pencil,
  BookOpen,
  Users,
  Heart,
  Palette,
  Lightbulb,
} from 'lucide-react';
import type { JourneyWithSteps } from '@/types/domain';

// Category icons and colors (matching JourneyTemplateCard pattern)
const CATEGORY_ICONS: Record<string, typeof Clock> = {
  habit: Clock,
  learning: BookOpen,
  social: Users,
  health: Heart,
  creativity: Palette,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; iconBg: string }> = {
  habit: { bg: 'bg-lolo/5', border: 'border-l-lolo', iconBg: 'bg-lolo/10' },
  learning: { bg: 'bg-lolo/5', border: 'border-l-lolo', iconBg: 'bg-lolo/10' },
  social: { bg: 'bg-lolo/5', border: 'border-l-lolo', iconBg: 'bg-lolo/10' },
  health: { bg: 'bg-lolo/5', border: 'border-l-lolo', iconBg: 'bg-lolo/10' },
  creativity: { bg: 'bg-gold/10', border: 'border-l-gold', iconBg: 'bg-gold/10' },
};

// Status colors with ring for better definition
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Play; ring: string }> = {
  active: { bg: 'bg-primary/10', text: 'text-primary', icon: Play, ring: 'ring-1 ring-primary/20' },
  paused: { bg: 'bg-gold/10', text: 'text-gold', icon: Pause, ring: 'ring-1 ring-gold/20' },
  completed: { bg: 'bg-primary/10', text: 'text-primary', icon: CheckCircle2, ring: 'ring-1 ring-primary/20' },
};

// Extended type with navigation compatibility
export interface JourneyForCard extends JourneyWithSteps {
  child_profile_id?: string;
}

interface JourneyCardProps {
  journey: JourneyForCard;
  childName?: string;
  onContinue?: (journey: JourneyForCard) => void;
  onView?: (journey: JourneyForCard) => void;
  onEdit?: (journey: JourneyForCard) => void;
  className?: string;
}

export function JourneyCard({
  journey,
  childName,
  onContinue,
  onView,
  onEdit,
  className,
}: JourneyCardProps) {
  const statusStyle = STATUS_STYLES[journey.status] || STATUS_STYLES.active;
  const StatusIcon = statusStyle.icon;

  // Calculate progress percentage (capped at 100%)
  const rawProgress = journey.totalSteps
    ? Math.round(((journey.currentStep || 0) / journey.totalSteps) * 100)
    : journey.progress || 0;
  const progress = Math.min(rawProgress, 100);

  // Show which step you're currently on (completed + 1, capped at total)
  const displayStep = Math.min((journey.currentStep || 0) + 1, journey.totalSteps || 1);

  const isCompleted = journey.status === 'completed';
  const isPaused = journey.status === 'paused';

  // Category styling
  const categoryStyle = journey.category ? CATEGORY_COLORS[journey.category] : null;
  const CategoryIcon = journey.category ? CATEGORY_ICONS[journey.category] : Lightbulb;

  // Get child_profile_id for navigation (from either snake_case or camelCase)
  const childProfileId = journey.child_profile_id || journey.childProfileId;

  const handleClick = () => {
    onView?.({ ...journey, child_profile_id: childProfileId });
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContinue?.({ ...journey, child_profile_id: childProfileId });
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.({ ...journey, child_profile_id: childProfileId });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.({ ...journey, child_profile_id: childProfileId });
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md cursor-pointer border-l-4 relative',
        isCompleted && 'bg-gradient-to-br from-primary/10 to-primary/10',
        categoryStyle?.border || 'border-l-primary/50',
        className
      )}
      onClick={handleClick}
    >
      {/* Celebration badge for completed journeys */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-lala/10 text-lala rounded-full p-1.5 shadow-lg animate-bounce">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Category Icon */}
            {journey.category && (
              <div className={cn(
                'p-2 rounded-lg shrink-0',
                categoryStyle?.iconBg || 'bg-muted'
              )}>
                <CategoryIcon className="h-4 w-4" />
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-body-lg line-clamp-1 cursor-default">
                    {journey.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{journey.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Badge
              variant="secondary"
              className={cn('capitalize text-caption', statusStyle.bg, statusStyle.text, statusStyle.ring)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {journey.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Child indicator */}
        {childName && (
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground mb-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {childName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{childName}</span>
          </div>
        )}

        {journey.description && (
          <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
            {journey.description}
          </p>
        )}

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Step indicator pills */}
              {journey.totalSteps > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(journey.totalSteps, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 w-3 rounded-full transition-colors',
                        i < displayStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                  {journey.totalSteps > 7 && (
                    <span className="text-caption text-muted-foreground ml-1">+{journey.totalSteps - 7}</span>
                  )}
                </div>
              )}
            </div>
            <span className={cn(
              'text-body-sm font-semibold',
              isCompleted && 'text-primary'
            )}>
              {progress}%
            </span>
          </div>

          {/* Progress bar with gradient for completed */}
          <Progress
            value={progress}
            className={cn(
              'h-2',
              isCompleted && '[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary'
            )}
          />

          {/* Step counter */}
          {journey.totalSteps > 0 && (
            <p className="text-caption text-muted-foreground">
              {isCompleted ? (
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  All {journey.totalSteps} steps completed
                </span>
              ) : (
                <span>Step {displayStep} of {journey.totalSteps}</span>
              )}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {isCompleted ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full group/btn"
              onClick={handleView}
            >
              <Trophy className="h-4 w-4 mr-2 text-lala group-hover/btn:animate-bounce" />
              View Achievement
            </Button>
          ) : (
            <Button
              size="sm"
              className={cn('w-full group/btn', isPaused && 'opacity-75')}
              disabled={isPaused}
              onClick={handleContinue}
            >
              {isPaused ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Paused
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
