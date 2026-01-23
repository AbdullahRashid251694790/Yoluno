/**
 * Topic Posts List
 *
 * Displays posts for a topic with add/edit/delete functionality.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  type TopicPost,
} from '@/hooks/queries/useTopicPosts';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

interface TopicPostsListProps {
  childId: string;
  topicId?: string;
  customTopicId?: string;
  topicName: string;
  posts: TopicPost[];
}

export function TopicPostsList({
  childId,
  topicId,
  customTopicId,
  topicName,
  posts,
}: TopicPostsListProps) {
  const deletePost = useDeleteTopicPost();

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<TopicPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<TopicPost | null>(null);

  const handleAddPost = () => {
    setEditingPost(null);
    setPostDialogOpen(true);
  };

  const handleEditPost = (post: TopicPost) => {
    setEditingPost(post);
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

  return (
    <div className="space-y-3 pt-2">
      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No posts yet. Add content for Luno to know about this topic.
          </p>
        </div>
      ) : (
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

      {/* Add post button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddPost}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Post
      </Button>

      {/* Post dialog */}
      <TopicPostDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        childId={childId}
        topicId={topicId}
        customTopicId={customTopicId}
        topicName={topicName}
        post={editingPost}
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
