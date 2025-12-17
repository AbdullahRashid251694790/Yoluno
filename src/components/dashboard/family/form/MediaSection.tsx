/**
 * Media Section
 *
 * Form section for photo upload and voice recorder.
 */

import { Controller, type Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from '../PhotoUpload';
import { VoiceRecorder } from '../VoiceRecorder';
import type { CreateFamilyMemberFormData } from '@/types/forms';

interface MediaSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  existingPhotoUrl?: string;
  onPhotoChange: (file: File | null) => void;
  isLoading: boolean;
}

export function MediaSection({
  control,
  existingPhotoUrl,
  onPhotoChange,
  isLoading,
}: MediaSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Photo
      </h3>

      <PhotoUpload
        value={existingPhotoUrl}
        onChange={onPhotoChange}
        disabled={isLoading}
      />

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
