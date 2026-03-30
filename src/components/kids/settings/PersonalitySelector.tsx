/**
 * Personality Selector Component
 *
 * Allows users to select Luno's personality mode.
 * All data from database - no hardcoding.
 */

import { usePersonalityConfigs, type PersonalityConfig } from '@/hooks/queries/useKidsMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared';
import { Check, Sparkles } from 'lucide-react';

interface PersonalitySelectorProps {
  selectedPersonality: string | null;
  onSelect: (personality: PersonalityConfig) => void;
  compact?: boolean;
}

export function PersonalitySelector({
  selectedPersonality,
  onSelect,
  compact = false,
}: PersonalitySelectorProps) {
  const { data: personalities = [], isLoading } = usePersonalityConfigs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {personalities.map((personality) => (
          <button
            key={personality.mode_key}
            onClick={() => onSelect(personality)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
              selectedPersonality === personality.mode_key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted'
            }`}
          >
            <span>{personality.emoji}</span>
            <span className="text-body-sm font-medium">{personality.label}</span>
            {selectedPersonality === personality.mode_key && (
              <Check className="h-4 w-4" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Luno's Personality
        </CardTitle>
        <CardDescription>
          Choose how Luno communicates with you
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {personalities.map((personality) => (
          <button
            key={personality.mode_key}
            onClick={() => onSelect(personality)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedPersonality === personality.mode_key
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-h3 flex-shrink-0">{personality.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{personality.label}</p>
                  {selectedPersonality === personality.mode_key && (
                    <Badge variant="default" className="text-caption">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-body-sm text-muted-foreground">
                  {personality.description}
                </p>
                {personality.example_greeting && (
                  <p className="text-body-sm text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-3">
                    "{personality.example_greeting}"
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Simple personality badge for display
 */
export function PersonalityBadge({ personalityKey }: { personalityKey: string }) {
  const { data: personalities = [] } = usePersonalityConfigs();
  const personality = personalities.find((p) => p.mode_key === personalityKey);

  if (!personality) {
    return null;
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <span>{personality.emoji}</span>
      <span>{personality.label}</span>
    </Badge>
  );
}
