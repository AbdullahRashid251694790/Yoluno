/**
 * Avatar Picker Component
 *
 * Allows selecting from pre-set avatars or uploading a custom photo.
 * Used when creating/editing child profiles.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAllAvatars } from '@/hooks/queries/useAvatars';
import { Skeleton } from '@/components/ui/skeleton';

interface AvatarPickerValue {
  type: 'library' | 'custom';
  avatarId?: string;
  avatarUrl?: string;
  customFile?: File;
  customPreview?: string;
}

interface AvatarPickerProps {
  value?: AvatarPickerValue;
  onChange: (value: AvatarPickerValue | null) => void;
  disabled?: boolean;
  maxAvatars?: number;
  className?: string;
}

export function AvatarPicker({
  value,
  onChange,
  disabled = false,
  maxAvatars = 3,
  className,
}: AvatarPickerProps) {
  const { data: avatars = [], isLoading } = useAllAvatars();
  const [customPreview, setCustomPreview] = useState<string | null>(
    value?.customPreview || null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Get first N avatars from library
  const displayAvatars = avatars.slice(0, maxAvatars);

  const handleAvatarSelect = useCallback(
    (avatarId: string, avatarUrl: string) => {
      if (disabled) return;
      setCustomPreview(null);
      onChange({
        type: 'library',
        avatarId,
        avatarUrl,
      });
    },
    [disabled, onChange]
  );

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file || disabled) {
        setCustomPreview(null);
        if (!value?.avatarId) {
          onChange(null);
        }
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setCustomPreview(preview);
        onChange({
          type: 'custom',
          customFile: file,
          customPreview: preview,
        });
      };
      reader.readAsDataURL(file);
    },
    [disabled, onChange, value?.avatarId]
  );

  const handleUploadClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleClearCustom = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCustomPreview(null);
      onChange(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onChange]
  );

  const isLibrarySelected = value?.type === 'library';
  const isCustomSelected = value?.type === 'custom';

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Library Avatars */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Choose an avatar
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {isLoading ? (
            <>
              {[...Array(Math.min(maxAvatars, 3))].map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-full" />
              ))}
            </>
          ) : displayAvatars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No avatars available</p>
          ) : (
            displayAvatars.map((avatar) => {
              const isSelected =
                isLibrarySelected && value?.avatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAvatarSelect(avatar.id, avatar.imageUrl)}
                  className={cn(
                    'relative rounded-full p-1 transition-all',
                    'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-child-secondary text-xl text-white">
                      {avatar.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Custom Upload */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground text-center">
          Upload a photo
        </p>
        <div className="flex justify-center">
          <div
            onClick={handleUploadClick}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-full transition-all cursor-pointer',
              'h-20 w-20 border-2 border-dashed',
              isCustomSelected
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-muted-foreground/25 hover:border-primary/50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {customPreview ? (
              <>
                <img
                  src={customPreview}
                  alt="Custom avatar"
                  className="h-full w-full object-cover rounded-full"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                    onClick={handleClearCustom}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {isCustomSelected && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-[10px]">5MB max</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
