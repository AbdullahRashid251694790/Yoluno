/**
 * Details Section
 *
 * Form section for multiple fun facts/stories and bio.
 */

import { useState } from 'react';
import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { CreateFamilyMemberFormData } from '@/types/forms';

interface DetailsSectionProps {
  register: UseFormRegister<CreateFamilyMemberFormData>;
  errors: FieldErrors<CreateFamilyMemberFormData>;
  isLoading: boolean;
  additionalStories: string[];
  onAddStory: (story: string) => void;
  onRemoveStory: (index: number) => void;
}

export function DetailsSection({
  register,
  errors,
  isLoading,
  additionalStories,
  onAddStory,
  onRemoveStory,
}: DetailsSectionProps) {
  const [newStory, setNewStory] = useState('');

  const handleAddStory = () => {
    if (newStory.trim()) {
      onAddStory(newStory.trim());
      setNewStory('');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
        Fun Facts & Stories
      </h3>

      <div className="space-y-2">
        <Label htmlFor="funFacts">Tell us something special</Label>
        <Textarea
          id="funFacts"
          placeholder="e.g., Grandpa once traveled around the world!"
          {...register('funFacts')}
          disabled={isLoading}
          rows={2}
        />
        <p className="text-caption text-muted-foreground">
          Fun facts that Luno can share with kids
        </p>
      </div>

      {/* Additional stories */}
      {additionalStories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-caption text-muted-foreground">Added stories:</Label>
          {additionalStories.map((story, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border p-2 bg-muted/30">
              <p className="flex-1 text-body-sm">{story}</p>
              <button type="button" onClick={() => onRemoveStory(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add another story */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add another fun fact or story..."
          value={newStory}
          onChange={(e) => setNewStory(e.target.value)}
          disabled={isLoading}
          rows={2}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStory}
          disabled={!newStory.trim() || isLoading}
          className="!h-8 !text-caption"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Story
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio / Notes</Label>
        <Textarea
          id="bio"
          placeholder="Additional notes about this family member..."
          {...register('bio')}
          disabled={isLoading}
          rows={2}
        />
      </div>
    </div>
  );
}
