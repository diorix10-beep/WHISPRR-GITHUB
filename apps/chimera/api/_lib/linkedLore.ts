import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveLorebookContext,
  type RuntimeLorebookEntry,
} from "../../src/lib/lorebookRuntime.js";
import { RequestError } from "./requestProtection.js";
export async function loadLinkedLore(
  admin: SupabaseClient,
  ownerClient: SupabaseClient,
  params: {
    characterId: string;
    creatorId: string;
    worldId?: string | null;
    userId: string;
    personaLoreIds?: string[];
    recentText: string[];
  },
) {
  const [characterLinks, worldLinks, personaBooks] = await Promise.all([
    admin
      .from("lorebook_characters")
      .select("lorebook_id,lorebook:lorebooks!inner(user_id)")
      .eq("character_id", params.characterId)
      .eq("lorebook.user_id", params.creatorId),
    params.worldId
      ? admin
          .from("lorebook_worlds")
          .select(
            "lorebook_id,lorebook:lorebooks!inner(user_id),world:worlds!inner(user_id,visibility)",
          )
          .eq("world_id", params.worldId)
      : Promise.resolve({ data: [], error: null }),
    params.personaLoreIds?.length
      ? ownerClient
          .from("lorebooks")
          .select("id")
          .eq("user_id", params.userId)
          .in("id", params.personaLoreIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (characterLinks.error || worldLinks.error || personaBooks.error)
    throw new RequestError(503, "Linked lore could not be loaded.");
  const ids = [
    ...new Set([
      ...(characterLinks.data || []).map((l) => l.lorebook_id),
      ...(worldLinks.data || [])
        .filter((l) => {
          const lore = l.lorebook as unknown as { user_id: string };
          const world = l.world as unknown as { user_id: string; visibility:string };
          return lore?.user_id === world?.user_id && (world.user_id===params.creatorId || ["public","unlisted"].includes(world.visibility));
        })
        .map((l) => l.lorebook_id),
      ...(personaBooks.data || []).map((l) => l.id),
    ]),
  ];
  if (!ids.length) return resolveLorebookContext(params.recentText, []);
  const { data, error } = await admin
    .from("lorebook_entries")
    .select(
      "id,title,content,keywords,priority,enabled,insertion_order,is_constant,case_sensitive",
    )
    .in("lorebook_id", ids)
    .eq("enabled", true);
  if (error)
    throw new RequestError(503, "Linked lore entries could not be loaded.");
  return resolveLorebookContext(
    params.recentText,
    (data || []) as RuntimeLorebookEntry[],
  );
}
