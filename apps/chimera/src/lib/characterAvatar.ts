import { supabase } from './supabase';

/** Character pictures go in the existing public `profile-photos` bucket, in the member's own folder (the bucket's rules). */
const BUCKET = 'profile-photos';
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** A readable problem with this file, or null when it can be used as a picture. */
export function checkAvatarFile(file: { type: string; size: number }): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return 'Please choose a JPG, PNG or WebP picture.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > AVATAR_MAX_BYTES) return 'This picture is larger than 5 MB. Please choose a smaller one.';
  return null;
}

/** Where a picture is stored: the first folder must be the member's id, or the storage rules refuse it. */
export function avatarPath(userId: string, fileType: string, uniqueId: string): string {
  return `${userId}/character-avatars/${uniqueId}.${EXTENSION[fileType] ?? 'png'}`;
}

/** Uploads the picture and returns its public address. Throws a readable Error when it cannot. */
export async function uploadCharacterAvatar(userId: string, file: File): Promise<string> {
  const problem = checkAvatarFile(file);
  if (problem) throw new Error(problem);
  const path = avatarPath(userId, file.type, crypto.randomUUID());
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) throw new Error('We could not upload this picture. Please try again.');
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
