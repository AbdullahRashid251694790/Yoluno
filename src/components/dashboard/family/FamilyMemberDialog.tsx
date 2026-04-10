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
import { apiClient } from '@/integrations/api/client';
import type { FamilyMemberRow } from '@/types/database';
import type { CreateFamilyMemberFormData } from '@/types/forms';
import type { ExtractedFamilyData } from '@/services/family';
import { toast } from 'sonner';

/** Auto-generate connection description from side + specific relationship */
function buildConnectionDescription(data: CreateFamilyMemberFormData): string {
  const labels: Record<string, string> = {
    father: "Child's father",
    mother: "Child's mother",
    paternal_grandfather: "Dad's father",
    paternal_grandmother: "Dad's mother",
    maternal_grandfather: "Mom's father",
    maternal_grandmother: "Mom's mother",
    paternal_uncle: "Dad's brother",
    paternal_aunt: "Dad's sister",
    paternal_uncle_wife: "Dad's brother's wife",
    paternal_aunt_husband: "Dad's sister's husband",
    maternal_uncle: "Mom's brother",
    maternal_aunt: "Mom's sister",
    maternal_uncle_wife: "Mom's brother's wife",
    maternal_aunt_husband: "Mom's sister's husband",
    brother: "Child's brother",
    sister: "Child's sister",
    step_parent: "Step-parent",
    step_sibling: "Step-sibling",
    cousin: data.side === 'paternal' ? "Cousin (Dad's side)" : data.side === 'maternal' ? "Cousin (Mom's side)" : "Cousin",
  };
  if (data.specificRelationship && labels[data.specificRelationship]) {
    return labels[data.specificRelationship];
  }
  const sideLabel = data.side === 'paternal' ? "Dad's side" : data.side === 'maternal' ? "Mom's side" : '';
  const rel = data.relationshipToChild;
  if (sideLabel) return `${rel.charAt(0).toUpperCase() + rel.slice(1).replace('_', '/')} (${sideLabel})`;
  return rel.charAt(0).toUpperCase() + rel.slice(1).replace('_', '/');
}

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
    photoFile: File | null,
    videoFiles: File[],
    additionalStories: string[],
    memoryPhotos: File[] = []
  ) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let photoUrl = member?.photo_url || null;

      // Upload photo
      if (photoFile) {
        photoUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: member?.id || 'new',
          file: photoFile,
        });
      }

      // Upload all videos
      const uploadedVideoUrls: string[] = [];
      for (const vf of videoFiles) {
        const vUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: member?.id || `new-video-${Date.now()}`,
          file: vf,
        });
        uploadedVideoUrls.push(vUrl);
      }

      // Upload memory photos
      const uploadedMemoryPhotoUrls: string[] = [];
      for (const pf of memoryPhotos) {
        const pUrl = await uploadPhoto.mutateAsync({
          userId: user.id,
          memberId: member?.id || `new-photo-${Date.now()}`,
          file: pf,
        });
        uploadedMemoryPhotoUrls.push(pUrl);
      }

      const memberData = {
        name: data.name,
        relationship: data.relationshipToChild,
        specific_relationship: data.specificRelationship || null,
        side: data.side || 'direct',
        birth_date: data.birthYear ? `${data.birthYear}-01-01` : null,
        occupation: data.occupation || null,
        notes: data.bio || null,
        is_alive: data.isLiving,
        hobbies: data.hobbies || [],
        fun_facts: data.funFacts || null,
        connection_description: buildConnectionDescription(data),
        photo_description: data.photoDescription || null,
        photo_url: photoUrl,
        video_url: uploadedVideoUrls[0] || (member as any)?.video_url || null,
      };

      if (isEditing) {
        await updateMember.mutateAsync({
          id: member.id,
          updates: memberData,
        });

        // Save all uploaded videos to multiple videos table
        for (const vUrl of uploadedVideoUrls) {
          await apiClient.post(`/family/members/${member.id}/videos`, { video_url: vUrl }).catch(() => {});
        }

        // Save all stories
        for (const story of additionalStories) {
          await apiClient.post(`/family/members/${member.id}/stories`, { content: story }).catch(() => {});
        }

        // Save memory photos
        for (const pUrl of uploadedMemoryPhotoUrls) {
          await apiClient.post(`/family/members/${member.id}/photos`, { photo_url: pUrl }).catch(() => {});
        }

        toast.success('Family member updated!');
      } else {
        const created = await createMember.mutateAsync({
          user_id: user.id,
          ...memberData,
        });

        if (created?.id) {
          // Save all videos to multiple videos table
          for (const vUrl of uploadedVideoUrls) {
            await apiClient.post(`/family/members/${created.id}/videos`, { video_url: vUrl }).catch(() => {});
          }

          // Save all stories
          for (const story of additionalStories) {
            await apiClient.post(`/family/members/${created.id}/stories`, { content: story }).catch(() => {});
          }

          // Save memory photos
          for (const pUrl of uploadedMemoryPhotoUrls) {
            await apiClient.post(`/family/members/${created.id}/photos`, { photo_url: pUrl }).catch(() => {});
          }
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
