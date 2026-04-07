/**
 * Family Member Node
 *
 * Node component for the family tree visualization.
 * Supports drag-and-drop positioning.
 */

import { useState, useRef, useCallback } from 'react';
import { Edit2, Trash2, GripVertical, CheckCircle2, Circle, Briefcase, Heart, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api';

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: 'Parent',
  grandparent: 'Grandparent',
  sibling: 'Sibling',
  aunt_uncle: 'Aunt/Uncle',
  cousin: 'Cousin',
  spouse: 'Spouse',
  child: 'Child',
  other: 'Family',
};

const SPECIFIC_RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Father', mother: 'Mother', step_father: 'Step-Father', step_mother: 'Step-Mother',
  paternal_grandfather: 'Grandfather', paternal_grandmother: 'Grandmother',
  maternal_grandfather: 'Grandfather', maternal_grandmother: 'Grandmother',
  brother: 'Brother', sister: 'Sister', step_sibling: 'Step-Sibling',
  paternal_uncle: 'Uncle', paternal_aunt: 'Aunt',
  paternal_uncle_wife: "Uncle's Wife", paternal_aunt_husband: "Aunt's Husband",
  maternal_uncle: 'Uncle', maternal_aunt: 'Aunt',
  maternal_uncle_wife: "Uncle's Wife", maternal_aunt_husband: "Aunt's Husband",
  cousin: 'Cousin',
};

// Relationship-based colors for avatars
const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  parent: { bg: 'bg-primary/10', text: 'text-primary' },
  grandparent: { bg: 'bg-primary/10', text: 'text-primary' },
  sibling: { bg: 'bg-primary/10', text: 'text-primary' },
  aunt_uncle: { bg: 'bg-gold/10', text: 'text-gold' },
  cousin: { bg: 'bg-primary/10', text: 'text-primary' },
  spouse: { bg: 'bg-lolo/10', text: 'text-lolo' },
  child: { bg: 'bg-primary/10', text: 'text-primary' },
  other: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

// Calculate completeness score
function getCompletenessScore(member: FamilyMemberRow): { score: number; total: number } {
  let score = 0;
  const total = 5;

  if (member.name) score++;
  if (member.photo_url) score++;
  if (member.hobbies && member.hobbies.length > 0) score++;
  if (member.fun_facts) score++;
  if (member.occupation || member.birth_date) score++;

  return { score, total };
}

// Calculate age from birth date
function getAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface FamilyMemberNodeProps {
  member: FamilyMemberRow;
  onEdit: () => void;
  onDelete: () => void;
  onPositionChange?: (x: number, y: number) => void;
  isDraggable?: boolean;
  className?: string;
}

export function FamilyMemberNode({
  member,
  onEdit,
  onDelete,
  onPositionChange,
  isDraggable = true,
  className,
}: FamilyMemberNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const relationshipLabel =
    (member.specific_relationship && SPECIFIC_RELATIONSHIP_LABELS[member.specific_relationship]) ||
    RELATIONSHIP_LABELS[member.relationship || 'other'] || 'Family';

  const colors = RELATIONSHIP_COLORS[member.relationship || 'other'] || RELATIONSHIP_COLORS.other;
  const completeness = getCompletenessScore(member);
  const age = getAge(member.birth_date);
  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDraggable) return;

      e.preventDefault();
      setIsDragging(true);

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      dragStartPos.current = { x: clientX, y: clientY };
    },
    [isDraggable]
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      setIsDragging(false);

      if (onPositionChange && nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        const parent = nodeRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const x = rect.left - parentRect.left;
          const y = rect.top - parentRect.top;
          onPositionChange(Math.round(x), Math.round(y));
        }
      }
    },
    [isDragging, onPositionChange]
  );

  return (
    <div
      ref={nodeRef}
      className={cn(
        'relative bg-card rounded-xl shadow-md border p-4 w-44 transition-all hover:shadow-lg hover:border-primary/30',
        isDragging && 'shadow-lg scale-105 z-50',
        !member.is_alive && 'opacity-80',
        isDraggable ? 'cursor-grab' : 'cursor-pointer',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        left: member.position_x || 0,
        top: member.position_y || 0,
      }}
      onClick={onEdit}
    >
      {/* Drag Handle */}
      {isDraggable && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 p-1 text-muted-foreground hover:text-foreground cursor-grab"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6 rounded-full shadow"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {member.name} from your family tree. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Content */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center text-center">
              {/* Completeness Indicator */}
              <div className="absolute top-1 left-1">
                {completeness.score === completeness.total ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: completeness.total }).map((_, i) => (
                      <Circle
                        key={i}
                        className={cn(
                          'h-1.5 w-1.5',
                          i < completeness.score ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Avatar className="h-16 w-16 mb-2">
                <AvatarImage src={getUploadUrl(member.photo_url)} alt={member.name} />
                <AvatarFallback className={cn(colors.bg, colors.text, 'text-body-lg font-semibold')}>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <h4 className="font-semibold text-body-sm truncate w-full">{member.name}</h4>

              {/* Age/Birth Year */}
              {(age !== null || birthYear) && (
                <p className="text-caption text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {member.is_alive && age !== null ? `${age} yrs` : birthYear}
                  {!member.is_alive && ' - In Memory'}
                </p>
              )}

              <Badge
                variant={member.is_alive ? 'secondary' : 'outline'}
                className="mt-1 text-caption"
              >
                {relationshipLabel}
              </Badge>

              {member.occupation && (
                <p className="text-caption text-muted-foreground mt-1 truncate w-full flex items-center justify-center gap-1">
                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{member.occupation}</span>
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs p-3">
            <div className="space-y-2">
              <p className="font-semibold">{member.name}</p>
              {member.connection_description && (
                <p className="text-body-sm text-muted-foreground">{member.connection_description}</p>
              )}
              {member.hobbies && member.hobbies.length > 0 && (
                <div className="flex items-start gap-1 text-body-sm">
                  <Heart className="h-3 w-3 mt-0.5 text-lolo flex-shrink-0" />
                  <span>{member.hobbies.join(', ')}</span>
                </div>
              )}
              {member.fun_facts && (
                <p className="text-body-sm italic text-muted-foreground">"{member.fun_facts}"</p>
              )}
              {completeness.score < completeness.total && (
                <p className="text-caption text-gold">
                  Add more details to help Luno ({completeness.score}/{completeness.total})
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
