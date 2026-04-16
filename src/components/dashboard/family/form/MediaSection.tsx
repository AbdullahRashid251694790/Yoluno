/**
 * Media Section
 *
 * Form section for profile photo upload, multiple memory photos, and multiple video uploads.
 */

import { useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from '../PhotoUpload';
import { VoiceRecorder } from '../VoiceRecorder';
import { Video, Image as ImageIcon, X, Plus } from 'lucide-react';
import type { CreateFamilyMemberFormData } from '@/types/forms';

export interface PhotoEntry {
  file: File;
  story: string;
}

interface MediaSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  existingPhotoUrl?: string;
  onPhotoChange: (file: File | null) => void;
  videoFiles: File[];
  onAddVideo: (file: File) => void;
  onRemoveVideo: (index: number) => void;
  photoEntries: PhotoEntry[];
  onAddPhoto: (file: File) => void;
  onRemovePhoto: (index: number) => void;
  onUpdatePhotoStory: (index: number, story: string) => void;
  isLoading: boolean;
}

export function MediaSection({
  control,
  existingPhotoUrl,
  onPhotoChange,
  videoFiles,
  onAddVideo,
  onRemoveVideo,
  photoEntries,
  onAddPhoto,
  onRemovePhoto,
  onUpdatePhotoStory,
  isLoading,
}: MediaSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
        Profile Photo
      </h3>

      <PhotoUpload
        value={existingPhotoUrl}
        onChange={onPhotoChange}
        disabled={isLoading}
      />

      {/* Multiple memory photos */}
      <div className="space-y-2.5">
        <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
          Memory Photos
        </h3>
        <p className="text-caption text-muted-foreground">
          Add photos of special moments, holidays, or memories with this family member.
        </p>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onAddPhoto(file);
              e.target.value = '';
            }
          }}
          disabled={isLoading}
        />

        {photoEntries.length > 0 && (
          <div className="flex flex-col gap-3">
            {photoEntries.map((entry, i) => (
              <div key={i} className="rounded-lg border overflow-hidden bg-muted/10">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(entry.file)}
                    alt={entry.file.name}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(i)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-3">
                  <textarea
                    value={entry.story}
                    onChange={(e) => onUpdatePhotoStory(i, e.target.value)}
                    placeholder="Write a story or memory about this photo..."
                    className="w-full text-body-sm border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => photoInputRef.current?.click()}
          disabled={isLoading}
          className="!h-8 !text-caption"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {photoEntries.length === 0 ? 'Add Photo with Story' : 'Add Another Photo'}
        </Button>
      </div>

      {/* Video uploads */}
      <div className="space-y-2.5">
        <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
          Videos
        </h3>

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
