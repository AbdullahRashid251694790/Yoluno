/**
 * Family Member Node
 *
 * Node component for the family tree visualization.
 * Supports drag-and-drop positioning.
 */

import { useState, useRef, useCallback } from 'react';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
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
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';

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
    RELATIONSHIP_LABELS[member.relationship_type || 'other'] || 'Family';

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
        'relative bg-card rounded-xl shadow-md border p-3 w-40 transition-all',
        isDragging && 'shadow-lg scale-105 z-50',
        !member.is_alive && 'opacity-80',
        isDraggable && 'cursor-grab',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        left: member.position_x || 0,
        top: member.position_y || 0,
      }}
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
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={member.photo_url || undefined} alt={member.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <h4 className="font-semibold text-sm truncate w-full">{member.name}</h4>

        <Badge
          variant={member.is_alive ? 'secondary' : 'outline'}
          className="mt-1 text-xs"
        >
          {relationshipLabel}
        </Badge>

        {member.occupation && (
          <p className="text-xs text-muted-foreground mt-1 truncate w-full">
            {member.occupation}
          </p>
        )}
      </div>
    </div>
  );
}
