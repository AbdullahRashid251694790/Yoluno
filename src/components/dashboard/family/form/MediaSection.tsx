/**
 * Media Section
 *
 * Form section for photo upload and multiple video uploads.
 */

import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from '../PhotoUpload';
import { VoiceRecorder } from '../VoiceRecorder';
import { Video, X, Plus } from 'lucide-react';
import type { CreateFamilyMemberFormData } from '@/types/forms';

interface MediaSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  existingPhotoUrl?: string;
  onPhotoChange: (file: File | null) => void;
  videoFiles: File[];
  onAddVideo: (file: File) => void;
  onRemoveVideo: (index: number) => void;
  isLoading: boolean;
}

export function MediaSection({
  control,
  existingPhotoUrl,
  onPhotoChange,
  videoFiles,
  onAddVideo,
  onRemoveVideo,
  isLoading,
}: MediaSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
        Photo & Videos
      </h3>

      <PhotoUpload
        value={existingPhotoUrl}
        onChange={onPhotoChange}
        disabled={isLoading}
      />

      {/* Video uploads */}
      <div className="space-y-2.5">
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onAddVideo(file);
              e.target.value = '';
            }
          }}
          disabled={isLoading}
        />

        {videoFiles.length > 0 && (
          <div className="space-y-1.5">
            {videoFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border p-2 bg-muted/30">
                <Video className="h-4 w-4 text-primary shrink-0" />
                <span className="text-body-sm flex-1 truncate">{file.name}</span>
                <button type="button" onClick={() => onRemoveVideo(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          disabled={isLoading}
          className="!h-8 !text-caption"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {videoFiles.length === 0 ? 'Add Video' : 'Add Another Video'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Photo Description</Label>
        <Controller
          name="photoDescription"
          control={control}
          render={({ field }) => (
            <VoiceRecorder
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Describe the photo or record your voice..."
              disabled={isLoading}
            />
          )}
        />
      </div>
    </div>
  );
}
