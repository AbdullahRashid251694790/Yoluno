/**
 * Family Tree Canvas
 *
 * Interactive canvas for visualizing and arranging the family tree.
 * Organizes members by generation level.
 */

import { useMemo, useCallback } from 'react';
import { FamilyMemberNode } from './FamilyMemberNode';
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';

// Generation levels and their labels
const GENERATION_LABELS: Record<number, string> = {
  2: 'Grandparents',
  1: 'Parents & Aunts/Uncles',
  0: 'Siblings & Cousins',
  [-1]: 'Children',
};

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
  onPositionChange,
  className,
}: FamilyTreeCanvasProps) {
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

  if (members.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-96 bg-muted/30 rounded-lg border-2 border-dashed',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No family members yet</p>
          <p className="text-sm mt-1">
            Add family members to build your family tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {sortedGenerations.map((generation) => {
        const generationMembers = membersByGeneration[generation];
        const label =
          GENERATION_LABELS[generation] ||
          (generation > 0
            ? `Generation +${generation}`
            : `Generation ${generation}`);

        return (
          <div key={generation} className="space-y-4">
            {/* Generation Label */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium text-muted-foreground px-3">
                {label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Members Grid */}
            <div className="flex flex-wrap justify-center gap-6">
              {generationMembers.map((member) => (
                <FamilyMemberNode
                  key={member.id}
                  member={member}
                  onEdit={() => onEditMember(member)}
                  onDelete={() => onDeleteMember(member.id)}
                  onPositionChange={handlePositionChange(member.id)}
                  isDraggable={false} // Disable dragging in grid layout
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Connection Lines (SVG overlay) - could be added for visual connections */}
      {/* For now, we use a simpler generation-based layout */}
    </div>
  );
}
