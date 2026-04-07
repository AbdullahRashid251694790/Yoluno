/**
 * Suggestion Chips Component
 *
 * Quick response suggestions for the chat.
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  label: string;
  emoji?: string;
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  className?: string;
}

// Character color mapping for prompt buttons
const SUGGESTION_COLORS: Record<string, string> = {
  'tell-story': 'border-lumi/40 bg-lumi/5 hover:bg-lumi/10 hover:border-lumi/60 text-lumi',       // Stories → Lumi (purple)
  'learn-something': 'border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 text-primary', // Learn → Luno (teal)
  'next-adventure': 'border-lolo/40 bg-lolo/5 hover:bg-lolo/10 hover:border-lolo/60 text-lolo',    // Journeys → Lolo (orange)
  'about-family': 'border-lala/40 bg-lala/5 hover:bg-lala/10 hover:border-lala/60 text-lala',      // Family → Lala (gold)
};

export function SuggestionChips({
  suggestions,
  onSelect,
  className,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide', className)}>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className={cn('rounded-full whitespace-nowrap shrink-0 !text-caption !px-3 !py-1', SUGGESTION_COLORS[suggestion.id])}
        >
          {suggestion.emoji && <span className="mr-1">{suggestion.emoji}</span>}
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}

export const defaultSuggestions: Suggestion[] = [
  { id: '1', label: 'Tell me a story', emoji: '📖' },
  { id: '2', label: 'Teach me something', emoji: '🧠' },
  { id: '3', label: "What's my next adventure?", emoji: '🗺️' },
  { id: '4', label: 'Tell me about my family', emoji: '👨‍👩‍👧' },
];
