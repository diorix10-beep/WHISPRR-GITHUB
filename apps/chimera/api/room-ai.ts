import { loadLinkedLore } from "./_lib/linkedLore.js";
import { AVAILABLE_CHAT_MODELS } from "../src/lib/chimeraModels.js";
import {
  formatContinuity,
  selectContinuitySources,
} from "../src/lib/continuity.js";
import {
  buildSystemPrompt,
  selectRecentHistory,
  validateAndSanitizeChimeraResponse,
} from "./ai-chat.js";
import {
  authenticate,
  fingerprint,
  finishRequest,
  jsonResponse,
  providerFetch,
  readPayload,
  requestFailure,
  RequestError,
  serverClient,
  uuid,
} from "./_lib/requestProtection.js";
export const config = { runtime: "edge" };
export default async function handler(req: Request) {
  let reservation:
    | { id: string; lease: string; state: string; result: unknown }
    | undefined;
  let completed = false;
  let admin: ReturnType<typeof serverClient> | undefined;
  try {
    if (req.method !== "POST")
      throw new RequestError(405, "Method not allowed.");
    const { supabase, user } = await authenticate(req);
    const { session_id, character_id } = await readPayload(req);
    if (!uuid(session_id) || !uuid(character_id))
      throw new RequestError(400, "Choose a room character.");
    const [
      { data: session },
      { data: member },
      { data: roomCharacter },
      { data: participants },
    ] = await Promise.all([
      supabase
        .from("human_roleplay_sessions")
        .select("*")
        .eq("id", session_id)
        .maybeSingle(),
      supabase
        .from("human_roleplay_participants")
        .select("ai_opt_in,status")
        .eq("session_id", session_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("human_roleplay_characters")
        .select("id,ai_character_id,name")
        .eq("session_id", session_id)
        .eq("id", character_id)
        .maybeSingle(),
      supabase
        .from("human_roleplay_participants")
        .select("user_id,ai_opt_in,status")
        .eq("session_id", session_id),
    ]);
    if (
      !session?.ai_enabled ||
      !member?.ai_opt_in ||
      member.status !== "accepted" ||
      !roomCharacter?.ai_character_id ||
      !["open", "active"].includes(session.status) ||
      (session.ai_policy === "host" && session.creator_id !== user.id) ||
      (session.turn_user_id && session.turn_user_id !== user.id) ||
      (participants || []).some((p) => p.status === "accepted" && !p.ai_opt_in)
    )
      throw new RequestError(
        403,
        "Every participant must consent, and room turn permission is required.",
      );
    const { data: character } = await supabase
      .from("ai_characters")
      .select("*")
      .eq("id", roomCharacter.ai_character_id)
      .maybeSingle();
    if (!character)
      throw new RequestError(403, "This AI character is unavailable.");
    const { data: bot } = await supabase
      .from("profiles")
      .select("display_name,username,role")
      .eq("user_id", character.user_id)
      .maybeSingle();
    if (bot?.role !== "ai_character")
      throw new RequestError(403, "Choose an AI character.");
    const { data: sharedActors, error: actorError } = await supabase
      .from("human_roleplay_characters")
      .select("id,name,description,personality,background,goals,relationships")
      .eq("session_id", session_id);
    if (actorError)
      throw new RequestError(503, "Shared characters could not be loaded.");
    const actorNames = new Map(
      (sharedActors || []).map((actor) => [actor.id, actor.name]),
    );
    const sharedCharacterContext = (sharedActors || [])
      .map(
        (actor) =>
          `${actor.name}: ${actor.description || ""}\nPersonality: ${actor.personality || ""}\nBackground: ${actor.background || ""}\nGoals: ${actor.goals || ""}\nRelationships: ${actor.relationships || ""}`,
      )
      .join("\n\n");
    const { data: messages, error: messageError } = await supabase
      .from("human_roleplay_messages")
      .select(
        "id,sender_id,character_id,author_kind,content,sequence_number,profiles:sender_id(display_name)",
      )
      .eq("session_id", session_id)
      .is("deleted_at", null)
      .order("sequence_number", { ascending: false })
      .limit(80);
    if (messageError)
      throw new RequestError(503, "The room timeline could not be loaded.");
    const source = (messages || []).find((m) => m.author_kind === "human");
    if (!source)
      throw new RequestError(
        400,
        "Write a human turn before requesting an AI response.",
      );
    const { data: preferences } = await supabase
      .from("chimera_user_preferences")
      .select("default_ai_model")
      .eq("user_id", user.id)
      .maybeSingle();
    const model =
      preferences?.default_ai_model || character.ai_model || "gemini-2.5-flash";
    if (!AVAILABLE_CHAT_MODELS.some((m) => m.id === model))
      throw new RequestError(400, "Choose an available model.");
    admin = serverClient();
    const { data: job, error: reserveError } = await admin.rpc(
      "reserve_chimera_room_ai",
      {
        p_user_id: user.id,
        p_session_id: session_id,
        p_character_id: character_id,
        p_source_id: source.id,
        p_fingerprint: await fingerprint({
          session_id,
          character_id,
          source: source.id,
          model,
        }),
      },
    );
    if (reserveError || !job)
      throw new RequestError(
        403,
        "The AI turn could not be reserved. Check room consent and permissions.",
      );
    if (job.state === "busy")
      throw new RequestError(409, "A room response is already being prepared.");
    if (job.state === "limited")
      throw new RequestError(
        429,
        "Please wait before requesting another response.",
      );
    if (job.state === "conflict")
      throw new RequestError(
        409,
        "This turn was requested with different settings.",
      );
    if (job.state === "completed") {
      completed = true;
      return jsonResponse(job.result);
    }
    reservation = job;
    const { data: archive, error: archiveError } = await supabase.rpc(
      "get_human_room_continuity",
      { p_session_id: session_id },
    );
    if (archiveError)
      throw new RequestError(503, "Room continuity could not be loaded.");
    const sources = selectContinuitySources(
      archive || [],
      (messages || []).slice(0, 10).map((m) => m.content),
    );
    // Never inject a requester's private cabinet or private persona into a shared room.
    // Only shared room notes, submitted characters, sources and public character definition.
    const lore = await loadLinkedLore(admin, supabase, {
      characterId: character.id,
      creatorId: character.creator_id,
      worldId: character.world_id,
      userId: user.id,
      recentText: (messages || []).slice(0, 10).map((m) => m.content),
    });
    const prompt =
      buildSystemPrompt(
        character as Parameters<typeof buildSystemPrompt>[0],
        bot as Parameters<typeof buildSystemPrompt>[1],
        null,
        [formatContinuity(sources), lore.prompt].filter(Boolean).join("\n\n"),
      ) +
      `\n## Creator-controlled shared room\n${session.title}\nSetting: ${session.setting}\nLore: ${session.lore}\nRules: ${session.rules}\nObjectives: ${session.objectives}\nShared character submissions:\n${sharedCharacterContext}\nRespond only as ${roomCharacter.name}. Humans control their characters and the next turn. Do not narrate choices for them or create permanent canon.`;
    const history = selectRecentHistory(
      [...(messages || [])].reverse().map((m) => ({
        sender_id: m.sender_id,
        content: `[${m.author_kind === "ai" ? "AI character" : "Human participant"} ${actorNames.get(m.character_id) || (m.profiles as unknown as { display_name?: string } | null)?.display_name || m.sender_id}] ${m.content}`,
      })),
    ).map((m) => ({
      role: m.sender_id === character.user_id ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    if (
      prompt.length + history.reduce((n, m) => n + m.parts[0].text.length, 0) >
      100000
    )
      throw new RequestError(413, "The room context is too large.");
    let reply = "";
    if (model.includes("/")) {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new RequestError(503, "This model is not configured.");
      const response = await providerFetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: prompt },
              ...history.map((m) => ({
                role: m.role === "model" ? "assistant" : "user",
                content: m.parts[0].text,
              })),
            ],
            temperature: 0.9,
            max_tokens: 2048,
          }),
        },
      );
      if (!response.ok)
        throw new RequestError(502, "The AI character could not respond.");
      reply = (await response.json()).choices?.[0]?.message?.content || "";
    } else {
      const key =
        process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
      if (!key) throw new RequestError(503, "This model is not configured.");
      const response = await providerFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: prompt }] },
            contents: history,
            generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
          }),
        },
      );
      if (!response.ok)
        throw new RequestError(502, "The AI character could not respond.");
      reply =
        (await response.json()).candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || "")
          .join("") || "";
    }
    const validation = validateAndSanitizeChimeraResponse(reply);
    if (!validation.isCompliant || !validation.sanitizedReply.trim())
      throw new RequestError(
        502,
        "The character could not provide a usable response.",
      );
    const { data: result, error } = await admin.rpc(
      "complete_chimera_room_ai",
      {
        p_request_id: job.id,
        p_lease: job.lease,
        p_session_id: session_id,
        p_character_id: character_id,
        p_source_id: source.id,
        p_content: validation.sanitizedReply,
      },
    );
    if (error)
      throw new RequestError(
        409,
        "The response could not be saved. Room consent or turn permissions may have changed.",
      );
    completed = true;
    return jsonResponse({
      ...result,
      recall: { sources, lore: lore.entries, canon: session.lore },
    });
  } catch (error) {
    return requestFailure(error);
  } finally {
    if (admin && reservation && !completed)
      await finishRequest(
        admin,
        reservation.id,
        reservation.lease,
        null,
        true,
      ).catch(() => undefined);
  }
}
