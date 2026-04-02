/**
 * Journey Template Card Component
 *
 * Displays a journey template with details and start action.
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  Users,
  Star,
  Play,
  Sparkles,
  BookOpen,
  Heart,
  Lightbulb,
  Palette,
} from 'lucide-react';
import type { JourneyTemplate } from '@/services/journeyTemplates';

// Category icons mapping
const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  habit: Clock,
  learning: BookOpen,
  social: Users,
  health: Heart,
  creativity: Palette,
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  habit: 'bg-destructive/10 text-destructive border-destructive',
  learning: 'bg-destructive/10 text-destructive border-destructive',
  social: 'bg-destructive/10 text-destructive border-destructive',
  health: 'bg-destructive/10 text-destructive border-destructive/20',
  creativity: 'bg-gold/10 text-gold border-gold',
};

// Difficulty badges
const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-primary/10 text-primary',
  medium: 'bg-lala/10 text-lala',
  hard: 'bg-destructive/10 text-destructive',
};

interface JourneyTemplateCardProps {
  template: JourneyTemplate;
  onStart?: (template: JourneyTemplate) => void;
  isStarting?: boolean;
  className?: string;
}

export function JourneyTemplateCard({
  template,
  onStart,
  isStarting = false,
  className,
}: JourneyTemplateCardProps) {
  const CategoryIcon = CATEGORY_ICONS[template.category] || Lightbulb;
  const categoryColor = CATEGORY_COLORS[template.category] || 'bg-muted text-foreground/70 border-border';

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all hover:shadow-md',
        template.is_featured && 'ring-2 ring-primary/20',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={cn('p-2 rounded-lg', categoryColor)}>
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            {template.is_featured && (
              <Badge variant="secondary" className="bg-lala/10 text-lala">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {template.difficulty && (
              <Badge
                variant="outline"
                className={DIFFICULTY_STYLES[template.difficulty]}
              >
                {template.difficulty}
              </Badge>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-body-lg mt-3 group-hover:text-primary transition-colors">
          {template.title}
        </h3>
      </CardHeader>

      <CardContent className="pb-3">
        {template.description && (
          <p className="text-body-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4 text-caption text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{template.duration_days} days</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Ages {template.age_range_min}-{template.age_range_max}</span>
          </div>
          {template.usage_count > 0 && (
            <div className="flex items-center gap-1">
              <Play className="h-3.5 w-3.5" />
              <span>{template.usage_count} started</span>
            </div>
          )}
        </div>
      </CardContent>

      {onStart && (
        <CardFooter className="pt-0">
          <Button
            onClick={() => onStart(template)}
            disabled={isStarting}
            className="w-full"
            size="sm"
          >
            {isStarting ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Journey
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
