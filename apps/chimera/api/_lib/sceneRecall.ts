import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatContinuity,
  selectContinuitySources,
  selectScopedFacts,
  type ContinuitySource,
  type ScopedFact,
} from "../../src/lib/continuity.js";
import { RequestError } from "./requestProtection.js";

export async function loadSceneRecall(
  client: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    conversationId?: string;
    sessionId?: string;
    personaId: string | null;
    recentText: string[];
  },
) {
  const query = client
    .from("character_memories")
    .select(
      "id,content,memory_type,importance,expires_at,persona_id,conversation_id,session_id,approval_status,metadata",
    )
    .eq("user_id", params.userId)
    .eq("character_id", params.characterId)
    .eq("approval_status", "approved")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("importance", { ascending: false })
    .or(
      `conversation_id.is.null,conversation_id.eq.${params.conversationId || "00000000-0000-0000-0000-000000000000"}`,
    )
    .limit(200);
  if (params.sessionId) query.eq("session_id", params.sessionId);
  else query.is("session_id", null);
  const { data: rows, error } = await (params.personaId
    ? query.eq("persona_id", params.personaId)
    : query.is("persona_id", null));
  if (error)
    throw new RequestError(503, "Your private continuity could not be loaded.");
  const memories = selectScopedFacts((rows || []) as ScopedFact[], params);
  let sources: ContinuitySource[] = [];
  if (params.conversationId) {
    const { data: summary, error } = await client.rpc(
      "refresh_chimera_continuity",
      { p_conversation_id: params.conversationId },
    );
    if (error)
      throw new RequestError(503, "Scene recall could not be refreshed.");
    sources = selectContinuitySources(
      summary?.sources || [],
      params.recentText,
    );
  }
  const { data: relationships, error: relationshipError } = await client
    .from("character_relationships")
    .select(
      "id,source_character_id,target_character_id,relationship_type,description,bidirectional",
    )
    .or(
      `source_character_id.eq.${params.characterId},target_character_id.eq.${params.characterId}`,
    )
    .limit(20);
  if (relationshipError)
    throw new RequestError(503, "Character relationships could not be loaded.");
  const relationshipRows = (relationships || []).filter(
    (r) => r.source_character_id === params.characterId || r.bidirectional,
  );
  return {
    memories,
    sources,
    relationships: relationshipRows,
    prompt: [
      formatContinuity(sources),
      relationshipRows.length
        ? "## Creator-authored character relationships\n" +
          relationshipRows
            .map(
              (r) =>
                `${r.source_character_id} → ${r.target_character_id}: ${r.relationship_type}. ${r.description}`,
            )
            .join("\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    scope: {
      persona_id: params.personaId,
      conversation_id: params.conversationId || null,
      session_id: params.sessionId || null,
    },
  };
}
