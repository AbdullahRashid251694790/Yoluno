/**
 * Basic Info Section
 *
 * Form section for family member basic information.
 */

import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateFamilyMemberFormData } from '@/types/forms';

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
];

interface BasicInfoSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  register: ReturnType<typeof import('react-hook-form').useForm>['register'];
  errors: FieldErrors<CreateFamilyMemberFormData>;
  isLiving: boolean;
  isLoading: boolean;
}

export function BasicInfoSection({
  control,
  register,
  errors,
  isLiving,
  isLoading,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Basic Information
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Enter name"
            {...register('name')}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationshipToChild">Relationship *</Label>
          <Controller
            name="relationshipToChild"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.relationshipToChild && (
            <p className="text-sm text-destructive">
              {errors.relationshipToChild.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthYear">Birth Year</Label>
          <Input
            id="birthYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="e.g., 1980"
            {...register('birthYear', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.birthYear && (
            <p className="text-sm text-destructive">{errors.birthYear.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            placeholder="e.g., Teacher, Engineer"
            {...register('occupation')}
            disabled={isLoading}
          />
          {errors.occupation && (
            <p className="text-sm text-destructive">{errors.occupation.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isLiving"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isLiving"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
            />
          )}
        />
        <Label htmlFor="isLiving" className="cursor-pointer">
          Currently living
        </Label>
      </div>

      {!isLiving && (
        <div className="space-y-2">
          <Label htmlFor="deathYear">Year of Passing</Label>
          <Input
            id="deathYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="e.g., 2020"
            {...register('deathYear', { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
