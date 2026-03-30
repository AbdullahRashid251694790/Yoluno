/**
 * Details Section
 *
 * Form section for fun facts, bio, and additional details.
 * Connection description is auto-generated from relationship + side selections.
 */

import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateFamilyMemberFormData } from '@/types/forms';

interface DetailsSectionProps {
  register: UseFormRegister<CreateFamilyMemberFormData>;
  errors: FieldErrors<CreateFamilyMemberFormData>;
  isLoading: boolean;
}

export function DetailsSection({
  register,
  errors,
  isLoading,
}: DetailsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
        Fun Facts & Stories
      </h3>

      <div className="space-y-2">
        <Label htmlFor="funFacts">Tell us something special</Label>
        <Textarea
          id="funFacts"
          placeholder="e.g., Grandpa once traveled around the world! Dad loves to make pancakes on weekends."
          {...register('funFacts')}
          disabled={isLoading}
          rows={3}
        />
        <p className="text-caption text-muted-foreground">
          Fun facts that Luno can share with kids
        </p>
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
