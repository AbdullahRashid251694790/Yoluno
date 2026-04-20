/**
 * Buddy Chat Service
 *
 * Data access layer for buddy chat operations.
 * Uses Railway API instead of Supabase.
 */

import { apiClient } from '@/integrations/api';
import { handleError } from '@/lib/errors';

export interface BuddyChatMessage {
  message: string;
  childId: string;
  image?: File;
}

export interface BuddyResponse {
  id: string;
  content: string;
  safetyLevel: 'green' | 'yellow' | 'red';
  timestamp: string;
}

export interface BuddyMessage {
  id: string;
  chat_buddy_id: string;
  child_profile_id: string;
  role: 'child' | 'buddy' | 'system';
  content: string;
  safety_level: 'green' | 'yellow' | 'red';
  safety_flags: string[];
  safety_notes: string | null;
  image_key: string | null;
  image_analysis: string | null;
  created_at: string;
}

export interface ChatBuddy {
  id: string;
  child_profile_id: string;
  buddy_name: string;
  buddy_avatar_url: string | null;
  personality_traits: {
    curious: number;
    patient: number;
    playful: number;
    educational: number;
    empathetic: number;
  };
  use_custom_personality: boolean;
  conversation_context: unknown[];
  learned_preferences: Record<string, unknown>;
  total_messages: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafetyReport {
  id: string;
  user_id: string;
  child_profile_id: string;
  message_id: string | null;
  report_type: 'real_time' | 'weekly_summary';
  severity: 'yellow' | 'red';
  issue_summary: string;
  message_excerpt: string | null;
  ai_analysis: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  parent_notes: string | null;
  created_at: string;
}

// Chat Session types
export interface ChatSession {
  id: string;
  child_profile_id: string;
  title: string;
  mood: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionInput {
  mood?: string;
  title?: string;
}

export interface UpdateSessionInput {
  title?: string;
  is_active?: boolean;
}

/**
 * Send a message to the buddy and get AI response
 * Supports optional image attachment
 */
export async function sendMessageToBuddy(
  params: BuddyChatMessage
): Promise<BuddyResponse> {
  try {
    // If there's an image, use FormData for multipart upload
    if (params.image) {
      const formData = new FormData();
      formData.append('message', params.message);
      formData.append('image', params.image);

      const { data } = await apiClient.post<BuddyResponse>(
        `/buddy-chat/${params.childId}/send`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    }

    // Regular JSON request without image
    const { data } = await apiClient.post<BuddyResponse>(
      `/buddy-chat/${params.childId}/send`,
      { message: params.message }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.sendMessage',
      userMessage: 'Failed to send message to buddy',
      strategy: 'throw',
    });
  }
}

/**
 * Get signed URL for a message image
 */
export async function getMessageImageUrl(
  childId: string,
  messageId: string
): Promise<string | null> {
  try {
    const { data } = await apiClient.get<{ url: string }>(
      `/buddy-chat/${childId}/messages/${messageId}/image`
    );
    return data?.url || null;
  } catch (error) {
    console.error('Failed to get image URL:', error);
    return null;
  }
}

/**
 * Get buddy messages for a child
 */
export async function getBuddyMessages(
  childId: string,
  limit = 50
): Promise<BuddyMessage[]> {
  try {
    const { data } = await apiClient.get<BuddyMessage[]>(
      `/buddy-chat/${childId}/messages`,
      { params: { limit } }
    );
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.getMessages',
      strategy: 'throw',
    });
  }
}

/**
 * Get chat buddy for a child
 */
export async function getChatBuddy(childId: string): Promise<ChatBuddy | null> {
  try {
    const { data } = await apiClient.get<ChatBuddy>(`/buddy-chat/${childId}/buddy`);
    return data;
  } catch (error: unknown) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
    throw handleError(error, {
      context: 'buddyChat.getBuddy',
      strategy: 'throw',
    });
  }
}

/**
 * Update buddy personality traits
 */
export async function updateBuddyPersonality(
  buddyId: string,
  traits: Partial<ChatBuddy['personality_traits']>,
  useCustomPersonality?: boolean
): Promise<ChatBuddy> {
  try {
    const body: Record<string, unknown> = { personality_traits: traits };
    if (useCustomPersonality !== undefined) {
      body.use_custom_personality = useCustomPersonality;
    }
    const { data } = await apiClient.put<ChatBuddy>(
      `/buddy-chat/buddies/${buddyId}`,
      body
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.updatePersonality',
      strategy: 'throw',
    });
  }
}

/**
 * Update buddy name
 */
export async function updateBuddyName(
  buddyId: string,
  name: string
): Promise<ChatBuddy> {
  try {
    const { data } = await apiClient.put<ChatBuddy>(
      `/buddy-chat/buddies/${buddyId}`,
      { buddy_name: name }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.updateName',
      strategy: 'throw',
    });
  }
}

/**
 * Get safety reports for a parent
 */
export async function getSafetyReports(
  userId: string,
  unreadOnly = false
): Promise<SafetyReport[]> {
  try {
    const { data } = await apiClient.get<SafetyReport[]>('/buddy-chat/safety-reports', {
      params: { unreviewed: unreadOnly ? 'true' : undefined },
    });
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.getSafetyReports',
      strategy: 'throw',
    });
  }
}

/**
 * Mark safety report as reviewed
 */
export async function markSafetyReportReviewed(
  reportId: string,
  notes?: string
): Promise<SafetyReport> {
  try {
    const { data } = await apiClient.put<SafetyReport>(
      `/buddy-chat/safety-reports/${reportId}`,
      { reviewed: true, parent_notes: notes }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.markReviewed',
      strategy: 'throw',
    });
  }
}

/**
 * Clear chat history (only keeps buddy context)
 */
export async function clearChatHistory(childId: string): Promise<void> {
  try {
    await apiClient.delete(`/buddy-chat/${childId}/messages`);
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.clearHistory',
      strategy: 'throw',
    });
  }
}

// ============================================
// Chat Sessions API
// ============================================

/**
 * Get all chat sessions for a child
 */
export async function getChatSessions(childId: string): Promise<ChatSession[]> {
  try {
    const { data } = await apiClient.get<ChatSession[]>(
      `/buddy-chat/${childId}/sessions`
    );
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.getSessions',
      strategy: 'throw',
    });
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  childId: string,
  input?: CreateSessionInput
): Promise<ChatSession> {
  try {
    const { data } = await apiClient.post<ChatSession>(
      `/buddy-chat/${childId}/sessions`,
      input || {}
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.createSession',
      strategy: 'throw',
    });
  }
}

/**
 * Trigger a mood-aware greeting from Luno for a new session
 */
export async function greetSession(
  childId: string,
  sessionId: string
): Promise<{ buddyMessage: BuddyMessage }> {
  try {
    const { data } = await apiClient.post<{ buddyMessage: BuddyMessage }>(
      `/buddy-chat/${childId}/sessions/${sessionId}/greet`
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.greetSession',
      strategy: 'throw',
    });
  }
}

/**
 * Get a specific chat session with messages
 */
export async function getChatSession(
  childId: string,
  sessionId: string
): Promise<ChatSession & { messages: BuddyMessage[] }> {
  try {
    const { data } = await apiClient.get<ChatSession & { messages: BuddyMessage[] }>(
      `/buddy-chat/${childId}/sessions/${sessionId}`
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.getSession',
      strategy: 'throw',
    });
  }
}

/**
 * Get messages for a specific session
 */
export async function getSessionMessages(
  childId: string,
  sessionId: string,
  limit = 50
): Promise<BuddyMessage[]> {
  try {
    const { data } = await apiClient.get<BuddyMessage[]>(
      `/buddy-chat/${childId}/sessions/${sessionId}/messages`,
      { params: { limit } }
    );
    return data ?? [];
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.getSessionMessages',
      strategy: 'throw',
    });
  }
}

/**
 * Update a chat session (title or archive)
 */
export async function updateChatSession(
  childId: string,
  sessionId: string,
  input: UpdateSessionInput
): Promise<ChatSession> {
  try {
    const { data } = await apiClient.patch<ChatSession>(
      `/buddy-chat/${childId}/sessions/${sessionId}`,
      input
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.updateSession',
      strategy: 'throw',
    });
  }
}

/**
 * Delete a chat session (cascades to messages)
 */
export async function deleteChatSession(childId: string, sessionId: string): Promise<void> {
  try {
    await apiClient.delete(`/buddy-chat/${childId}/sessions/${sessionId}`);
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.deleteSession',
      strategy: 'throw',
    });
  }
}

/**
 * Send a message within a specific session
 */
export async function sendSessionMessage(
  childId: string,
  sessionId: string,
  message: string,
  image?: File
): Promise<BuddyResponse> {
  try {
    if (image) {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('image', image);

      const { data } = await apiClient.post<BuddyResponse>(
        `/buddy-chat/${childId}/sessions/${sessionId}/send`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    }

    const { data } = await apiClient.post<BuddyResponse>(
      `/buddy-chat/${childId}/sessions/${sessionId}/send`,
      { message }
    );
    return data;
  } catch (error) {
    throw handleError(error, {
      context: 'buddyChat.sendSessionMessage',
      strategy: 'throw',
    });
  }
}

export const buddyChatService = {
  sendMessage: sendMessageToBuddy,
  getMessages: getBuddyMessages,
  getBuddy: getChatBuddy,
  updatePersonality: updateBuddyPersonality,
  updateName: updateBuddyName,
  getSafetyReports,
  markReviewed: markSafetyReportReviewed,
  clearHistory: clearChatHistory,
  getMessageImageUrl,
  // Sessions
  getSessions: getChatSessions,
  createSession: createChatSession,
  getSession: getChatSession,
  getSessionMessages,
  updateSession: updateChatSession,
  deleteSession: deleteChatSession,
  sendSessionMessage,
};
