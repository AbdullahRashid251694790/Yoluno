/**
 * Kids Journeys Page
 *
 * Lists active and completed journeys for a child.
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useActiveJourneys, useCompletedJourneys } from '@/hooks/queries/useJourneys';
import { useChildProfile, useRequestJourney } from '@/hooks/queries';
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
  Hand,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChatAvatar } from '@/components/chat/ChatAvatar';
import type { JourneyWithSteps } from '@/types/domain';

export function KidsJourneysPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: activeJourneys = [], isLoading: activeLoading } = useActiveJourneys(childId);
  const { data: completedJourneys = [], isLoading: completedLoading } = useCompletedJourneys(childId);
  const requestJourney = useRequestJourney();
  const [requested, setRequested] = useState(false);

  const handleRequestJourney = () => {
    if (!childId) return;
    requestJourney.mutate(childId, {
      onSuccess: () => {
        setRequested(true);
        toast.success('Request sent! Your parent will be notified.');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.error || error?.message || 'Something went wrong';
        if (error?.response?.status === 429) {
          toast.info('You already sent a request recently. Please wait a bit!');
        } else {
          toast.error(message);
        }
      },
    });
  };

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  if (childLoading || activeLoading) {
    return (
      <div className="min-h-screen bg-kids-journeys flex items-center justify-center">
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
    <div className="min-h-screen bg-kids-journeys safe-area-inset">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ChatAvatar buddyName="Lolo" expression="curious" size="sm" />
        <div className="flex-1">
          <h1 className="text-body-lg font-bold">My Journeys</h1>
          <p className="text-body-sm text-muted-foreground">
            {activeJourneys.length} active, {completedJourneys.length} completed
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleRequestJourney}
          disabled={requestJourney.isPending || requested}
          className="rounded-full bg-gradient-to-r from-lolo to-primary text-white gap-1.5 text-caption"
        >
          <Hand className="h-3.5 w-3.5" />
          {requested ? 'Sent!' : 'Request New'}
        </Button>
      </header>

      <div className="px-4 pb-8 pt-2">
        {!hasJourneys ? (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <ChatAvatar buddyName="Lolo" expression="curious" size="xl" showName />
              </div>
              <h3 className="text-body-lg font-semibold mb-2">No Journeys Yet</h3>
              <p className="text-muted-foreground text-body-sm mb-4">
                Ask your parent to create a learning journey for you!
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleRequestJourney}
                  disabled={requestJourney.isPending || requested}
                  className="bg-gradient-to-r from-lolo to-primary text-white gap-2"
                >
                  <Hand className="h-4 w-4" />
                  {requested ? 'Request Sent!' : 'Ask for a Journey'}
                </Button>
                <Button variant="outline" onClick={handleBack}>
                  Go Back Home
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-lolo/10">
              <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-lolo data-[state=active]:text-white">
                <Play className="h-4 w-4" />
                Active
                {activeJourneys.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-lolo/20">
                    {activeJourneys.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-lolo data-[state=active]:text-white">
                <Trophy className="h-4 w-4" />
                Done
                {completedJourneys.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 bg-lolo/20">
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
          'bg-white/90 backdrop-blur-sm transition-all hover:shadow-md cursor-pointer border-l-4 border-l-lolo',
          isCompleted && 'border-l-lolo'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                'bg-lolo/10'
              )}
            >
              {isCompleted ? (
                <Trophy className="h-6 w-6 text-lolo" />
              ) : (
                <Map className="h-6 w-6 text-lolo" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{journey.title}</h3>
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-lolo flex-shrink-0" />
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
                  className="h-2 bg-lolo/20 [&>div]:bg-lolo"
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
