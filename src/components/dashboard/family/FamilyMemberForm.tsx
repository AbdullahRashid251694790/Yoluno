/**
 * Family Member Form
 *
 * Form for adding/editing family members with rich data fields.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { VoiceRecorder } from './VoiceRecorder';
import { createFamilyMemberSchema, type CreateFamilyMemberFormData } from '@/types/forms';
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';

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

const HOBBY_SUGGESTIONS = [
  'Reading',
  'Cooking',
  'Gardening',
  'Sports',
  'Music',
  'Art',
  'Travel',
  'Photography',
  'Gaming',
  'Hiking',
  'Fishing',
  'Crafts',
];

interface FamilyMemberFormProps {
  member?: FamilyMemberRow;
  onSubmit: (data: CreateFamilyMemberFormData, photoFile: File | null) => void;
  isLoading?: boolean;
  className?: string;
}

export function FamilyMemberForm({
  member,
  onSubmit,
  isLoading = false,
  className,
}: FamilyMemberFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [hobbyInput, setHobbyInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFamilyMemberFormData>({
    resolver: zodResolver(createFamilyMemberSchema),
    defaultValues: {
      name: member?.name || '',
      relationshipToChild: (member?.relationship_type as CreateFamilyMemberFormData['relationshipToChild']) || 'parent',
      birthYear: member?.birth_date ? new Date(member.birth_date).getFullYear() : undefined,
      occupation: member?.occupation || '',
      bio: member?.notes || '',
      isLiving: member?.is_alive ?? true,
      hobbies: member?.hobbies || [],
      funFacts: member?.fun_facts || '',
      connectionDescription: member?.connection_description || '',
      photoDescription: member?.photo_description || '',
    },
  });

  const hobbies = watch('hobbies') || [];
  const isLiving = watch('isLiving');

  const addHobby = (hobby: string) => {
    const trimmed = hobby.trim();
    if (trimmed && !hobbies.includes(trimmed) && hobbies.length < 20) {
      setValue('hobbies', [...hobbies, trimmed]);
    }
    setHobbyInput('');
  };

  const removeHobby = (hobby: string) => {
    setValue(
      'hobbies',
      hobbies.filter((h) => h !== hobby)
    );
  };

  const handleFormSubmit = (data: CreateFamilyMemberFormData) => {
    onSubmit(data, photoFile);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* Basic Info Section */}
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

      {/* Connection Description */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Connection
        </h3>

        <div className="space-y-2">
          <Label htmlFor="connectionDescription">How are they connected?</Label>
          <Input
            id="connectionDescription"
            placeholder="e.g., Dad's sister, Mom's father"
            {...register('connectionDescription')}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Helps kids understand family relationships
          </p>
        </div>
      </div>

      {/* Hobbies Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Hobbies & Interests
        </h3>

        <div className="space-y-2">
          <Label>Add hobbies</Label>
          <div className="flex gap-2">
            <Input
              value={hobbyInput}
              onChange={(e) => setHobbyInput(e.target.value)}
              placeholder="Type a hobby..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHobby(hobbyInput);
                }
              }}
              disabled={isLoading || hobbies.length >= 20}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addHobby(hobbyInput)}
              disabled={isLoading || !hobbyInput.trim() || hobbies.length >= 20}
            >
              Add
            </Button>
          </div>

          {/* Hobby Suggestions */}
          <div className="flex flex-wrap gap-1">
            {HOBBY_SUGGESTIONS.filter((h) => !hobbies.includes(h)).map((hobby) => (
              <Badge
                key={hobby}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => addHobby(hobby)}
              >
                + {hobby}
              </Badge>
            ))}
          </div>

          {/* Selected Hobbies */}
          {hobbies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hobbies.map((hobby) => (
                <Badge key={hobby} variant="secondary" className="gap-1">
                  {hobby}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeHobby(hobby)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fun Facts Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
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
          <p className="text-xs text-muted-foreground">
            Fun facts that the buddy can share with kids
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

      {/* Photo Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Photo
        </h3>

        <PhotoUpload
          value={member?.photo_url}
          onChange={setPhotoFile}
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

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : member ? 'Update Family Member' : 'Add Family Member'}
      </Button>
    </form>
  );
}
