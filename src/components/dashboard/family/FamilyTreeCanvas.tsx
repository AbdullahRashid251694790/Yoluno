/**
 * Family Tree Canvas
 *
 * Interactive canvas for visualizing and arranging the family tree.
 * Organizes members by generation level with connecting lines.
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { FamilyMemberNode } from './FamilyMemberNode';
import { Button } from '@/components/ui/button';
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';

// Generation levels and their labels
const GENERATION_LABELS: Record<number, string> = {
  2: 'Grandparents',
  1: 'Parents & Aunts/Uncles',
  0: 'Siblings & Cousins',
  [-1]: 'Children',
};

// All possible generations in order
const ALL_GENERATIONS = [2, 1, 0, -1];

// Map relationship types to generation levels
const RELATIONSHIP_TO_GENERATION: Record<string, number> = {
  grandparent: 2,
  parent: 1,
  aunt_uncle: 1,
  sibling: 0,
  cousin: 0,
  spouse: 0,
  child: -1,
  other: 0,
};

interface FamilyTreeCanvasProps {
  members: FamilyMemberRow[];
  onEditMember: (member: FamilyMemberRow) => void;
  onDeleteMember: (memberId: string) => void;
  onAddMember?: () => void;
  onPositionChange?: (
    memberId: string,
    x: number,
    y: number
  ) => void;
  className?: string;
}

export function FamilyTreeCanvas({
  members,
  onEditMember,
  onDeleteMember,
  onAddMember,
  onPositionChange,
  className,
}: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [linePositions, setLinePositions] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  // Group members by generation level
  const membersByGeneration = useMemo(() => {
    const groups: Record<number, FamilyMemberRow[]> = {};

    members.forEach((member) => {
      // Use stored generation level or derive from relationship type
      const generation =
        member.generation_level ??
        RELATIONSHIP_TO_GENERATION[member.relationship || 'other'] ??
        0;

      if (!groups[generation]) {
        groups[generation] = [];
      }
      groups[generation].push(member);
    });

    // Sort by display order within each generation
    Object.keys(groups).forEach((gen) => {
      groups[Number(gen)].sort(
        (a, b) => (a.position_x || 0) - (b.position_x || 0)
      );
    });

    return groups;
  }, [members]);

  // Get sorted generation levels (descending: grandparents first)
  const sortedGenerations = useMemo(() => {
    return Object.keys(membersByGeneration)
      .map(Number)
      .sort((a, b) => b - a);
  }, [membersByGeneration]);

  const handlePositionChange = useCallback(
    (memberId: string) => (x: number, y: number) => {
      onPositionChange?.(memberId, x, y);
    },
    [onPositionChange]
  );

  // Determine which generations to show (existing + adjacent empty ones)
  const generationsToShow = useMemo(() => {
    if (members.length === 0) {
      return [1]; // Start with parents if empty
    }

    const existingGens = new Set(sortedGenerations);
    const toShow = new Set<number>();

    // Add all existing generations
    sortedGenerations.forEach(gen => toShow.add(gen));

    // Add adjacent empty generations for context
    sortedGenerations.forEach(gen => {
      if (gen < 2) toShow.add(gen + 1); // Add generation above
      if (gen > -1) toShow.add(gen - 1); // Add generation below
    });

    return Array.from(toShow).sort((a, b) => b - a);
  }, [sortedGenerations, members.length]);

  if (members.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-96 bg-muted/30 rounded-lg border-2 border-dashed',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No family members yet</p>
          <p className="text-sm mt-1 mb-4">
            Add family members to build your family tree
          </p>
          {onAddMember && (
            <Button onClick={onAddMember} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add First Member
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={canvasRef} className={cn('space-y-6 relative', className)}>
      {/* Connection Lines SVG */}
      {sortedGenerations.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--border))" />
              <stop offset="100%" stopColor="hsl(var(--border))" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {generationsToShow.map((generation, index) => {
        const generationMembers = membersByGeneration[generation] || [];
        const label =
          GENERATION_LABELS[generation] ||
          (generation > 0
            ? `Generation +${generation}`
            : `Generation ${generation}`);
        const isEmpty = generationMembers.length === 0;
        const isFirst = index === 0;
        const isLast = index === generationsToShow.length - 1;

        return (
          <div key={generation} className="space-y-4 relative">
            {/* Connecting Line to Previous Generation */}
            {!isFirst && !isEmpty && (
              <div className="absolute left-1/2 -top-3 w-px h-3 bg-border" />
            )}

            {/* Generation Label */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className={cn(
                'text-sm font-medium px-3 py-1 rounded-full',
                isEmpty
                  ? 'text-muted-foreground/50 bg-muted/30'
                  : 'text-muted-foreground bg-muted/50'
              )}>
                {label}
                {!isEmpty && (
                  <span className="ml-2 text-xs opacity-70">
                    ({generationMembers.length})
                  </span>
                )}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Members Grid or Empty State */}
            {isEmpty ? (
              <div className="flex justify-center py-4">
                <button
                  onClick={onAddMember}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group w-44"
                >
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                    Add {label.split(' ')[0]}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-8 py-2">
                {generationMembers.map((member) => (
                  <div key={member.id} className="relative">
                    <FamilyMemberNode
                      member={member}
                      onEdit={() => onEditMember(member)}
                      onDelete={() => onDeleteMember(member.id)}
                      onPositionChange={handlePositionChange(member.id)}
                      isDraggable={false}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Connecting Line to Next Generation */}
            {!isLast && !isEmpty && generationsToShow[index + 1] !== undefined && (
              <div className="flex justify-center">
                <div className="w-px h-4 bg-gradient-to-b from-border to-transparent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
