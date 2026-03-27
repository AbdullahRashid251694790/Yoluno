/**
 * Relationship Group
 *
 * Section header with emoji and horizontal scroll for family members.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GroupType = 'self' | 'parent' | 'siblings' | 'grandparents' | 'auntsUncles' | 'cousins' | 'other';

interface RelationshipGroupProps {
  type: GroupType;
  children: ReactNode;
  count?: number;
  horizontal?: boolean;
}

// Group configuration
const GROUP_CONFIG: Record<GroupType, {
  emoji: string;
  label: string;
  underlineColor: string;
}> = {
  self: {
    emoji: '💖',
    label: 'Me',
    underlineColor: 'bg-lolo/10',
  },
  parent: {
    emoji: '👑',
    label: 'Parent',
    underlineColor: 'bg-gold/10',
  },
  siblings: {
    emoji: '🎯',
    label: 'Brothers & Sisters',
    underlineColor: 'bg-primary',
  },
  grandparents: {
    emoji: '🏠',
    label: 'Grandparents',
    underlineColor: 'bg-primary/10',
  },
  auntsUncles: {
    emoji: '🎁',
    label: 'Aunts & Uncles',
    underlineColor: 'bg-primary/10',
  },
  cousins: {
    emoji: '🎮',
    label: 'Cousins',
    underlineColor: 'bg-primary/10',
  },
  other: {
    emoji: '⭐',
    label: 'Other Family',
    underlineColor: 'bg-muted-foreground/40',
  },
};

export function RelationshipGroup({ type, children, count, horizontal }: RelationshipGroupProps) {
  const config = GROUP_CONFIG[type];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xl">{config.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-foreground">
              {config.label}
            </h3>
            {count !== undefined && count > 0 && (
              <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          <div className={cn('h-1 w-16 rounded-full mt-1', config.underlineColor)} />
        </div>
      </div>

      {/* Content */}
      {horizontal ? (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {children}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
