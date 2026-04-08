/**
 * Topic Post Dialog
 *
 * Dialog for creating or editing a topic post.
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
  useCreateTopicPost,
  useUpdateTopicPost,
  type TopicPost,
} from '@/hooks/queries/useTopicPosts';
import { Loader2 } from 'lucide-react';

interface TopicPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  // For new posts, provide either topicId (system topic) or customTopicId
  topicId?: string;
  customTopicId?: string;
  topicName: string;
  // For editing, provide the existing post
  post?: TopicPost | null;
  // For AI-generated content, provide initial values
  initialContent?: { title: string; content: string } | null;
  onSuccess?: () => void;
}

export function TopicPostDialog({
  open,
  onOpenChange,
  childId,
  topicId,
  customTopicId,
  topicName,
  post,
  initialContent,
  onSuccess,
}: TopicPostDialogProps) {
  const createPost = useCreateTopicPost();
  const updatePost = useUpdateTopicPost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isEditing = !!post;

  // Populate form when editing or with AI-generated content
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
    } else if (initialContent) {
      setTitle(initialContent.title);
      setContent(initialContent.content);
    } else {
      resetForm();
    }
  }, [post, initialContent, open]);

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      if (isEditing && post) {
        await updatePost.mutateAsync({
          childId,
          postId: post.id,
          data: {
            title: title.trim(),
            content: content.trim(),
          },
        });
      } else {
        await createPost.mutateAsync({
          childId,
          data: {
            topic_id: topicId,
            custom_topic_id: customTopicId,
            title: title.trim(),
            content: content.trim(),
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

  const isPending = createPost.isPending || updatePost.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Content' : `Add Content to "${topicName}"`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the post title and content.'
              : initialContent
                ? 'Review and edit the AI-generated content, then save.'
                : 'Add information that Luno should know about this topic.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title *</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ouroboros dragons"
              maxLength={100}
            />
            <p className="text-caption text-muted-foreground">
              A short label for this piece of information
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">Content *</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., Ouroboros is a dragon or serpent eating its own tail, symbolizing eternity and the cycle of life..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-caption text-muted-foreground">
              The information Luno should know. Max 1000 characters.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
