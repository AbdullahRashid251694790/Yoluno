/**
 * Custom Topic Dialog
 *
 * Dialog for creating or editing a custom topic.
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCustomTopic,
  useUpdateCustomTopic,
  type CustomTopic,
} from '@/hooks/queries/useTopicPosts';
import { Loader2 } from 'lucide-react';

interface CustomTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  topic?: CustomTopic | null;
  onSuccess?: () => void;
}

export function CustomTopicDialog({
  open,
  onOpenChange,
  childId,
  topic,
  onSuccess,
}: CustomTopicDialogProps) {
  const createTopic = useCreateCustomTopic();
  const updateTopic = useUpdateCustomTopic();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const isEditing = !!topic;

  // Populate form when editing
  useEffect(() => {
    if (topic) {
      setName(topic.name);
      setDescription(topic.description || '');
      setIcon(topic.icon || '');
    } else {
      resetForm();
    }
  }, [topic, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      if (isEditing && topic) {
        await updateTopic.mutateAsync({
          childId,
          customTopicId: topic.id,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            icon: icon.trim() || null,
          },
        });
      } else {
        await createTopic.mutateAsync({
          childId,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            icon: icon.trim() || undefined,
          },
        });
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const isPending = createTopic.isPending || updateTopic.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Custom Topic' : 'Create Custom Topic'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the topic name and description.'
              : 'Create a new topic to add custom content for Luno to know about.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-name">Topic Name *</Label>
            <Input
              id="topic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dragons, Outer Space, Cooking"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-description">Description (optional)</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this topic"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-icon">Icon (optional emoji)</Label>
            <Input
              id="topic-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g., dragon emoji"
              maxLength={10}
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Topic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
