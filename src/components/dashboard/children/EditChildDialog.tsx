/**
 * Edit Child Dialog
 *
 * Dialog for editing an existing child profile.
 * Supports name, age, gender, and avatar editing with delete functionality.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarSelector } from './AvatarSelector';
import {
  useUpdateChildProfile,
  useDeleteChildProfile,
  useUpdateChildAvatar,
} from '@/hooks/queries';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

interface EditChildDialogProps {
  child: ChildProfileWithAvatar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onDelete?: () => void;
}

type Gender = 'boy' | 'girl' | 'prefer_not_to_say' | undefined;

export function EditChildDialog({
  child,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
}: EditChildDialogProps) {
  // Mutations
  const updateChild = useUpdateChildProfile();
  const deleteChild = useDeleteChildProfile();
  const updateAvatar = useUpdateChildAvatar();

  // Local state
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [gender, setGender] = useState<Gender>(undefined);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when child loads
  useEffect(() => {
    if (child) {
      setName(child.name);
      setAge(child.age);
      setGender(child.gender as Gender);
      setSelectedAvatarId(child.avatar_id);
      setHasChanges(false);
    }
  }, [child]);

  // Track changes
  useEffect(() => {
    if (child) {
      const changed =
        name !== child.name ||
        age !== child.age ||
        gender !== child.gender ||
        selectedAvatarId !== child.avatar_id;
      setHasChanges(changed);
    }
  }, [name, age, gender, selectedAvatarId, child]);

  // Reset on close
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setName('');
      setAge(7);
      setGender(undefined);
      setSelectedAvatarId(null);
      setHasChanges(false);
    }
    onOpenChange(isOpen);
  };

  // Save changes
  const handleSave = async () => {
    if (!child?.id || !name.trim()) return;

    try {
      // Check if avatar changed
      const avatarChanged = selectedAvatarId !== child.avatar_id;

      // Update profile fields
      if (
        name !== child.name ||
        age !== child.age ||
        gender !== child.gender
      ) {
        await updateChild.mutateAsync({
          id: child.id,
          updates: {
            name: name.trim(),
            age,
            gender: gender ?? null,
          },
        });
      }

      // Update avatar separately if changed
      if (avatarChanged && selectedAvatarId) {
        await updateAvatar.mutateAsync({
          id: child.id,
          avatarId: selectedAvatarId,
        });
      }

      toast.success('Profile updated!');
      onSuccess?.();
      handleClose(false);
    } catch (error) {
      // Error handled by mutation
      console.error('Failed to update profile:', error);
    }
  };

  // Delete child
  const handleDeleteChild = async () => {
    if (!child?.id) return;

    try {
      await deleteChild.mutateAsync(child.id);
      toast.success('Profile deleted');
      setShowDeleteConfirm(false);
      handleClose(false);
      onDelete?.();
    } catch (error) {
      // Error handled by mutation
      console.error('Failed to delete profile:', error);
    }
  };

  const isPending =
    updateChild.isPending || deleteChild.isPending || updateAvatar.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update {child?.name}'s profile information
            </DialogDescription>
          </DialogHeader>

          {child ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Avatar Selection */}
                <div className="space-y-3">
                  <Label>Avatar</Label>
                  <AvatarSelector
                    selectedAvatarId={selectedAvatarId}
                    onSelect={setSelectedAvatarId}
                    disabled={isPending}
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter child's name"
                    disabled={isPending}
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    min={3}
                    max={18}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 7)}
                    disabled={isPending}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label>Gender (optional)</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGender(gender === 'boy' ? undefined : 'boy')
                      }
                      disabled={isPending}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                        gender === 'boy'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted hover:border-primary',
                        isPending && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">👦</span>
                      <span className="font-medium">Boy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGender(gender === 'girl' ? undefined : 'girl')
                      }
                      disabled={isPending}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                        gender === 'girl'
                          ? 'border-lolo bg-lolo/10 text-lolo'
                          : 'border-muted hover:border-lolo',
                        isPending && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">👧</span>
                      <span className="font-medium">Girl</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGender('prefer_not_to_say')}
                    disabled={isPending}
                    className={cn(
                      'w-full text-sm text-muted-foreground hover:text-foreground transition-colors',
                      gender === 'prefer_not_to_say' &&
                        'text-foreground font-medium',
                      isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Prefer not to say
                  </button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Profile
            </Button>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges || !name.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Profile
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {child?.name}'s profile? This will
              remove all their stories, journeys, and progress. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChild.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
