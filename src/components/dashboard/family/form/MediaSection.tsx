/**
 * Media Section
 *
 * Form section for photo upload, video upload, and voice recorder.
 */

import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from '../PhotoUpload';
import { VoiceRecorder } from '../VoiceRecorder';
import { Video, X } from 'lucide-react';
import type { CreateFamilyMemberFormData } from '@/types/forms';

interface MediaSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  existingPhotoUrl?: string;
  existingVideoUrl?: string;
  onPhotoChange: (file: File | null) => void;
  onVideoChange: (file: File | null) => void;
  videoFile: File | null;
  isLoading: boolean;
}

export function MediaSection({
  control,
  existingPhotoUrl,
  existingVideoUrl,
  onPhotoChange,
  onVideoChange,
  videoFile,
  isLoading,
}: MediaSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
        Photo & Video
      </h3>

      <PhotoUpload
        value={existingPhotoUrl}
        onChange={onPhotoChange}
        disabled={isLoading}
      />

      {/* Video upload */}
      <div className="space-y-2">
        <Label>Video (optional)</Label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onVideoChange(file);
          }}
          disabled={isLoading}
        />
        {videoFile ? (
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-body-sm flex-1 truncate">{videoFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onVideoChange(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : existingVideoUrl ? (
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-body-sm flex-1 text-muted-foreground">Video uploaded</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => videoInputRef.current?.click()}
            disabled={isLoading}
          >
            <Video className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        )}
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
