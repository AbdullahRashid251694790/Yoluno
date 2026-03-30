/**
 * Basic Info Section
 *
 * Form section for family member basic information.
 */

import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
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
  { value: 'other', label: 'Other' },
];

const SIDE_OPTIONS = [
  { value: 'direct', label: "Child's direct family" },
  { value: 'paternal', label: "Father's side" },
  { value: 'maternal', label: "Mother's side" },
];

// Specific relationships shown based on generic relationship + side
const SPECIFIC_RELATIONSHIP_OPTIONS: Record<string, Record<string, { value: string; label: string }[]>> = {
  parent: {
    direct: [
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
    ],
  },
  grandparent: {
    paternal: [
      { value: 'paternal_grandfather', label: 'Paternal Grandfather' },
      { value: 'paternal_grandmother', label: 'Paternal Grandmother' },
    ],
    maternal: [
      { value: 'maternal_grandfather', label: 'Maternal Grandfather' },
      { value: 'maternal_grandmother', label: 'Maternal Grandmother' },
    ],
  },
  sibling: {
    direct: [
      { value: 'brother', label: 'Brother' },
      { value: 'sister', label: 'Sister' },
      { value: 'step_sibling', label: 'Step-Sibling' },
    ],
  },
  aunt_uncle: {
    paternal: [
      { value: 'paternal_uncle', label: 'Uncle (Dad\'s Brother)' },
      { value: 'paternal_aunt', label: 'Aunt (Dad\'s Sister)' },
    ],
    maternal: [
      { value: 'maternal_uncle', label: 'Uncle (Mom\'s Brother)' },
      { value: 'maternal_aunt', label: 'Aunt (Mom\'s Sister)' },
    ],
  },
  cousin: {
    paternal: [{ value: 'cousin', label: 'Cousin (Paternal)' }],
    maternal: [{ value: 'cousin', label: 'Cousin (Maternal)' }],
  },
};

// Which relationships need a side selection
const NEEDS_SIDE: Record<string, string[]> = {
  parent: ['direct'],
  grandparent: ['paternal', 'maternal'],
  sibling: ['direct'],
  aunt_uncle: ['paternal', 'maternal'],
  cousin: ['paternal', 'maternal'],
  spouse: [],
  child: [],
  other: [],
};

interface BasicInfoSectionProps {
  control: Control<CreateFamilyMemberFormData>;
  register: ReturnType<typeof import('react-hook-form').useForm>['register'];
  errors: FieldErrors<CreateFamilyMemberFormData>;
  isLiving: boolean;
  isLoading: boolean;
  setValue: (name: keyof CreateFamilyMemberFormData, value: any) => void;
}

export function BasicInfoSection({
  control,
  register,
  errors,
  isLiving,
  isLoading,
  setValue,
}: BasicInfoSectionProps) {
  const relationship = useWatch({ control, name: 'relationshipToChild' });
  const side = useWatch({ control, name: 'side' });

  const sideOptions = NEEDS_SIDE[relationship] || [];
  const showSide = sideOptions.length > 0;
  const specificOptions = SPECIFIC_RELATIONSHIP_OPTIONS[relationship]?.[side] || [];
  const showSpecific = specificOptions.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
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
            <p className="text-body-sm text-destructive">{errors.name.message}</p>
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
                onValueChange={(val) => {
                  field.onChange(val);
                  // Auto-set side based on relationship
                  const sides = NEEDS_SIDE[val] || [];
                  if (sides.length === 1) {
                    setValue('side', sides[0] as any);
                  } else if (sides.length === 0) {
                    setValue('side', 'direct');
                  }
                  setValue('specificRelationship', undefined as any);
                }}
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
            <p className="text-body-sm text-destructive">
              {errors.relationshipToChild.message}
            </p>
          )}
        </div>
      </div>

      {/* Family side selection */}
      {showSide && sideOptions.length > 1 && (
        <div className="space-y-2">
          <Label>Which side of the family?</Label>
          <Controller
            name="side"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  setValue('specificRelationship', undefined as any);
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  {SIDE_OPTIONS.filter((opt) => sideOptions.includes(opt.value)).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {/* Specific relationship */}
      {showSpecific && (
        <div className="space-y-2">
          <Label>Specific Relationship</Label>
          <Controller
            name="specificRelationship"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specific relationship" />
                </SelectTrigger>
                <SelectContent>
                  {specificOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

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
            <p className="text-body-sm text-destructive">{errors.birthYear.message}</p>
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
            <p className="text-body-sm text-destructive">{errors.occupation.message}</p>
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
