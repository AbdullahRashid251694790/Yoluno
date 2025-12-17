/**
 * Family Member Dialog
 *
 * Dialog for adding/editing family members.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FamilyMemberForm } from './FamilyMemberForm';
import {
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useUploadFamilyPhoto,
} from '@/hooks/queries/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import type { FamilyMemberRow } from '@/types/database';
import type { CreateFamilyMemberFormData } from '@/types/forms';
import { toast } from 'sonner';

interface FamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMemberRow;
}

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

  const isEditing = !!member;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Family Member' : 'Add Family Member'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the information for this family member.'
              : 'Add a new member to your family tree. The more details you add, the better your child\'s buddy can answer questions about your family.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <FamilyMemberForm
            member={member}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
