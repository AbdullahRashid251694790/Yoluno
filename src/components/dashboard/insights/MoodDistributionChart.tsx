/**
 * Mood Distribution Chart Component
 *
 * Bar chart visualization showing mood frequency distribution
 * over a specified time period.
 */

import { useMoodSummary } from '@/hooks/queries';
import { moodConfigs, getAllMoods } from '@/lib/moodResponses';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MoodDistributionChartProps {
  childId: string;
  days?: number;
}

// Mood to bar color mapping
const moodBarColors: Record<string, string> = {
  happy: 'bg-lala/10',
  sad: 'bg-primary/10',
  angry: 'bg-destructive/10',
  scared: 'bg-primary/10',
  calm: 'bg-primary/10',
};

export function MoodDistributionChart({
  childId,
  days = 7,
}: MoodDistributionChartProps) {
  const {
    data: summary,
    isLoading,
    isError,
  } = useMoodSummary(childId, days);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-body-sm text-muted-foreground">
        Unable to load mood distribution
      </div>
    );
  }

  const allMoods = getAllMoods();
  const totalCheckins = summary?.total_checkins || 0;
  const distribution = summary?.distribution || [];

  // Create a map for quick lookup
  const distributionMap = new Map(
    distribution.map((d) => [d.mood, d])
  );

  // Get max count for scaling bars
  const maxCount = Math.max(
    ...distribution.map((d) => d.count),
    1
  );

  if (totalCheckins === 0) {
    return (
      <div className="text-center py-4 text-body-sm text-muted-foreground">
        No mood check-ins in the last {days} days
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-body-sm text-muted-foreground">
        {totalCheckins} check-in{totalCheckins !== 1 ? 's' : ''} in the last {days} days
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        {allMoods.map((mood) => {
          const moodData = distributionMap.get(mood);
          const count = moodData?.count || 0;
          const percentage = moodData?.percentage || 0;
          const barWidth = (count / maxCount) * 100;
          const config = moodConfigs[mood];

          return (
            <div key={mood} className="space-y-1">
              <div className="flex items-center justify-between text-body-sm">
                <div className="flex items-center gap-2">
                  <span>{config.emoji}</span>
                  <span className="font-medium">{config.label}</span>
                </div>
                <div className="text-muted-foreground">
                  {count} ({percentage.toFixed(0)}%)
                </div>
              </div>
              <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    moodBarColors[mood]
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Most Common Mood */}
      {summary?.most_common_mood && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-body-sm">
            <span className="text-muted-foreground">Most common mood:</span>
            <span className="font-medium flex items-center gap-1">
              {moodConfigs[summary.most_common_mood].emoji}
              {moodConfigs[summary.most_common_mood].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
