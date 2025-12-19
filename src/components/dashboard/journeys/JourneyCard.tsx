/**
 * Journey Card Component
 *
 * Displays an active or completed journey with progress.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import type { JourneyWithSteps } from '@/types/domain';

// Status colors
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Play }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: Play },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Pause },
  completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
};

// Extended type with navigation compatibility
export interface JourneyForCard extends JourneyWithSteps {
  child_profile_id?: string;
}

interface JourneyCardProps {
  journey: JourneyForCard;
  onContinue?: (journey: JourneyForCard) => void;
  onView?: (journey: JourneyForCard) => void;
  className?: string;
}

export function JourneyCard({
  journey,
  onContinue,
  onView,
  className,
}: JourneyCardProps) {
  const statusStyle = STATUS_STYLES[journey.status] || STATUS_STYLES.active;
  const StatusIcon = statusStyle.icon;

  // Calculate progress percentage
  const progress = journey.totalSteps && journey.currentStep
    ? Math.round((journey.currentStep / journey.totalSteps) * 100)
    : journey.progress || 0;

  const isCompleted = journey.status === 'completed';
  const isPaused = journey.status === 'paused';

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

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md cursor-pointer',
        isCompleted && 'bg-gradient-to-br from-blue-50 to-indigo-50',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">
            {journey.title}
          </h3>
          <Badge
            variant="secondary"
            className={cn(statusStyle.bg, statusStyle.text)}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {journey.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {journey.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {journey.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step info */}
        {journey.totalSteps > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Step {journey.currentStep || 1} of {journey.totalSteps}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {isCompleted ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleView}
            >
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              View Achievement
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
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
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
