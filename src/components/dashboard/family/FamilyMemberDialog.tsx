/**
 * Family Member Dialog
 *
 * Dialog for adding/editing family members.
 * When adding new members, shows option to fill manually or describe with voice.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FamilyMemberForm } from './FamilyMemberForm';
import { AddMethodSelector, type AddMethod } from './AddMethodSelector';
import { VoiceDescriptionWizard } from './VoiceDescriptionWizard';
import {
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useUploadFamilyPhoto,
} from '@/hooks/queries/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import type { FamilyMemberRow } from '@/types/database';
import type { CreateFamilyMemberFormData } from '@/types/forms';
import type { ExtractedFamilyData } from '@/services/family';
import { toast } from 'sonner';

interface FamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMemberRow;
}

type DialogMode = 'select' | 'manual' | 'voice';

export function FamilyMemberDialog({
  open,
  onOpenChange,
  member,
}: FamilyMemberDialogProps) {
  const { user } = useAuth();
  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const uploadPhoto = useUploadFamilyPhoto();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<DialogMode>('select');

  const isEditing = !!member;

  // Reset mode when dialog opens/closes or member changes
  useEffect(() => {
    if (open) {
      // If editing, go directly to manual form
      // If adding new, show method selector
      setMode(isEditing ? 'manual' : 'select');
    }
  }, [open, isEditing]);

  const handleMethodSelect = (method: AddMethod) => {
    setMode(method);
  };

  const handleSubmit = async (
    data: CreateFamilyMemberFormData,
    photoFile: File | null
  ) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let photoUrl = member?.photo_url || null;

      // Upload photo FIRST (before create) so the member record is created atomically with its photo
      if (photoFile) {
        photoUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: member?.id || 'new',
          file: photoFile,
        });
      }

      const memberData = {
        name: data.name,
        relationship: data.relationshipToChild,
        birth_date: data.birthYear ? `${data.birthYear}-01-01` : null,
        occupation: data.occupation || null,
        notes: data.bio || null,
        is_alive: data.isLiving,
        hobbies: data.hobbies || [],
        fun_facts: data.funFacts || null,
        connection_description: data.connectionDescription || null,
        photo_description: data.photoDescription || null,
        photo_url: photoUrl,
      };

      if (isEditing) {
        await updateMember.mutateAsync({
          id: member.id,
          updates: memberData,
        });
        toast.success('Family member updated!');
      } else {
        await createMember.mutateAsync({
          user_id: user.id,
          ...memberData,
        });
        toast.success('Family member added!');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error('Failed to save family member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceComplete = async (
    data: ExtractedFamilyData & { photoFile: File | null }
  ) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Upload photo FIRST so member is created atomically with photo
      let photoUrl: string | null = null;
      if (data.photoFile) {
        photoUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: 'new',
          file: data.photoFile,
        });
      }

      await createMember.mutateAsync({
        user_id: user.id,
        name: data.name,
        relationship: data.relationship,
        birth_date: null,
        occupation: data.occupation,
        notes: null,
        is_alive: data.isLiving,
        hobbies: data.hobbies,
        fun_facts: data.funFacts,
        connection_description: data.connectionDescription,
        photo_description: null,
        photo_url: photoUrl,
      });

      toast.success('Family member added!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error('Failed to save family member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'select') {
      onOpenChange(false);
    } else {
      setMode('select');
    }
  };

  const getTitle = () => {
    if (isEditing) return 'Edit Family Member';
    if (mode === 'select') return 'Add Family Member';
    if (mode === 'voice') return 'Describe with Voice';
    return 'Add Family Member';
  };

  const getDescription = () => {
    if (isEditing) return 'Update the information for this family member.';
    if (mode === 'select') return 'Choose how you would like to add a new family member.';
    if (mode === 'voice') return 'Record a voice description and we\'ll extract the details for you.';
    return 'Add a new member to your family tree. The more details you add, the better Luno can answer questions about your family.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {mode === 'select' && (
            <AddMethodSelector onSelect={handleMethodSelect} />
          )}

          {mode === 'manual' && (
            <FamilyMemberForm
              member={member}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          )}

          {mode === 'voice' && (
            <VoiceDescriptionWizard
              onComplete={handleVoiceComplete}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
