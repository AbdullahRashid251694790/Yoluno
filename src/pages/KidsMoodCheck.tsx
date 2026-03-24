/**
 * Kids Mood Check Page
 *
 * Daily mood check-in screen where children select how they're feeling.
 * Luno responds with personalized message and activity suggestions.
 *
 * Flow: ChildSelect → MoodCheck → KidsHome
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChild } from '@/contexts/ChildContext';
import { useChildProfile } from '@/hooks/queries';
import { useTodaysMood, useLogMoodCheckin } from '@/hooks/queries/useMoodCheckin';
import { ChatAvatar, MOOD_IMAGES } from '@/components/chat/ChatAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/shared';
import {
  moodConfigs,
  getAllMoods,
  getLunoMoodResponse,
  getSuggestedActivities,
  getMoodConfig,
  type ActivitySuggestion,
} from '@/lib/moodResponses';
import type { MoodType } from '@/services/moodCheckin';
import type { AvatarExpression } from '@/types/domain';
import { cn } from '@/lib/utils';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useChatBuddy } from '@/hooks/queries/useBuddyChat';

// Map mood to avatar expression
const moodToExpression: Record<MoodType, AvatarExpression> = {
  happy: 'happy',
  sad: 'caring',
  angry: 'caring',
  calm: 'neutral',
  worried: 'caring',
  tired: 'caring',
  excited: 'happy',
};

export function KidsMoodCheckPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { enterKidsMode, exitKidsMode } = useChild();

  // State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [lunoResponse, setLunoResponse] = useState<string>('');
  const [activities, setActivities] = useState<ActivitySuggestion[]>([]);
  const [showResponse, setShowResponse] = useState(false);

  // Queries
  const { data: child, isLoading: childLoading, isError: childError } = useChildProfile(childId);
  const { data: todaysMood, isLoading: moodLoading } = useTodaysMood(childId);
  const logMoodMutation = useLogMoodCheckin();
  const { data: buddy } = useChatBuddy(childId);
  const buddyName = buddy?.buddy_name || 'Luno';

  // If already checked in today (before this session), redirect to home
  useEffect(() => {
    if (todaysMood && !moodLoading && !selectedMood) {
      navigate(`/kids/${childId}`, { replace: true });
    }
  }, [todaysMood, moodLoading, childId, navigate, selectedMood]);

  // Enter kids mode when child loads
  useEffect(() => {
    if (child) {
      enterKidsMode(child);
    }
    return () => {
      exitKidsMode();
    };
  }, [child, enterKidsMode, exitKidsMode]);

  // Get mood list
  const moods = useMemo(() => getAllMoods(), []);

  // Handle mood selection
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);

    // Get Luno's response and activities
    const response = getLunoMoodResponse(mood);
    const suggestedActivities = getSuggestedActivities(mood);

    setLunoResponse(response);
    setActivities(suggestedActivities);

    // Log the mood check-in
    try {
      await logMoodMutation.mutateAsync({
        childId: childId!,
        data: {
          mood,
          luno_response: response,
          suggested_activity: suggestedActivities[0]?.title,
        },
      });
    } catch (error) {
      console.error('Failed to log mood:', error);
      // Continue anyway - don't block the user
    }

    // Show response after a brief delay for animation
    setTimeout(() => {
      setShowResponse(true);
    }, 300);
  };

  // Handle activity selection
  const handleActivitySelect = (activity: ActivitySuggestion) => {
    const basePath = `/kids/${childId}`;
    switch (activity.path) {
      case 'chat':
        navigate(`${basePath}/chat?mood=${selectedMood}`);
        break;
      case 'stories':
        navigate(`${basePath}/stories`);
        break;
      case 'journeys':
        navigate(`${basePath}/journeys`);
        break;
      case 'family':
        navigate(`${basePath}/family`);
        break;
      default:
        navigate(basePath);
    }
  };

  // Handle continue to home
  const handleContinue = () => {
    navigate(`/kids/${childId}`);
  };

  // Handle back
  const handleBack = () => {
    navigate('/play');
  };

  // Loading state OR already checked in (prevent flash before redirect)
  if (childLoading || moodLoading || (todaysMood && !selectedMood)) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <div className="text-center">
          <ChatAvatar expression="thinking" size="xl" />
          <p className="mt-4 text-lg font-medium text-primary">Getting ready...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (childError || !child) {
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

  // Get current mood config for styling
  const currentMoodConfig = selectedMood ? getMoodConfig(selectedMood) : null;

  return (
    <div
      className={cn(
        'min-h-screen safe-area-inset transition-colors duration-500',
        currentMoodConfig
          ? `bg-gradient-to-br ${currentMoodConfig.bgGradient}`
          : 'bg-kids-gradient'
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          How are you feeling?
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">
        {/* Luno greeting */}
        <div className="flex flex-col items-center text-center mb-8">
          <ChatAvatar
            expression={selectedMood ? moodToExpression[selectedMood] : 'curious'}
            moodImage={selectedMood ? MOOD_IMAGES[selectedMood] : undefined}
            size="xl"
            showName
            buddyName={buddyName}
          />

          <h1 className="text-2xl font-display font-bold text-foreground mt-4">
            Hey {child.name}!
          </h1>

          {!showResponse ? (
            <p className="text-lg text-muted-foreground mt-2">
              How are you feeling today?
            </p>
          ) : (
            <p className="text-lg text-foreground mt-2 max-w-sm animate-fade-in">
              {lunoResponse}
            </p>
          )}
        </div>

        {/* Mood selection buttons with Luno faces */}
        {!showResponse && (
          <div className="grid grid-cols-4 gap-3 mb-8 max-w-md mx-auto">
            {moods.map((mood) => {
              const config = moodConfigs[mood];
              const isSelected = selectedMood === mood;
              const expression = moodToExpression[mood];

              return (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={logMoodMutation.isPending}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-2xl transition-all duration-200',
                    'bg-white/80 backdrop-blur-sm shadow-md',
                    'hover:shadow-lg hover:scale-105 active:scale-95',
                    'touch-target-kids',
                    isSelected && 'ring-4 ring-primary ring-offset-2 scale-105'
                  )}
                >
                  <ChatAvatar
                    expression={expression}
                    moodImage={MOOD_IMAGES[mood]}
                    size="sm"
                    buddyName={buddyName}
                  />
                  <span className={cn('text-xs font-medium mt-1', config.color)}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Activity suggestions (shown after mood selection) */}
        {showResponse && activities.length > 0 && (
          <div className="space-y-4 animate-slide-up max-w-md mx-auto">
            <h2 className="text-lg font-display font-semibold text-center text-foreground">
              What would you like to do?
            </h2>

            <div className="grid gap-3">
              {activities.map((activity) => (
                <Card
                  key={activity.id}
                  className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all cursor-pointer hover-scale"
                  onClick={() => handleActivitySelect(activity)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-child-secondary/20 flex items-center justify-center">
                      <span className="text-2xl">{activity.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-foreground">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Continue button */}
            <Button
              size="lg"
              variant="secondary"
              onClick={handleContinue}
              className="w-full mt-4 rounded-full bg-white/80 hover:bg-white touch-target-kids"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Let's Go!
            </Button>
          </div>
        )}

        {/* Loading indicator while saving */}
        {logMoodMutation.isPending && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground animate-pulse">
              Saving...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
