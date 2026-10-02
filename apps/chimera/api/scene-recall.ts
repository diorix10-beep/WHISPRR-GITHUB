import { loadLinkedLore } from "./_lib/linkedLore.js";
import {
  authenticate,
  jsonResponse,
  readPayload,
  requestFailure,
  RequestError,
  uuid,
  serverClient,
} from "./_lib/requestProtection.js";
import { loadSceneRecall } from "./_lib/sceneRecall.js";
export const config = { runtime: "edge" };
export default async function handler(req: Request) {
  try {
    if (req.method !== "POST")
      throw new RequestError(405, "Method not allowed.");
    const { supabase, user } = await authenticate(req);
    const { conversation_id, bot_user_id } = await readPayload(req);
    if (!uuid(conversation_id) || !uuid(bot_user_id))
      throw new RequestError(400, "Choose a scene and character.");
    const { data: member } = await supabase
      .from("conversation_participants")
      .select("persona_id,persona_selected")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: bot } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversation_id)
      .eq("user_id", bot_user_id)
      .maybeSingle();
    if (!member || !bot) throw new RequestError(403, "Scene access required.");
    const { data: character } = await supabase
      .from("ai_characters")
      .select("id,creator_id,world_id")
      .eq("user_id", bot_user_id)
      .maybeSingle();
    if (!character) throw new RequestError(404, "Character unavailable.");
    const { data: defaultPersona } = member.persona_selected
      ? { data: null }
      : await supabase
          .from("personas")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();
    const personaId = member.persona_id || defaultPersona?.id || null;
    const { data: persona } = personaId
      ? await supabase
          .from("personas")
          .select("lorebook_ids,relationships")
          .eq("id", personaId)
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };
    let recentQuery = supabase
      .from("messages")
      .select("id,sender_id,content,persona_id,created_at")
      .eq("conversation_id", conversation_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(32);
    recentQuery = personaId
      ? recentQuery.eq("persona_id", personaId)
      : recentQuery.is("persona_id", null);
    const { data: history } = await recentQuery;
    const recentText = (history || [])
      .filter((m) => (m.persona_id || null) === personaId)
      .map((m) => m.content);
    const lore = await loadLinkedLore(serverClient(), supabase, {
      characterId: character.id,
      creatorId: character.creator_id,
      worldId: character.world_id,
      userId: user.id,
      personaLoreIds: persona?.lorebook_ids || [],
      recentText,
    });
    const recall = await loadSceneRecall(supabase, {
      userId: user.id,
      characterId: character.id,
      conversationId: conversation_id,
      personaId,
      recentText,
    });
    const { data: scene } = await supabase
      .from("conversations")
      .select("memory_summary,canon_revision")
      .eq("id", conversation_id)
      .maybeSingle();
    return jsonResponse({
      ...recall,
      recentSources: (history || []).map((m) => ({
        id: m.id,
        excerpt: m.content.slice(0, 360),
      })),
      lore: lore.entries,
      loreKeywords: lore.matchedKeywordsMap,
      personaRelationships: persona?.relationships || "",
      canon: scene?.memory_summary || "",
      canon_revision: scene?.canon_revision || 0,
    });
  } catch (error) {
    return requestFailure(error);
  }
}
