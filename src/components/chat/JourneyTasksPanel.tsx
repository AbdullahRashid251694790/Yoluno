/**
 * Journey Tasks Panel
 *
 * Displays the child's current journey tasks in a collapsible panel.
 * Shows next tasks and allows quick completion via chat.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveJourneys } from '@/hooks/queries/useJourneys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Map,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyTasksPanelProps {
  childId: string;
}

export function JourneyTasksPanel({ childId }: JourneyTasksPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: journeys = [], isLoading } = useActiveJourneys(childId);

  // If no active journeys or still loading, don't show anything
  if (isLoading || journeys.length === 0) {
    return null;
  }

  // Get the next incomplete step from the first active journey
  const currentJourney = journeys[0];
  const nextStep = currentJourney.steps.find((s) => !s.isCompleted);
  const completedSteps = currentJourney.steps.filter((s) => s.isCompleted).length;
  const totalSteps = currentJourney.totalSteps || currentJourney.steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-100 p-1.5">
                <Map className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-cyan-900">
                  {currentJourney.title}
                </p>
                <p className="text-xs text-cyan-600">
                  {completedSteps}/{totalSteps} steps • {progress}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {journeys.length > 1 && (
                <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                  +{journeys.length - 1} more
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-cyan-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-cyan-500" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3 space-y-3">
            {/* Progress bar */}
            <Progress value={progress} className="h-2 bg-cyan-100" />

            {/* Next task highlight */}
            {nextStep && (
              <div className="rounded-lg bg-white/80 p-3 border border-cyan-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide">
                      Next Task
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {nextStep.title}
                    </p>
                    {nextStep.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {nextStep.description}
                      </p>
                    )}
                    <p className="text-xs text-cyan-600 mt-2">
                      Say "done" when you finish!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step list preview */}
            <div className="space-y-1.5">
              {currentJourney.steps.slice(0, 4).map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2 text-xs',
                    step.isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  )}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  <span className={cn(step.isCompleted && 'line-through')}>
                    {index + 1}. {step.title}
                  </span>
                </div>
              ))}
              {currentJourney.steps.length > 4 && (
                <p className="text-xs text-muted-foreground pl-5">
                  +{currentJourney.steps.length - 4} more steps
                </p>
              )}
            </div>

            {/* View journey link */}
            <Link to={`/kids/${childId}/journeys/${currentJourney.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100"
              >
                View Full Journey
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>

            {/* Show other journeys if any */}
            {journeys.length > 1 && (
              <div className="pt-2 border-t border-cyan-100">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Other active journeys:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {journeys.slice(1, 4).map((j) => (
                    <Link
                      key={j.id}
                      to={`/kids/${childId}/journeys/${j.id}`}
                    >
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-cyan-50"
                      >
                        {j.title}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
