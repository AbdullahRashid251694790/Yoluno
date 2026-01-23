/**
 * Topic Posts Query Hooks
 *
 * React Query hooks for custom topics and topic posts management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  topicPostsService,
  type CustomTopic,
  type TopicPost,
  type CreateCustomTopicInput,
  type UpdateCustomTopicInput,
  type CreateTopicPostInput,
  type UpdateTopicPostInput,
} from '@/services/topicPosts';
import { handleError } from '@/lib/errors';

// ============================================
// Custom Topics Hooks
// ============================================

/**
 * Get all custom topics for a child
 */
export function useCustomTopics(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicPosts.customTopics(childId ?? ''),
    queryFn: () => topicPostsService.getCustomTopics(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a custom topic
 */
export function useCreateCustomTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      data,
    }: {
      childId: string;
      data: CreateCustomTopicInput;
    }) => topicPostsService.createCustomTopic(childId, data),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.customTopics(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateCustomTopic',
        userMessage: 'Failed to create custom topic',
      });
    },
  });
}

/**
 * Update a custom topic
 */
export function useUpdateCustomTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      customTopicId,
      data,
    }: {
      childId: string;
      customTopicId: string;
      data: UpdateCustomTopicInput;
    }) => topicPostsService.updateCustomTopic(childId, customTopicId, data),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.customTopics(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateCustomTopic',
        userMessage: 'Failed to update custom topic',
      });
    },
  });
}

/**
 * Delete a custom topic
 */
export function useDeleteCustomTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      customTopicId,
    }: {
      childId: string;
      customTopicId: string;
    }) => topicPostsService.deleteCustomTopic(childId, customTopicId),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.customTopics(childId),
      });
      // Also invalidate posts since deleting a topic removes its posts
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.posts(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteCustomTopic',
        userMessage: 'Failed to delete custom topic',
      });
    },
  });
}

// ============================================
// Topic Posts Hooks
// ============================================

/**
 * Get all topic posts for a child
 */
export function useTopicPosts(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicPosts.posts(childId ?? ''),
    queryFn: () => topicPostsService.getTopicPosts(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a topic post
 */
export function useCreateTopicPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      data,
    }: {
      childId: string;
      data: CreateTopicPostInput;
    }) => topicPostsService.createTopicPost(childId, data),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.posts(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateTopicPost',
        userMessage: 'Failed to create topic post',
      });
    },
  });
}

/**
 * Update a topic post
 */
export function useUpdateTopicPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      postId,
      data,
    }: {
      childId: string;
      postId: string;
      data: UpdateTopicPostInput;
    }) => topicPostsService.updateTopicPost(childId, postId, data),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.posts(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateTopicPost',
        userMessage: 'Failed to update topic post',
      });
    },
  });
}

/**
 * Delete a topic post
 */
export function useDeleteTopicPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      postId,
    }: {
      childId: string;
      postId: string;
    }) => topicPostsService.deleteTopicPost(childId, postId),
    onSuccess: (_, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topicPosts.posts(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useDeleteTopicPost',
        userMessage: 'Failed to delete topic post',
      });
    },
  });
}

// Re-export types
export type {
  CustomTopic,
  TopicPost,
  CreateCustomTopicInput,
  UpdateCustomTopicInput,
  CreateTopicPostInput,
  UpdateTopicPostInput,
};
