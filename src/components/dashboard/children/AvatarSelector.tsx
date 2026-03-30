/**
 * Avatar Selector Component
 *
 * Paginated row of available avatars for child profile selection.
 * Shows 4 at a time with arrow buttons to navigate.
 */

import { useState } from 'react';
import { useAllAvatars } from '@/hooks/queries/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const PAGE_SIZE = 4;

interface AvatarSelectorProps {
  selectedAvatarId: string | null;
  onSelect: (avatarId: string) => void;
  disabled?: boolean;
}

export function AvatarSelector({
  selectedAvatarId,
  onSelect,
  disabled = false,
}: AvatarSelectorProps) {
  const { data: avatars, isLoading, isError } = useAllAvatars();
  const [page, setPage] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !avatars || avatars.length === 0) {
    return (
      <div className="text-center py-4 text-body-sm text-muted-foreground">
        No avatars available
      </div>
    );
  }

  const totalPages = Math.ceil(avatars.length / PAGE_SIZE);
  const visible = avatars.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPage((p) => p - 1)}
        disabled={!canGoPrev || disabled}
        className={cn(
          'rounded-full p-1 transition-colors',
          canGoPrev ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/30 cursor-default'
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex gap-2 flex-1 justify-center">
        {visible.map((avatar) => {
          const isSelected = avatar.id === selectedAvatarId;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              disabled={disabled}
              className={cn(
                'relative rounded-full p-0.5 transition-all',
                'hover:ring-2 hover:ring-primary/50',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                isSelected && 'ring-2 ring-primary bg-primary/10',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={avatar.name}
            >
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                <AvatarFallback className="text-body-lg">
                  {avatar.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setPage((p) => p + 1)}
        disabled={!canGoNext || disabled}
        className={cn(
          'rounded-full p-1 transition-colors',
          canGoNext ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/30 cursor-default'
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
