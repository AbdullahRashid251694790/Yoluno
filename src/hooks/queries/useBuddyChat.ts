/**
 * Buddy Chat Query Hooks
 *
 * React Query hooks for buddy chat operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  buddyChatService,
  type BuddyChatMessage,
  type ChatBuddy,
  type CreateSessionInput,
  type UpdateSessionInput,
} from '@/services/buddyChat';
import { handleError } from '@/lib/errors';

/**
 * Hook to fetch buddy messages for a child
 * Note: Real-time updates handled by Supabase subscriptions in BuddyChat component
 */
export function useBuddyMessages(childId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: queryKeys.buddyChat.messages(childId ?? ''),
    queryFn: () => buddyChatService.getMessages(childId!, limit),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get the chat buddy profile for a child
 */
export function useChatBuddy(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.buddyChat.buddy(childId ?? ''),
    queryFn: () => buddyChatService.getBuddy(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get safety reports for a parent
 * Real-time updates recommended via Supabase subscriptions
 */
export function useSafetyReports(
  userId: string | undefined,
  unreadOnly = false
) {
  return useQuery({
    queryKey: queryKeys.buddyChat.safetyReports(userId ?? '', unreadOnly),
    queryFn: () => buddyChatService.getSafetyReports(userId!, unreadOnly),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Mutation hook to send a message to the buddy
 * Automatically invalidates message queries on success
 */
export function useSendBuddyMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: BuddyChatMessage) =>
      buddyChatService.sendMessage(params),
    onSuccess: (_, variables) => {
      // Invalidate messages to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.messages(variables.childId),
      });
      // Invalidate buddy to update stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(variables.childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useSendBuddyMessage',
        userMessage: 'Failed to send message to buddy',
      });
    },
  });
}

/**
 * Mutation hook to update buddy personality traits
 */
export function useUpdateBuddyPersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      buddyId,
      traits,
    }: {
      buddyId: string;
      traits: Partial<ChatBuddy['personality_traits']>;
    }) => buddyChatService.updatePersonality(buddyId, traits),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateBuddyPersonality',
        userMessage: 'Failed to update buddy personality',
      });
    },
  });
}

/**
 * Mutation hook to update buddy name
 */
export function useUpdateBuddyName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ buddyId, name }: { buddyId: string; name: string }) =>
      buddyChatService.updateName(buddyId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(data.child_profile_id),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateBuddyName',
        userMessage: 'Failed to update buddy name',
      });
    },
  });
}

/**
 * Mutation hook to mark a safety report as reviewed
 */
export function useMarkSafetyReportReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, notes }: { reportId: string; notes?: string }) =>
      buddyChatService.markReviewed(reportId, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.safetyReports(data.user_id, false),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.safetyReports(data.user_id, true),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useMarkSafetyReportReviewed',
        userMessage: 'Failed to mark safety report as reviewed',
      });
    },
  });
}

/**
 * Mutation hook to clear chat history
 */
export function useClearChatHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => buddyChatService.clearHistory(childId),
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.messages(childId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useClearChatHistory',
        userMessage: 'Failed to clear chat history',
      });
    },
  });
}

// ============================================
// Chat Session Hooks
// ============================================

/**
 * Hook to fetch all chat sessions for a child
 */
export function useChatSessions(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.buddyChat.sessions(childId ?? ''),
    queryFn: () => buddyChatService.getSessions(childId!),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a specific chat session with messages
 */
export function useChatSession(
  childId: string | undefined,
  sessionId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.buddyChat.session(childId ?? '', sessionId ?? ''),
    queryFn: () => buddyChatService.getSession(childId!, sessionId!),
    enabled: !!childId && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch messages for a specific session
 */
export function useSessionMessages(
  childId: string | undefined,
  sessionId: string | undefined,
  limit = 50
) {
  return useQuery({
    queryKey: queryKeys.buddyChat.sessionMessages(childId ?? '', sessionId ?? ''),
    queryFn: () => buddyChatService.getSessionMessages(childId!, sessionId!, limit),
    enabled: !!childId && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Mutation hook to create a new chat session
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      input,
    }: {
      childId: string;
      input?: CreateSessionInput;
    }) => buddyChatService.createSession(childId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.sessions(variables.childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useCreateChatSession',
        userMessage: 'Failed to create new chat session',
      });
    },
  });
}

/**
 * Mutation hook to update a chat session
 */
export function useUpdateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      sessionId,
      input,
    }: {
      childId: string;
      sessionId: string;
      input: UpdateSessionInput;
    }) => buddyChatService.updateSession(childId, sessionId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.sessions(variables.childId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.session(variables.childId, variables.sessionId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useUpdateChatSession',
        userMessage: 'Failed to update chat session',
      });
    },
  });
}

/**
 * Mutation hook to send a message within a session
 */
export function useSendSessionMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      sessionId,
      message,
      image,
    }: {
      childId: string;
      sessionId: string;
      message: string;
      image?: File;
    }) => buddyChatService.sendSessionMessage(childId, sessionId, message, image),
    onSuccess: (_, variables) => {
      // Invalidate session messages
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.sessionMessages(variables.childId, variables.sessionId),
      });
      // Invalidate session to update message count and last_message_at
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.session(variables.childId, variables.sessionId),
      });
      // Invalidate sessions list to update order
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.sessions(variables.childId),
      });
      // Invalidate buddy stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.buddyChat.buddy(variables.childId),
      });
    },
    onError: (error) => {
      handleError(error, {
        context: 'useSendSessionMessage',
        userMessage: 'Failed to send message',
      });
    },
  });
}
