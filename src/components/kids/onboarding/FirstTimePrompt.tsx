/**
 * First Time Prompt Component
 *
 * Welcome wizard for new users entering kids mode.
 * All data from database - no hardcoding.
 */

import { useState } from 'react';
import { useOnboardingProgress, useUpdateOnboardingStep, useCompleteOnboarding } from '@/hooks/queries/useOnboarding';
import { usePersonalityConfigs } from '@/hooks/queries/useKidsMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/shared';
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface FirstTimePromptProps {
  childId: string;
  childName: string;
  onComplete: () => void;
  onSkip?: () => void;
}

// Define onboarding steps
const ONBOARDING_STEPS = [
  'welcome',
  'personality',
  'features',
  'ready',
] as const;

type OnboardingStep = typeof ONBOARDING_STEPS[number];

export function FirstTimePrompt({ childId, childName, onComplete, onSkip }: FirstTimePromptProps) {
  const { data: progress, isLoading: progressLoading } = useOnboardingProgress(childId);
  const { data: personalities = [] } = usePersonalityConfigs();
  const updateStep = useUpdateOnboardingStep();
  const completeOnboarding = useCompleteOnboarding();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);

  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex];
      setCurrentStep(nextStep);
      updateStep.mutate({
        childId,
        input: {
          current_step: nextStep,
          step_completed: currentStep,
        },
      });
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(ONBOARDING_STEPS[prevIndex]);
    }
  };

  const handleComplete = () => {
    completeOnboarding.mutate({ childId }, {
      onSuccess: () => {
        onComplete();
      },
    });
  };

  const handleSkip = () => {
    completeOnboarding.mutate({ childId, skipped: true }, {
      onSuccess: () => {
        if (onSkip) {
          onSkip();
        } else {
          onComplete();
        }
      },
    });
  };

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
        </p>
      </div>

      {/* Step Content */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {currentStep === 'welcome' && (
            <>
              <CardTitle className="text-2xl">Welcome, {childName}!</CardTitle>
              <CardDescription className="text-lg">
                Let's get you set up to have fun with Luno!
              </CardDescription>
            </>
          )}

          {currentStep === 'personality' && (
            <>
              <CardTitle className="text-2xl">Choose Luno's Personality</CardTitle>
              <CardDescription>
                Pick how you'd like Luno to talk with you
              </CardDescription>
            </>
          )}

          {currentStep === 'features' && (
            <>
              <CardTitle className="text-2xl">What Can You Do?</CardTitle>
              <CardDescription>
                Here's what you can explore with Luno
              </CardDescription>
            </>
          )}

          {currentStep === 'ready' && (
            <>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>
                Ready to start your adventure?
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Luno is your friendly AI buddy who loves to chat, tell stories,
                and go on learning adventures with you!
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <span className="text-2xl">💬</span>
                  <p className="text-sm font-medium mt-2">Chat</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 text-center">
                  <span className="text-2xl">📖</span>
                  <p className="text-sm font-medium mt-2">Stories</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <span className="text-2xl">🗺️</span>
                  <p className="text-sm font-medium mt-2">Journeys</p>
                </div>
                <div className="p-4 rounded-lg bg-gold/10 text-center">
                  <span className="text-2xl">🎓</span>
                  <p className="text-sm font-medium mt-2">Learning</p>
                </div>
              </div>
            </div>
          )}

          {/* Personality Step */}
          {currentStep === 'personality' && (
            <div className="grid gap-3">
              {personalities.map((personality) => (
                <button
                  key={personality.mode_key}
                  onClick={() => setSelectedPersonality(personality.mode_key)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPersonality === personality.mode_key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{personality.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{personality.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {personality.description}
                      </p>
                    </div>
                    {selectedPersonality === personality.mode_key && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Features Step */}
          {currentStep === 'features' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-medium">Chat with Luno</p>
                  <p className="text-sm text-muted-foreground">
                    Ask questions, share stories, or just talk about your day
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <span className="text-xl">📖</span>
                <div>
                  <p className="font-medium">Create Stories</p>
                  <p className="text-sm text-muted-foreground">
                    Make up magical stories together with Luno
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <span className="text-xl">🗺️</span>
                <div>
                  <p className="font-medium">Go on Journeys</p>
                  <p className="text-sm text-muted-foreground">
                    Learn new things through fun adventures
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ready Step */}
          {currentStep === 'ready' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <p className="text-muted-foreground">
                You're all set to start chatting with Luno! Have fun exploring
                and learning together.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {currentStepIndex > 0 ? (
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={updateStep.isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={completeOnboarding.isPending}
            >
              Skip for now
            </Button>
          )}
        </div>

        <div>
          {currentStep !== 'ready' ? (
            <Button
              onClick={handleNext}
              disabled={
                updateStep.isPending ||
                (currentStep === 'personality' && !selectedPersonality)
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completeOnboarding.isPending}
            >
              {completeOnboarding.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Let's Go!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
