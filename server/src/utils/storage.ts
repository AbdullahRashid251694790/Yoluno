import fs from 'fs/promises';
import path from 'path';
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from './s3.js';

function getStorageType(): 'local' | 's3' {
  const explicit = process.env.STORAGE_TYPE;
  if (explicit === 'local' || explicit === 's3') return explicit;
  return process.env.NODE_ENV === 'production' ? 's3' : 'local';
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (getStorageType() === 's3') {
    return uploadToS3(key, buffer, contentType);
  }

  const filePath = path.join(getUploadDir(), key);
  await ensureDir(filePath);
  await fs.writeFile(filePath, buffer);
  return key;
}

export async function getFileUrl(key: string, expiresIn?: number): Promise<string> {
  if (getStorageType() === 's3') {
    return getSignedDownloadUrl(key, expiresIn);
  }

  // For local storage, return a relative URL served by Express static middleware
  return `/uploads/${key}`;
}

/**
 * Convert a stored audio URL into a fresh playable URL. Handles three cases:
 *  1. bare S3 key like "voice-clips/<userId>/<file>" → fresh signed URL
 *  2. legacy local path like "/uploads/voice-clips/..." → strip prefix, resolve
 *  3. legacy full URL (a signed S3 URL persisted in the DB) → extract the key
 *     portion and resolve
 * Returns the input unchanged if nothing matches.
 */
export async function resolveAudioUrl(
  stored: string | null,
  expiresIn?: number
): Promise<string | null> {
  if (!stored) return null;

  // Case 1: bare key
  if (!stored.startsWith('http') && !stored.startsWith('/')) {
    return getFileUrl(stored, expiresIn);
  }

  // Case 2: local /uploads/ prefix
  if (stored.startsWith('/uploads/')) {
    const key = stored.slice('/uploads/'.length);
    return getFileUrl(key, expiresIn);
  }

  // Case 3: legacy full URL — extract the key portion via known prefix
  const match = stored.match(/(voice-clips\/[^?]+)/);
  if (match) {
    return getFileUrl(match[1], expiresIn);
  }

  return stored;
}

export async function deleteFile(key: string): Promise<void> {
  if (getStorageType() === 's3') {
    return deleteFromS3(key);
  }

  const filePath = path.join(getUploadDir(), key);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}
