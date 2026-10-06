import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  clearSavedDraft,
  draftKey,
  readDraft,
  writeDraft,
} from "../lib/draftJournal";

type Room = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  setting: string;
  lore: string;
  rules: string;
  objectives: string;
  status: string;
  updated_at: string;
  ai_enabled: boolean;
  ai_policy: string;
  turn_user_id: string | null;
};
type Member = {
  id: string;
  user_id: string;
  status: string;
  ai_opt_in: boolean;
  persona_id: string | null;
  profile?: { display_name: string };
};
type Actor = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  ai_character_id: string | null;
};
type Turn = {
  id: string;
  sender_id: string;
  character_id: string | null;
  content: string;
  message_type: string;
  author_kind: string;
  sequence_number: number;
  edited_at: string | null;
  profiles?: { display_name: string };
};
type Draft = { text: string; id: string; characterId: string; type: string };
export default function HumanRoleplaySessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [personas, setPersonas] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [aiCharacters, setAiCharacters] = useState<
    Array<{ id: string; bot_profile: { display_name: string } | null }>
  >([]);
  const [text, setText] = useState("");
  const [editingTurn, setEditingTurn] = useState<Turn | null>(null);
  const [editText, setEditText] = useState("");
  const [actorId, setActorId] = useState("");
  const [type, setType] = useState("dialogue");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedAi, setSelectedAi] = useState("");
  const [notesDraft, setNotesDraft] = useState<{
    setting: string;
    lore: string;
    rules: string;
    objectives: string;
  } | null>(null);
  const [notesEditorScope, setNotesEditorScope] = useState<string | null>(null);
  const editRoomScope = useRef<string | null>(null);
  const [notesRevision, setNotesRevision] = useState<string>("");
  const notesScope =
    user?.id && sessionId
      ? draftKey(user.id, "message", "room-notes", sessionId)
      : null;
  useEffect(() => {
    if (
      notesScope &&
      notesDraft &&
      notesEditorScope === notesScope &&
      !writeDraft(notesScope, notesDraft, notesRevision)
    )
      setError("Local notes recovery is unavailable. Keep this editor open.");
  }, [notesDraft, notesScope, notesRevision, notesEditorScope]);
  useEffect(() => {
    setNotesDraft(null);
    setEditingTurn(null);
    setRecall([]);
  }, [sessionId]);
  const [historyLimit, setHistoryLimit] = useState(200);
  const [recall, setRecall] = useState<Array<{ id: string; excerpt: string }>>(
    [],
  );
  const draftScope =
    user?.id && sessionId
      ? draftKey(user.id, "message", "room", sessionId)
      : null;
  const [readyScope, setReadyScope] = useState<string | null>(null);
  const pending = useRef<Draft | null>(null);
  const sendLock = useRef(false);
  const currentScope = useRef(draftScope);
  currentScope.current = draftScope;
  const load = useCallback(async () => {
    if (!sessionId || !user) return;
    const expectedScope = draftKey(user.id, "message", "room", sessionId);
    if (currentScope.current !== expectedScope) return;
    const [r, m, a, t, p, c] = await Promise.all([
      supabase
        .from("human_roleplay_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle(),
      supabase
        .from("human_roleplay_participants")
        .select(
          "id,user_id,status,ai_opt_in,persona_id,profile:profiles!human_roleplay_participants_user_id_fkey(display_name)",
        )
        .eq("session_id", sessionId),
      supabase
        .from("human_roleplay_characters")
        .select("id,owner_id,name,description,ai_character_id")
        .eq("session_id", sessionId),
      supabase
        .from("human_roleplay_messages")
        .select("*,profiles:sender_id(display_name)")
        .eq("session_id", sessionId)
        .is("deleted_at", null)
        .order("sequence_number", { ascending: false })
        .limit(historyLimit),
      supabase.from("personas").select("id,name").eq("user_id", user.id),
      supabase
        .from("ai_characters")
        .select(
          "id,bot_profile:profiles!ai_characters_user_id_fkey(display_name)",
        )
        .limit(100),
    ]);
    if (currentScope.current !== expectedScope) return;
    if (r.error || m.error || a.error || t.error) {
      setError(
        "This room could not be loaded. Check your membership and retry.",
      );
      setLoading(false);
      return;
    }
    setRoom(r.data as Room | null);
    setMembers((m.data || []) as unknown as Member[]);
    setActors((a.data || []) as Actor[]);
    setTurns([...(t.data || [])].reverse() as Turn[]);
    setPersonas(p.data || []);
    setAiCharacters((c.data || []) as unknown as typeof aiCharacters);
    setLoading(false);
  }, [sessionId, user, historyLimit]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void load();
    const channel = supabase
      .channel(`human-room:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "human_roleplay_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          if (active) void load();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "human_roleplay_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          if (active) void load();
        },
      )
      .subscribe();
    const interval = setInterval(() => {
      if (active) void load();
    }, 15000);
    return () => {
      active = false;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [load, sessionId]);
  useEffect(() => {
    const saved = draftScope ? readDraft<Draft>(draftScope) : null;
    pending.current = saved?.value || null;
    setText(saved?.value.text || "");
    setActorId(saved?.value.characterId || "");
    setType(saved?.value.type || "dialogue");
    setReadyScope(draftScope);
  }, [draftScope]);
  useEffect(() => {
    if (!draftScope || readyScope !== draftScope) return;
    const previous = pending.current;
    const snapshot =
      previous &&
      previous.text === text &&
      previous.characterId === actorId &&
      previous.type === type
        ? previous
        : { text, id: crypto.randomUUID(), characterId: actorId, type };
    pending.current = snapshot;
    if (!writeDraft(draftScope, snapshot))
      setError(
        "Local draft recovery is unavailable. Keep this tab open until your message is saved.",
      );
  }, [text, actorId, type, draftScope, readyScope]);
  const editScope =
    user?.id && sessionId && editingTurn
      ? draftKey(user.id, "message", "room-edit", sessionId, editingTurn.id)
      : null;
  useEffect(() => {
    if (
      editScope &&
      editRoomScope.current === draftScope &&
      !writeDraft(editScope, { text: editText })
    )
      setError("Local edit recovery is unavailable. Keep this tab open.");
  }, [editScope, editText, draftScope]);
  const saveEdit = async () => {
    if (!editingTurn || !editScope || !editText.trim()) return;
    const snapshot = { text: editText };
    const requestScope = currentScope.current;
    setBusy(true);
    setError("");
    const { data, error } = await supabase
      .from("human_roleplay_messages")
      .update({ content: editText, edited_at: new Date().toISOString() })
      .eq("id", editingTurn.id)
      .eq("content", editingTurn.content)
      .select("id")
      .maybeSingle();
    if (requestScope !== currentScope.current) return;
    setBusy(false);
    if (error || !data) {
      setError(
        "This edit could not be confirmed. Your local edit is safe; refresh if the turn changed elsewhere.",
      );
      return;
    }
    if (clearSavedDraft(editScope, snapshot)) setEditingTurn(null);
    await load();
  };
  const me = members.find((m) => m.user_id === user?.id);
  const host = room?.creator_id === user?.id;
  const run = async (
    action: () => PromiseLike<{ error: unknown }>,
    message = "This action could not be completed. Please retry.",
  ) => {
    if (sendLock.current) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await action();
      if (error) throw new Error(message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : message);
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    if (!sessionId || !draftScope || !text.trim() || sendLock.current) return;
    const snapshot = pending.current || {
      text,
      id: crypto.randomUUID(),
      characterId: actorId,
      type,
    };
    pending.current = snapshot;
    writeDraft(draftScope, snapshot);
    sendLock.current = true;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.rpc("send_human_roleplay_message", {
        p_session_id: sessionId,
        p_content: snapshot.text,
        p_message_type: snapshot.type,
        p_character_id: snapshot.characterId || null,
        p_request_id: snapshot.id,
      });
      if (error)
        throw new Error(
          "Your message could not be confirmed. Your draft is safe; retry uses the same message identifier.",
        );
      if (currentScope.current === draftScope) {
        clearSavedDraft(draftScope, snapshot);
        setText((current) => (current === snapshot.text ? "" : current));
        pending.current = null;
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your draft is safe. Please retry.",
      );
    } finally {
      sendLock.current = false;
      setBusy(false);
    }
  };
  const requestAi = async (id: string) => {
    if (busy || !sessionId) return;
    setBusy(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/room-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ session_id: sessionId, character_id: id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error ||
            "The AI response could not be prepared. Your timeline is unchanged.",
        );
      setRecall(data.recall?.sources || []);
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The AI response could not be prepared.",
      );
    } finally {
      setBusy(false);
    }
  };
  const invite = () =>
    run(async () => {
      const { data: person, error } = await supabase
        .from("profiles")
        .select("user_id,role")
        .eq("username", inviteName.trim().replace(/^@/, ""))
        .maybeSingle();
      if (error || !person || person.role === "ai_character")
        return { error: true };
      return supabase.rpc("invite_human_roleplay_user", {
        p_session_id: sessionId,
        p_invited_user_id: person.user_id,
      });
    }, "That person could not be invited. Check their username and the room capacity.");
  const openNotes = () => {
    if (!room || !notesScope) return;
    const saved = readDraft<{
      setting: string;
      lore: string;
      rules: string;
      objectives: string;
    }>(notesScope);
    setNotesDraft(
      saved?.value || {
        setting: room.setting,
        lore: room.lore,
        rules: room.rules,
        objectives: room.objectives,
      },
    );
    setNotesEditorScope(notesScope);
    setNotesRevision(saved?.baseRevision || room.updated_at);
  };
  const saveNotes = async () => {
    if (!room || !notesScope || !notesDraft || busy) return;
    const snapshot = notesDraft,
      expectedScope = currentScope.current;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("human_roleplay_sessions")
        .update(snapshot)
        .eq("id", room.id)
        .eq("creator_id", user!.id)
        .eq("updated_at", notesRevision)
        .select("id")
        .maybeSingle();
      if (currentScope.current !== expectedScope) return;
      if (error || !data)
        throw new Error(
          "The room notes changed elsewhere or could not be saved. Your local notes remain available for comparison.",
        );
      if (clearSavedDraft(notesScope, snapshot)) setNotesDraft(null);
      await load();
    } catch (e) {
      if (currentScope.current === expectedScope)
        setError(
          e instanceof Error ? e.message : "Room notes could not be saved.",
        );
    } finally {
      if (currentScope.current === expectedScope) setBusy(false);
    }
  };
  const controls =
    "min-h-11 rounded-lg border border-warm-300 bg-token-input px-3 py-2 disabled:opacity-50";
  if (loading)
    return (
      <main className="p-6" role="status">
        Opening your room…
      </main>
    );
  if (!room)
    return (
      <main className="p-6">
        <p role="alert">{error || "This room is unavailable."}</p>
        <button
          className={controls}
          onClick={() => navigate("/human-roleplay")}
        >
          Return to rooms
        </button>
      </main>
    );
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-token-app p-3 sm:p-6 text-token-app-fg">
      <button className={controls} onClick={() => navigate("/human-roleplay")}>
        Human rooms
      </button>
      <header className="my-5">
        <p className="text-sm font-semibold">
          {room.ai_enabled ? "Hybrid Roleplay" : "Human Roleplay"} ·{" "}
          {room.status}
        </p>
        <h1 className="text-3xl font-bold">{room.title}</h1>
        <p>{room.description}</p>
      </header>
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400 p-3">
          {error}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <h2 className="font-bold">Shared timeline</h2>
          {turns.length >= historyLimit && (
            <button
              className={controls}
              onClick={() => setHistoryLimit((n) => n + 200)}
            >
              Load earlier turns
            </button>
          )}
          <ol className="my-4 space-y-3" aria-live="polite">
            {turns.map((turn) => (
              <li
                key={turn.id}
                className="rounded-xl border border-token-border bg-token-card p-3"
              >
                <p className="text-xs font-semibold">
                  {actors.find((a) => a.id === turn.character_id)?.name ||
                    turn.profiles?.display_name ||
                    "Participant"}{" "}
                  · {turn.author_kind === "ai" ? "AI character" : "Human"} ·{" "}
                  {turn.message_type} · #{turn.sequence_number}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {turn.content}
                </p>
                {turn.edited_at && <small>Edited</small>}
                {turn.sender_id === user?.id &&
                  turn.author_kind === "human" && (
                    <button
                      className="min-h-11 px-2 text-xs"
                      disabled={busy}
                      onClick={() => {
                        editRoomScope.current = draftScope;
                        setEditingTurn(turn);
                        const key =
                          user?.id && sessionId
                            ? draftKey(
                                user.id,
                                "message",
                                "room-edit",
                                sessionId,
                                turn.id,
                              )
                            : null;
                        setEditText(
                          key
                            ? readDraft<{ text: string }>(key)?.value.text ||
                                turn.content
                            : turn.content,
                        );
                      }}
                    >
                      Edit my turn
                    </button>
                  )}
              </li>
            ))}
          </ol>
          {!turns.length && (
            <p className="py-8">The first scene is yours to begin.</p>
          )}
          {editingTurn && (
            <section className="my-3 rounded-xl border p-3">
              <h3 className="font-bold">Edit your turn</h3>
              <textarea
                aria-label="Edit room turn"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={10000}
                className="min-h-28 w-full rounded border bg-token-input p-2"
              />
              <button
                className={controls}
                disabled={busy || !editText.trim()}
                onClick={() => void saveEdit()}
              >
                Save edit
              </button>
              <button className={controls} onClick={() => setEditingTurn(null)}>
                Close editor (keep local draft)
              </button>
            </section>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="space-y-3"
          >
            <div className="flex flex-wrap gap-2">
              <label>
                Speak as
                <select
                  className={controls}
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                >
                  <option value="">Yourself</option>
                  {actors
                    .filter(
                      (a) => a.owner_id === user?.id && !a.ai_character_id,
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Turn type
                <select
                  className={controls}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {[
                    "dialogue",
                    "narration",
                    "action",
                    ...(host ? ["system"] : []),
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <textarea
              aria-label="Room message"
              className="w-full min-h-28 rounded-xl border border-warm-300 bg-token-input p-3"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
            />
            <button
              className={controls}
              disabled={
                busy ||
                !text.trim() ||
                me?.status !== "accepted" ||
                !["open", "active"].includes(room.status)
              }
            >
              {busy ? "Saving…" : "Send human turn"}
            </button>
          </form>
          {room.ai_enabled && (
            <div className="mt-4">
              <p className="text-sm">
                AI only responds when an authorized participant requests a turn.
                Everyone must remain opted in.
              </p>
              {actors
                .filter((a) => a.ai_character_id)
                .map((a) => (
                  <button
                    key={a.id}
                    className={controls}
                    disabled={busy || !me?.ai_opt_in}
                    onClick={() => void requestAi(a.id)}
                  >
                    Request {a.name}
                  </button>
                ))}
            </div>
          )}
          {recall.length > 0 && (
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer">
                Shared sources recalled for the last AI turn
              </summary>
              {recall.map((s) => (
                <p key={s.id} className="mt-2 text-sm">
                  {s.excerpt}
                </p>
              ))}
            </details>
          )}
        </section>
        <aside className="space-y-4">
          <section className="rounded-xl border border-token-border bg-token-surface p-4">
            <h2 className="font-bold">People and consent</h2>
            {!host && (
              <button
                className={controls}
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    supabase.rpc("leave_human_room", {
                      p_session_id: sessionId,
                    }),
                  )
                }
              >
                Leave room
              </button>
            )}
            {members.map((m) => (
              <p key={m.id} className="my-2 text-sm">
                {m.profile?.display_name || "Participant"} · {m.status} ·{" "}
                {m.ai_opt_in ? "AI opted in" : "Human only"}
                {host && m.user_id !== user?.id && m.status === "accepted" && (
                  <button
                    className={controls}
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        supabase.rpc("remove_human_room_member", {
                          p_session_id: sessionId,
                          p_user_id: m.user_id,
                        }),
                      )
                    }
                  >
                    Remove participant
                  </button>
                )}
              </p>
            ))}
            <label className="block my-3">
              <input
                type="checkbox"
                checked={me?.ai_opt_in || false}
                disabled={busy}
                onChange={(e) =>
                  void run(() =>
                    supabase.rpc("set_my_human_room_preferences", {
                      p_session_id: sessionId,
                      p_persona_id: me?.persona_id || null,
                      p_ai_opt_in: e.target.checked,
                    }),
                  )
                }
              />{" "}
              I consent to AI participation in this shared room
            </label>
            <p className="text-xs">
              Opting out immediately blocks further AI turns. Private cabinet
              memories are never shared with this room.
            </p>
            {host && (
              <>
                <label className="block my-3">
                  <input
                    type="checkbox"
                    checked={room.ai_enabled}
                    disabled={busy}
                    onChange={(e) =>
                      void run(
                        () =>
                          supabase.rpc("configure_human_room", {
                            p_session_id: sessionId,
                            p_ai_enabled: e.target.checked,
                            p_ai_policy: room.ai_policy,
                            p_turn_user_id: room.turn_user_id,
                          }),
                        "AI requires consent from every accepted participant.",
                      )
                    }
                  />{" "}
                  Enable hybrid mode
                </label>
                <label className="block">
                  AI requests
                  <select
                    className={controls}
                    value={room.ai_policy}
                    onChange={(e) =>
                      void run(() =>
                        supabase.rpc("configure_human_room", {
                          p_session_id: sessionId,
                          p_ai_enabled: room.ai_enabled,
                          p_ai_policy: e.target.value,
                          p_turn_user_id: room.turn_user_id,
                        }),
                      )
                    }
                  >
                    <option value="host">Host only</option>
                    <option value="participants">
                      Consenting participants
                    </option>
                  </select>
                </label>
                <label className="block mt-3">
                  Human turn
                  <select
                    className={controls}
                    value={room.turn_user_id || ""}
                    onChange={(e) =>
                      void run(() =>
                        supabase.rpc("configure_human_room", {
                          p_session_id: sessionId,
                          p_ai_enabled: room.ai_enabled,
                          p_ai_policy: room.ai_policy,
                          p_turn_user_id: e.target.value || null,
                        }),
                      )
                    }
                  >
                    <option value="">Free turns</option>
                    {members
                      .filter((m) => m.status === "accepted")
                      .map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.profile?.display_name || m.user_id}
                        </option>
                      ))}
                  </select>
                </label>
                <input
                  aria-label="Invite username"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className={"mt-3 w-full " + controls}
                />
                <button
                  className={controls}
                  disabled={busy || !inviteName.trim()}
                  onClick={() => void invite()}
                >
                  Invite person
                </button>
                <button
                  className={controls}
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      supabase
                        .from("human_roleplay_sessions")
                        .update({
                          status:
                            room.status === "paused" ? "active" : "paused",
                        })
                        .eq("id", sessionId),
                    )
                  }
                >
                  {room.status === "paused" ? "Resume room" : "Pause room"}
                </button>
              </>
            )}
          </section>
          <section className="rounded-xl border border-token-border bg-token-surface p-4">
            <h2 className="font-bold">Characters</h2>
            {actors.map((a) => (
              <p key={a.id} className="my-2">
                {a.name} · {a.ai_character_id ? "AI" : "Human"}
              </p>
            ))}
            <input
              aria-label="New character name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={"w-full " + controls}
            />
            <textarea
              aria-label="Room character description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={2000}
              className="my-2 w-full border rounded bg-token-input p-2"
            />
            <button
              className={controls}
              disabled={busy || !newName.trim()}
              onClick={() =>
                void run(() =>
                  supabase.rpc("create_human_roleplay_character", {
                    p_session_id: sessionId,
                    p_name: newName,
                    p_description: newDescription,
                  }),
                )
              }
            >
              Create room character
            </button>
            <label className="block mt-3">
              Share a persona name and description
              <select
                className={controls}
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
              >
                <option value="">Choose your persona</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={controls}
              disabled={busy || !selectedPersona}
              onClick={() =>
                void run(() =>
                  supabase.rpc("attach_human_room_character", {
                    p_session_id: sessionId,
                    p_persona_id: selectedPersona,
                    p_ai_character_id: null,
                  }),
                )
              }
            >
              Add my persona character
            </button>
            {host && (
              <>
                <label className="block mt-3">
                  Existing AI character
                  <select
                    className={controls}
                    value={selectedAi}
                    onChange={(e) => setSelectedAi(e.target.value)}
                  >
                    <option value="">Choose a character</option>
                    {aiCharacters.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bot_profile?.display_name || "Character"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={controls}
                  disabled={busy || !selectedAi}
                  onClick={() =>
                    void run(() =>
                      supabase.rpc("attach_human_room_character", {
                        p_session_id: sessionId,
                        p_persona_id: null,
                        p_ai_character_id: selectedAi,
                      }),
                    )
                  }
                >
                  Add AI identity (requires consent to respond)
                </button>
              </>
            )}
          </section>
          <section className="rounded-xl border border-token-border bg-token-surface p-4">
            <h2 className="font-bold">Creator world notes</h2>
            {host && !notesDraft && (
              <button className={controls} onClick={openNotes}>
                Edit shared canon and notes
              </button>
            )}
            {host && notesDraft && (
              <div className="space-y-2 my-3">
                <p className="text-sm">
                  Only the host changes shared canon. AI replies never update
                  these notes.
                </p>
                {(["setting", "lore", "rules", "objectives"] as const).map(
                  (key) => (
                    <label className="block capitalize" key={key}>
                      {key}
                      <textarea
                        aria-label={`Shared ${key}`}
                        className="min-h-28 w-full rounded border border-token-border bg-token-input p-2"
                        value={notesDraft[key]}
                        maxLength={key === "lore" ? 8000 : 4000}
                        onChange={(event) =>
                          setNotesDraft({
                            ...notesDraft,
                            [key]: event.target.value,
                          })
                        }
                      />
                    </label>
                  ),
                )}
                {room.updated_at !== notesRevision && (
                  <>
                    <p role="status">
                      Compare your local draft with the current notes below.
                      Saving is blocked until you choose to use the current
                      revision.
                    </p>
                    <button
                      className={controls}
                      onClick={() => setNotesRevision(room.updated_at)}
                    >
                      I reviewed the current notes; save my draft against this
                      revision
                    </button>
                  </>
                )}
                <button
                  className={controls}
                  disabled={busy || room.updated_at !== notesRevision}
                  onClick={() => void saveNotes()}
                >
                  Save shared notes
                </button>
                <button
                  className={controls}
                  onClick={() => setNotesDraft(null)}
                >
                  Close notes editor (keep local draft)
                </button>
              </div>
            )}
            {(["setting", "lore", "rules", "objectives"] as const).map(
              (key) => (
                <details key={key}>
                  <summary className="min-h-11 cursor-pointer capitalize">
                    {key}
                  </summary>
                  <p className="whitespace-pre-wrap">
                    {room[key] || "Not defined yet."}
                  </p>
                </details>
              ),
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
