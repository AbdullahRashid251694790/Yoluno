/**
 * Story Card
 *
 * Card displaying a story preview.
 */

import type { StoryRow } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, truncate, calculateReadingTime } from '@/lib/utils';
import { Heart, Clock, BookOpen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryCardProps {
  story: StoryRow;
  onRead?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
}

export function StoryCard({ story, onRead, onToggleFavorite, onDelete }: StoryCardProps) {
  const readingTime = story.content ? calculateReadingTime(story.content) : 0;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-lg">{story.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className={cn(
              'shrink-0',
              story.is_favorite && 'text-destructive'
            )}
          >
            <Heart
              className={cn(
                'h-5 w-5',
                story.is_favorite && 'fill-current'
              )}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {story.content && (
          <p className="text-sm text-muted-foreground">
            {truncate(story.content, 150)}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {story.theme && <Badge variant="secondary">{story.theme}</Badge>}
          {story.mood && <Badge variant="outline">{story.mood}</Badge>}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readingTime} min
          </span>
          <span>{formatRelativeTime(story.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" onClick={onRead} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Read
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
