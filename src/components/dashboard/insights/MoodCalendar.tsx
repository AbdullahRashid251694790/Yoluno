/**
 * Mood Calendar Component
 *
 * Calendar grid visualization showing daily mood check-ins.
 * Each day is colored based on the recorded mood.
 */

import { useMemo } from 'react';
import { useMoodHistory } from '@/hooks/queries';
import { moodConfigs } from '@/lib/moodResponses';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MoodCalendarProps {
  childId: string;
  days?: number;
}

// Mood to color mapping for calendar cells
const moodColors: Record<string, string> = {
  happy: 'bg-yellow-400 hover:bg-yellow-500',
  sad: 'bg-blue-400 hover:bg-blue-500',
  angry: 'bg-red-400 hover:bg-red-500',
  scared: 'bg-purple-400 hover:bg-purple-500',
  calm: 'bg-green-400 hover:bg-green-500',
};

export function MoodCalendar({ childId, days = 28 }: MoodCalendarProps) {
  const { data: moodData = [], isLoading, isError } = useMoodHistory(childId, days);

  // Create a map for quick mood lookup by date
  const moodByDate = useMemo(() => {
    const map = new Map<string, string>();
    moodData.forEach((entry) => {
      // Normalize date to YYYY-MM-DD
      const date = new Date(entry.date).toISOString().split('T')[0];
      map.set(date, entry.mood);
    });
    return map;
  }, [moodData]);

  // Generate calendar days (last N days)
  const calendarDays = useMemo(() => {
    const result: { date: Date; dateStr: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        date,
        dateStr: date.toISOString().split('T')[0],
      });
    }
    return result;
  }, [days]);

  // Get day labels for header
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Unable to load mood calendar
      </div>
    );
  }

  // Calculate grid offset for first day alignment
  const firstDayOfWeek = calendarDays[0]?.date.getDay() || 0;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(moodConfigs).map(([mood, config]) => (
          <div key={mood} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-3 h-3 rounded-sm',
                moodColors[mood]
              )}
            />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span className="text-muted-foreground">No check-in</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="text-xs text-center text-muted-foreground font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for alignment */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {calendarDays.map(({ date, dateStr }) => {
            const mood = moodByDate.get(dateStr);
            const config = mood ? moodConfigs[mood as keyof typeof moodConfigs] : null;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dayOfMonth = date.getDate();

            return (
              <div
                key={dateStr}
                className={cn(
                  'aspect-square rounded-sm transition-colors cursor-default flex items-center justify-center text-xs relative group',
                  mood ? moodColors[mood] : 'bg-muted/50',
                  isToday && 'ring-2 ring-primary ring-offset-1'
                )}
                title={
                  mood && config
                    ? `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${config.emoji} ${config.label}`
                    : `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: No check-in`
                }
              >
                {/* Day number on hover or for today */}
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center text-xs font-medium transition-opacity',
                    mood ? 'text-white/80' : 'text-muted-foreground',
                    !isToday && 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  {dayOfMonth}
                </span>
                {/* Mood emoji */}
                {mood && config && !isToday && (
                  <span className="group-hover:opacity-0 transition-opacity">
                    {config.emoji}
                  </span>
                )}
                {isToday && (
                  <span className="font-medium">
                    {mood && config ? config.emoji : dayOfMonth}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
