/**
 * Child Profile Card
 *
 * Card displaying a child profile with actions.
 */

import { Link } from 'react-router-dom';
import type { ChildProfileRow } from '@/types/database';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { Play, BookOpen, Settings } from 'lucide-react';

interface ChildProfileCardProps {
  child: ChildProfileRow;
  avatarUrl?: string;
  onEdit?: () => void;
}

export function ChildProfileCard({ child, avatarUrl, onEdit }: ChildProfileCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={child.name} />
            <AvatarFallback className="bg-child-primary/20 text-2xl text-child-primary">
              {getInitials(child.name)}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-4 text-xl font-semibold">{child.name}</h3>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">{child.age} years old</Badge>
            {child.gender && child.gender !== 'prefer_not_to_say' && (
              <Badge
                variant="outline"
                className={cn(
                  child.gender === 'boy' && 'border-blue-300 bg-blue-50 text-blue-700',
                  child.gender === 'girl' && 'border-pink-300 bg-pink-50 text-pink-700'
                )}
              >
                {child.gender === 'boy' ? '👦 Boy' : '👧 Girl'}
              </Badge>
            )}
            {child.personality_mode && (
              <Badge variant="outline">{child.personality_mode}</Badge>
            )}
          </div>

          {child.last_active_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              Active {formatRelativeTime(child.last_active_at)}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-center gap-2 border-t bg-muted/50 px-6 py-4">
        <Link to={`/kids/${child.id}`}>
          <Button size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Play
          </Button>
        </Link>
        <Link to="/dashboard/stories">
          <Button size="sm" variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Story
          </Button>
        </Link>
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
