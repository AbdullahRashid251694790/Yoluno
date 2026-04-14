/**
 * Edit Voice Clip Dialog
 *
 * Lets parents edit a voice clip's title, description, category, and
 * assign it to a family member.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyMembers } from '@/hooks/queries/useFamily';
import {
  useUpdateVoiceClip,
  type VoiceClipCategoryType,
} from '@/hooks/queries/useVoiceVault';
import type { VoiceClip } from '@/services/voiceVault';

const CATEGORIES: { value: VoiceClipCategoryType; label: string }[] = [
  { value: 'encouragement', label: 'Encouragement' },
  { value: 'praise', label: 'Praise' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'story', label: 'Story' },
  { value: 'memory', label: 'Memory' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'message', label: 'Message' },
  { value: 'other', label: 'Other' },
];

interface EditVoiceClipDialogProps {
  clip: VoiceClip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVoiceClipDialog({ clip, open, onOpenChange }: EditVoiceClipDialogProps) {
  const { user } = useAuth();
  const { data: familyMembers = [] } = useFamilyMembers(user?.id);
  const updateClip = useUpdateVoiceClip();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VoiceClipCategoryType>('other');
  const [familyMemberId, setFamilyMemberId] = useState<string>('unassigned');

  useEffect(() => {
    if (clip) {
      setTitle(clip.title);
      setDescription(clip.description || '');
      setCategory(clip.category);
      setFamilyMemberId(clip.family_member_id || 'unassigned');
    }
  }, [clip]);

  const handleSave = async () => {
    if (!clip) return;
    await updateClip.mutateAsync({
      id: clip.id,
      input: {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        family_member_id: familyMemberId === 'unassigned' ? null : familyMemberId,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit recording</DialogTitle>
          <DialogDescription>
            Update the title, category, or assign to a family member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-family-member">Recorded by</Label>
            <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
              <SelectTrigger id="edit-family-member">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {familyMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">
              Assigning lets kids hear it in the right family member's card.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VoiceClipCategoryType)}>
              <SelectTrigger id="edit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Optional note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || updateClip.isPending}
            className="bg-gold text-white hover:bg-gold/90 gap-2"
          >
            {updateClip.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
