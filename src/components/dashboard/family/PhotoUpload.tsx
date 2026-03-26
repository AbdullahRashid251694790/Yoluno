/**
 * Photo Upload Component
 *
 * Drag-and-drop photo upload with preview for family member photos.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PhotoUpload({
  value,
  onChange,
  onClear,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value ? (getUploadUrl(value) || value) : null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        onChange(null);
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
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onChange(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(null);
      onChange(null);
      onClear?.();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onChange, onClear]
  );

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer',
          'h-40 w-full',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !preview && 'border-muted-foreground/25 hover:border-primary/50',
          preview && 'border-transparent',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover rounded-lg"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isDragging ? (
              <>
                <ImageIcon className="h-10 w-10" />
                <p className="text-sm font-medium">Drop image here</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10" />
                <p className="text-sm font-medium">Click or drag to upload</p>
                <p className="text-xs">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
