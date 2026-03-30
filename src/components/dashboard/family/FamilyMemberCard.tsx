/**
 * Family Member Card
 *
 * Card component for displaying family member information.
 */

import { User, Briefcase, Heart, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface FamilyMemberCardProps {
  member: FamilyMemberRow;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function FamilyMemberCard({
  member,
  onClick,
  isSelected = false,
  className,
}: FamilyMemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const relationshipLabel =
    RELATIONSHIP_LABELS[member.relationship || 'other'] || 'Family';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
        !member.is_alive && 'opacity-75',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={getUploadUrl(member.photo_url)} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate">{member.name}</h4>
              {!member.is_alive && (
                <Badge variant="outline" className="text-caption">
                  In Memory
                </Badge>
              )}
            </div>

            <Badge variant="secondary" className="mt-1">
              {relationshipLabel}
            </Badge>

            {member.connection_description && (
              <p className="text-caption text-muted-foreground mt-1 truncate">
                {member.connection_description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2 text-caption text-muted-foreground">
              {member.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {member.occupation}
                </span>
              )}

              {member.hobbies && member.hobbies.length > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {member.hobbies.slice(0, 2).join(', ')}
                  {member.hobbies.length > 2 && ` +${member.hobbies.length - 2}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
