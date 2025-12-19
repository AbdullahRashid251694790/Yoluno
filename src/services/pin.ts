/**
 * PIN Service
 *
 * Data access layer for child profile PIN operations.
 * No fallback mechanisms - proper error handling.
 */

import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface PinStatus {
  hasPin: boolean;
}

export interface PinVerifyResponse {
  verified: boolean;
}

const CONTEXT = 'pin';

/**
 * Get PIN status for a child profile
 */
export async function getPinStatus(childId: string): Promise<PinStatus> {
  return apiGet<PinStatus>(
    `/child-profiles/${childId}/pin/status`,
    `${CONTEXT}.getPinStatus`
  );
}

/**
 * Set or update PIN for a child profile
 */
export async function setPin(
  childId: string,
  pin: string
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(
    `/child-profiles/${childId}/pin`,
    `${CONTEXT}.setPin`,
    { pin }
  );
}

/**
 * Verify PIN for a child profile
 * Returns verified: true on success
 * Throws error if PIN is invalid or not set
 */
export async function verifyPin(
  childId: string,
  pin: string
): Promise<PinVerifyResponse> {
  return apiPost<PinVerifyResponse>(
    `/child-profiles/${childId}/pin/verify`,
    `${CONTEXT}.verifyPin`,
    { pin }
  );
}

/**
 * Remove PIN from a child profile
 */
export async function removePin(childId: string): Promise<void> {
  return apiDelete(
    `/child-profiles/${childId}/pin`,
    `${CONTEXT}.removePin`
  );
}

export const pinService = {
  getStatus: getPinStatus,
  set: setPin,
  verify: verifyPin,
  remove: removePin,
};
