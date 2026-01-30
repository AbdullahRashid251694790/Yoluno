/**
 * Avatar Selector Component
 *
 * Grid of available avatars for child profile selection.
 * Fetches avatars from the library and shows selection state.
 */

import { useAllAvatars } from '@/hooks/queries/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !avatars || avatars.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No avatars available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
      {avatars.map((avatar) => {
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
              <AvatarImage src={avatar.image_url} alt={avatar.name} />
              <AvatarFallback className="text-lg">
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
  );
}
