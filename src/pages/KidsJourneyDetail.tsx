/**
 * Kids Journey Detail Page
 *
 * Shows journey progress and allows completing steps.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useJourney, useCompleteStep } from '@/hooks/queries/useJourneys';
import { LoadingSpinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Circle, Play, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function KidsJourneyDetailPage() {
  const { childId, journeyId } = useParams<{ childId: string; journeyId: string }>();
  const navigate = useNavigate();
  const { data: journey, isLoading, isError, refetch } = useJourney(journeyId);
  const completeStep = useCompleteStep();

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  const handleCompleteStep = async (stepId: string) => {
    if (!journeyId) return;

    try {
      await completeStep.mutateAsync({ stepId, journeyId });
      toast.success('Step completed!');
      refetch();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !journey) {
    return (
      <div className="min-h-screen bg-kids-gradient p-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Journey not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = journey.status === 'completed';
  const currentStepIndex = journey.steps.findIndex(s => !s.isCompleted);
  const nextStep = currentStepIndex >= 0 ? journey.steps[currentStepIndex] : null;

  return (
    <div className="min-h-screen bg-kids-gradient safe-area-inset">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{journey.title}</h1>
          <p className="text-sm text-muted-foreground">
            {journey.currentStep} of {journey.totalSteps} steps
          </p>
        </div>
        <Badge variant={isCompleted ? 'default' : 'secondary'}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </Badge>
      </header>

      <div className="px-4 pb-8 space-y-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-2xl font-bold text-primary">{journey.progress}%</span>
            </div>
            <Progress value={journey.progress} className="h-3" />

            {isCompleted && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-semibold text-yellow-800">Journey Complete!</p>
                  <p className="text-sm text-yellow-700">Great job finishing all steps!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Step CTA */}
        {nextStep && !isCompleted && (
          <Card className="border-primary border-2">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Next Up</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium mb-3">{nextStep.title}</p>
              {nextStep.description && (
                <p className="text-sm text-muted-foreground mb-4">{nextStep.description}</p>
              )}
              <Button
                onClick={() => handleCompleteStep(nextStep.id)}
                disabled={completeStep.isPending}
                className="w-full"
              >
                {completeStep.isPending ? 'Completing...' : 'Mark as Complete'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Steps */}
        <div>
          <h2 className="text-lg font-semibold mb-3">All Steps</h2>
          <div className="space-y-3">
            {journey.steps.map((step, index) => {
              const isCurrentStep = index === currentStepIndex;
              const isPastStep = index < currentStepIndex || (currentStepIndex === -1 && step.isCompleted);

              return (
                <Card
                  key={step.id}
                  className={cn(
                    'transition-all',
                    isCurrentStep && 'ring-2 ring-primary',
                    step.isCompleted && 'bg-green-50'
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {step.isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : isCurrentStep ? (
                          <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                          </div>
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Step {step.stepNumber}
                          </span>
                          {step.isCompleted && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className={cn(
                          'font-medium',
                          step.isCompleted && 'text-green-700'
                        )}>
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        )}
                        {step.completedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed {new Date(step.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {!step.isCompleted && !isCurrentStep && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={completeStep.isPending}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {isCompleted && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={handleBack}>
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
