/**
 * PIN Query Hooks
 *
 * React Query hooks for child profile PIN operations.
 * No fallback mechanisms - proper error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createMutationHook } from './useMutationFactory';
import { pinService, type PinStatus, type PinVerifyResponse } from '@/services/pin';

// ============================================================
// Query Hooks
// ============================================================

/**
 * Get PIN status for a child profile
 */
export function usePinStatus(childId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.pin.status(childId ?? ''),
    queryFn: () => pinService.getStatus(childId!),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000, // PIN status rarely changes
  });
}

// ============================================================
// Mutation Hooks
// ============================================================

interface SetPinVariables {
  childId: string;
  pin: string;
}

/**
 * Set or update PIN for a child profile
 */
export const useSetPin = createMutationHook<{ message: string }, SetPinVariables>({
  mutationFn: ({ childId, pin }) => pinService.set(childId, pin),
  context: 'useSetPin',
  userMessage: 'Failed to set PIN',
  invalidateKeys: (_, { childId }) => [queryKeys.pin.status(childId)],
});

interface VerifyPinVariables {
  childId: string;
  pin: string;
}

/**
 * Verify PIN for a child profile
 * Use this to authenticate before entering kids mode
 */
export const useVerifyPin = createMutationHook<PinVerifyResponse, VerifyPinVariables>({
  mutationFn: ({ childId, pin }) => pinService.verify(childId, pin),
  context: 'useVerifyPin',
  userMessage: 'Invalid PIN',
  // No cache invalidation needed for verify
});

/**
 * Remove PIN from a child profile
 */
export const useRemovePin = createMutationHook<void, string>({
  mutationFn: (childId) => pinService.remove(childId),
  context: 'useRemovePin',
  userMessage: 'Failed to remove PIN',
  invalidateKeys: (_, childId) => [queryKeys.pin.status(childId)],
});

// ============================================================
// Convenience Exports
// ============================================================

export type { PinStatus, PinVerifyResponse };
