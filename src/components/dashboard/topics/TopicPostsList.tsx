/**
 * Topic Posts List
 *
 * Displays posts for a topic with add/edit/delete functionality.
 * Includes AI generation capability.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { TopicPostDialog } from './TopicPostDialog';
import {
  useDeleteTopicPost,
  useGenerateTopicPost,
  type TopicPost,
} from '@/hooks/queries/useTopicPosts';
import { Plus, Pencil, Trash2, FileText, Sparkles, Loader2 } from 'lucide-react';

interface TopicPostsListProps {
  childId: string;
  childAge?: number;
  topicId?: string;
  customTopicId?: string;
  topicName: string;
  topicDescription?: string;
  posts: TopicPost[];
}

export function TopicPostsList({
  childId,
  childAge,
  topicId,
  customTopicId,
  topicName,
  topicDescription,
  posts,
}: TopicPostsListProps) {
  const deletePost = useDeleteTopicPost();
  const generatePost = useGenerateTopicPost();

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<TopicPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<TopicPost | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const handleAddPost = () => {
    setEditingPost(null);
    setGeneratedContent(null);
    setPostDialogOpen(true);
  };

  const handleGenerateWithAI = async () => {
    try {
      const result = await generatePost.mutateAsync({
        topicName,
        childAge,
      });
      setGeneratedContent(result);
      setEditingPost(null);
      setPostDialogOpen(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditPost = (post: TopicPost) => {
    setEditingPost(post);
    setGeneratedContent(null);
    setPostDialogOpen(true);
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;

    try {
      await deletePost.mutateAsync({
        childId,
        postId: deletingPost.id,
      });
      setDeletingPost(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDialogClose = (open: boolean) => {
    setPostDialogOpen(open);
    if (!open) {
      setGeneratedContent(null);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Default content from topic description */}
      {topicDescription && (
        <div className="flex items-start gap-3 rounded-lg border p-3 bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-primary">About {topicName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {topicDescription}
            </p>
          </div>
        </div>
      )}

      {/* User-added posts */}
      {posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {post.content}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEditPost(post)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeletingPost(post)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-40"
          onClick={handleGenerateWithAI}
          disabled={generatePost.isPending}
        >
          {generatePost.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {generatePost.isPending ? 'Generating...' : 'Generate with AI'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-40"
          onClick={handleAddPost}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Post
        </Button>
      </div>

      {/* Post dialog */}
      <TopicPostDialog
        open={postDialogOpen}
        onOpenChange={handleDialogClose}
        childId={childId}
        topicId={topicId}
        customTopicId={customTopicId}
        topicName={topicName}
        post={editingPost}
        initialContent={generatedContent}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingPost}
        onOpenChange={(open) => !open && setDeletingPost(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPost?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
