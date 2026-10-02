import type { SupabaseClient } from "@supabase/supabase-js";
import { RequestError } from "./requestProtection.js";
export async function refreshIllustrationResult(
  admin: SupabaseClient,
  userId: string,
  result: unknown,
) {
  const data = result as {
    illustration?: { id?: string; storage_path?: string; signed_url?: string };
  };
  const image = data?.illustration;
  if (
    !image?.storage_path ||
    !image.id ||
    !image.storage_path.startsWith(`${userId}/${image.id}.`)
  )
    throw new RequestError(
      503,
      "The saved illustration could not be confirmed.",
    );
  const { data: signed, error } = await admin.storage
    .from("story-illustrations")
    .createSignedUrl(image.storage_path, 3600);
  if (error || !signed)
    throw new RequestError(
      503,
      "The saved illustration is temporarily unavailable.",
    );
  return { ...data, illustration: { ...image, signed_url: signed.signedUrl } };
}
