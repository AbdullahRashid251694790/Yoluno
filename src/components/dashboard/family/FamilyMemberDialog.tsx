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
    if (!user) return;

    setIsSubmitting(true);
    try {
      let photoUrl = member?.photo_url || null;

      // Create or update the member first to get the ID
      if (isEditing) {
        // Upload photo if provided
        if (photoFile) {
          photoUrl = await uploadPhoto.mutateAsync({
            userId: user.id,
            memberId: member.id,
            file: photoFile,
          });
        }

        await updateMember.mutateAsync({
          id: member.id,
          updates: {
            name: data.name,
            relationship_type: data.relationshipToChild,
            birth_date: data.birthYear
              ? `${data.birthYear}-01-01`
              : null,
            occupation: data.occupation || null,
            notes: data.bio || null,
            is_alive: data.isLiving,
            hobbies: data.hobbies || [],
            fun_facts: data.funFacts || null,
            connection_description: data.connectionDescription || null,
            photo_description: data.photoDescription || null,
            photo_url: photoUrl,
          },
        });

        toast.success('Family member updated!');
      } else {
        // Create new member
        const newMember = await createMember.mutateAsync({
          user_id: user.id,
          name: data.name,
          relationship_type: data.relationshipToChild,
          birth_date: data.birthYear
            ? `${data.birthYear}-01-01`
            : null,
          occupation: data.occupation || null,
          notes: data.bio || null,
          is_alive: data.isLiving,
          hobbies: data.hobbies || [],
          fun_facts: data.funFacts || null,
          connection_description: data.connectionDescription || null,
          photo_description: data.photoDescription || null,
        });

        // Upload photo if provided
        if (photoFile && newMember) {
          photoUrl = await uploadPhoto.mutateAsync({
            userId: user.id,
            memberId: newMember.id,
            file: photoFile,
          });

          // Update member with photo URL
          await updateMember.mutateAsync({
            id: newMember.id,
            updates: { photo_url: photoUrl },
          });
        }

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
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create the family member
      const newMember = await createMember.mutateAsync({
        user_id: user.id,
        name: data.name,
        relationship_type: data.relationship,
        occupation: data.occupation,
        is_alive: data.isLiving,
        hobbies: data.hobbies,
        fun_facts: data.funFacts,
        connection_description: data.connectionDescription,
      });

      // Upload photo if provided
      if (data.photoFile && newMember) {
        const photoUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: newMember.id,
          file: data.photoFile,
        });

        // Update member with photo URL
        await updateMember.mutateAsync({
          id: newMember.id,
          updates: { photo_url: photoUrl },
        });
      }

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
