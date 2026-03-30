/**
 * Kids Journeys Page
 *
 * Lists active and completed journeys for a child.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useActiveJourneys, useCompletedJourneys } from '@/hooks/queries/useJourneys';
import { useChildProfile } from '@/hooks/queries';
import { LoadingSpinner, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Map,
  Play,
  CheckCircle2,
  Trophy,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyWithSteps } from '@/types/domain';

export function KidsJourneysPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: activeJourneys = [], isLoading: activeLoading } = useActiveJourneys(childId);
  const { data: completedJourneys = [], isLoading: completedLoading } = useCompletedJourneys(childId);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  if (childLoading || activeLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!child) {
    return (
      <ErrorState
        title="Oops!"
        message="We couldn't find your profile."
        onRetry={handleBack}
        retryLabel="Go Back"
        fullPage
      />
    );
  }

  const hasJourneys = activeJourneys.length > 0 || completedJourneys.length > 0;

  return (
    <div className="min-h-screen bg-kids-gradient safe-area-inset">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-body-lg font-bold">My Journeys</h1>
          <p className="text-body-sm text-muted-foreground">
            {activeJourneys.length} active, {completedJourneys.length} completed
          </p>
        </div>
        <Map className="h-6 w-6 text-primary" />
      </header>

      <div className="px-4 pb-8 pt-4">
        {!hasJourneys ? (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Map className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-body-lg font-semibold mb-2">No Journeys Yet</h3>
              <p className="text-muted-foreground text-body-sm mb-4">
                Ask your parent to create a learning journey for you!
              </p>
              <Button variant="outline" onClick={handleBack}>
                Go Back Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/70">
              <TabsTrigger value="active" className="gap-2">
                <Play className="h-4 w-4" />
                Active
                {activeJourneys.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                    {activeJourneys.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <Trophy className="h-4 w-4" />
                Done
                {completedJourneys.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                    {completedJourneys.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeJourneys.length === 0 ? (
                <Card className="bg-white/70">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No active journeys</p>
                  </CardContent>
                </Card>
              ) : (
                activeJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    childId={childId!}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : completedJourneys.length === 0 ? (
                <Card className="bg-white/70">
                  <CardContent className="py-8 text-center">
                    <Trophy className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Complete your first journey!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    childId={childId!}
                    isCompleted
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

interface JourneyCardProps {
  journey: JourneyWithSteps;
  childId: string;
  isCompleted?: boolean;
}

function JourneyCard({ journey, childId, isCompleted }: JourneyCardProps) {
  const progress = journey.progress || 0;
  const nextStep = journey.steps.find((s) => !s.isCompleted);

  return (
    <Link to={`/kids/${childId}/journeys/${journey.id}`}>
      <Card
        className={cn(
          'bg-white/70 backdrop-blur-sm transition-all hover:shadow-md cursor-pointer',
          isCompleted && 'bg-gradient-to-br from-lala/5 to-gold/5'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                isCompleted ? 'bg-lala/10' : 'bg-primary/10'
              )}
            >
              {isCompleted ? (
                <Trophy className="h-6 w-6 text-lala" />
              ) : (
                <Map className="h-6 w-6 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{journey.title}</h3>
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>

              {!isCompleted && nextStep && (
                <p className="text-body-sm text-muted-foreground mb-2 line-clamp-1">
                  Next: {nextStep.title}
                </p>
              )}

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-muted-foreground">
                    {journey.currentStep || 0} of {journey.totalSteps} steps
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className={cn('h-2', isCompleted && 'bg-lala/20')}
                />
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
