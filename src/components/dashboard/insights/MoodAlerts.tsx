/**
 * Mood Alerts Component
 *
 * Displays pattern-based alerts for mood check-ins.
 * Helps parents notice emotional trends that may need attention.
 */

import { useMemo } from 'react';
import { useMoodHistory, useMoodSummary } from '@/hooks/queries';
import { moodConfigs } from '@/lib/moodResponses';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Heart, TrendingUp, Sparkles } from 'lucide-react';

interface MoodAlertsProps {
  childId: string;
  childName: string;
}

interface MoodAlert {
  id: string;
  type: 'warning' | 'positive' | 'info';
  title: string;
  description: string;
  icon: typeof AlertTriangle;
}

export function MoodAlerts({ childId, childName }: MoodAlertsProps) {
  const { data: history = [], isLoading: historyLoading } = useMoodHistory(childId, 7);
  const { data: summary, isLoading: summaryLoading } = useMoodSummary(childId, 7);

  const isLoading = historyLoading || summaryLoading;

  // Analyze mood patterns and generate alerts
  const alerts = useMemo<MoodAlert[]>(() => {
    if (!summary || history.length === 0) return [];

    const result: MoodAlert[] = [];
    const distribution = summary.distribution || [];
    const totalCheckins = summary.total_checkins || 0;

    // Create a map for quick lookup
    const distMap = new Map(distribution.map((d) => [d.mood, d]));

    // Check for consecutive negative moods (sad, angry, scared)
    const negativeMoods = ['sad', 'angry', 'scared'];
    let consecutiveNegative = 0;
    let maxConsecutiveNegative = 0;

    for (const entry of history) {
      if (negativeMoods.includes(entry.mood)) {
        consecutiveNegative++;
        maxConsecutiveNegative = Math.max(maxConsecutiveNegative, consecutiveNegative);
      } else {
        consecutiveNegative = 0;
      }
    }

    if (maxConsecutiveNegative >= 3) {
      result.push({
        id: 'consecutive-negative',
        type: 'warning',
        title: 'Emotional Support Needed',
        description: `${childName} has felt sad, angry, or scared for ${maxConsecutiveNegative} days in a row. Consider having a gentle conversation.`,
        icon: AlertTriangle,
      });
    }

    // Check for high frequency of specific negative mood
    const sadCount = distMap.get('sad')?.count || 0;
    const angryCount = distMap.get('angry')?.count || 0;
    const scaredCount = distMap.get('scared')?.count || 0;

    if (totalCheckins >= 5) {
      if (sadCount >= 3 && sadCount / totalCheckins >= 0.5) {
        result.push({
          id: 'frequent-sadness',
          type: 'warning',
          title: 'Frequent Sadness',
          description: `${childName} has felt sad ${sadCount} times this week. This might be worth exploring together.`,
          icon: Heart,
        });
      }

      if (angryCount >= 3 && angryCount / totalCheckins >= 0.5) {
        result.push({
          id: 'frequent-anger',
          type: 'warning',
          title: 'Frequent Frustration',
          description: `${childName} has felt angry ${angryCount} times this week. Consider discussing what might be bothering them.`,
          icon: AlertTriangle,
        });
      }

      if (scaredCount >= 3 && scaredCount / totalCheckins >= 0.5) {
        result.push({
          id: 'frequent-fear',
          type: 'warning',
          title: 'Frequent Worry',
          description: `${childName} has felt scared ${scaredCount} times this week. They might need some reassurance.`,
          icon: AlertTriangle,
        });
      }
    }

    // Positive patterns
    const happyCount = distMap.get('happy')?.count || 0;
    const calmCount = distMap.get('calm')?.count || 0;
    const positiveCount = happyCount + calmCount;

    if (positiveCount >= 5 && positiveCount / totalCheckins >= 0.7) {
      result.push({
        id: 'positive-streak',
        type: 'positive',
        title: 'Great Week!',
        description: `${childName} has been feeling happy or calm most of this week. Keep up the great work!`,
        icon: Sparkles,
      });
    }

    // Consistency alert
    if (totalCheckins >= 6) {
      result.push({
        id: 'consistent-checkins',
        type: 'positive',
        title: 'Consistent Check-ins',
        description: `${childName} has been checking in regularly. This helps build emotional awareness!`,
        icon: TrendingUp,
      });
    }

    // No check-ins alert
    if (totalCheckins === 0) {
      result.push({
        id: 'no-checkins',
        type: 'info',
        title: 'No Check-ins Yet',
        description: `${childName} hasn't checked in this week. Encourage them to share how they're feeling!`,
        icon: Heart,
      });
    }

    return result;
  }, [history, summary, childName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No mood patterns to report this week
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <Alert
            key={alert.id}
            className={cn(
              alert.type === 'warning' && 'border-orange-200 bg-orange-50 dark:bg-orange-950/20',
              alert.type === 'positive' && 'border-green-200 bg-green-50 dark:bg-green-950/20',
              alert.type === 'info' && 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                alert.type === 'warning' && 'text-orange-600',
                alert.type === 'positive' && 'text-green-600',
                alert.type === 'info' && 'text-blue-600'
              )}
            />
            <AlertTitle
              className={cn(
                alert.type === 'warning' && 'text-orange-900 dark:text-orange-200',
                alert.type === 'positive' && 'text-green-900 dark:text-green-200',
                alert.type === 'info' && 'text-blue-900 dark:text-blue-200'
              )}
            >
              {alert.title}
            </AlertTitle>
            <AlertDescription
              className={cn(
                alert.type === 'warning' && 'text-orange-800 dark:text-orange-300',
                alert.type === 'positive' && 'text-green-800 dark:text-green-300',
                alert.type === 'info' && 'text-blue-800 dark:text-blue-300'
              )}
            >
              {alert.description}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
