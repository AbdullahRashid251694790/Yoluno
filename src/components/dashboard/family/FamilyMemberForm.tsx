/**
 * Family Member Form
 *
 * Form for adding/editing family members with rich data fields.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  BasicInfoSection,
  HobbiesSection,
  DetailsSection,
  MediaSection,
} from './form';
import { createFamilyMemberSchema, type CreateFamilyMemberFormData } from '@/types/forms';
import type { FamilyMemberRow } from '@/types/database';
import { cn } from '@/lib/utils';

interface FamilyMemberFormProps {
  member?: FamilyMemberRow;
  onSubmit: (data: CreateFamilyMemberFormData, photoFile: File | null, videoFile: File | null) => void;
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
  const [videoFile, setVideoFile] = useState<File | null>(null);

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
      relationshipToChild: (member?.relationship as CreateFamilyMemberFormData['relationshipToChild']) || 'parent',
      specificRelationship: (member as any)?.specific_relationship || undefined,
      side: (member as any)?.side || 'direct',
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

  const handleHobbiesChange = (newHobbies: string[]) => {
    setValue('hobbies', newHobbies);
  };

  const handleFormSubmit = (data: CreateFamilyMemberFormData) => {
    onSubmit(data, photoFile, videoFile);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      <BasicInfoSection
        control={control}
        register={register}
        errors={errors}
        isLiving={isLiving}
        isLoading={isLoading}
        setValue={setValue}
      />

      <DetailsSection
        register={register}
        errors={errors}
        isLoading={isLoading}
      />

      <HobbiesSection
        hobbies={hobbies}
        onHobbiesChange={handleHobbiesChange}
        isLoading={isLoading}
      />

      <MediaSection
        control={control}
        existingPhotoUrl={member?.photo_url}
        existingVideoUrl={(member as any)?.video_url}
        onPhotoChange={setPhotoFile}
        onVideoChange={setVideoFile}
        videoFile={videoFile}
        isLoading={isLoading}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : member ? 'Update Family Member' : 'Add Family Member'}
      </Button>
    </form>
  );
}
