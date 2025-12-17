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

/**
 * Send a message to the buddy and get AI response
 */
export async function sendMessageToBuddy(
  params: BuddyChatMessage
): Promise<BuddyResponse> {
  try {
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
  traits: Partial<ChatBuddy['personality_traits']>
): Promise<ChatBuddy> {
  try {
    const { data } = await apiClient.put<ChatBuddy>(
      `/buddy-chat/buddies/${buddyId}`,
      { personality_traits: traits }
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

export const buddyChatService = {
  sendMessage: sendMessageToBuddy,
  getMessages: getBuddyMessages,
  getBuddy: getChatBuddy,
  updatePersonality: updateBuddyPersonality,
  updateName: updateBuddyName,
  getSafetyReports,
  markReviewed: markSafetyReportReviewed,
  clearHistory: clearChatHistory,
};
