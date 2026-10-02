import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { singleRpcRecord } from "../../lib/rpcRecord";

type Props = {
  storyTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  content: string;
  onClose: () => void;
  onCreated: (mode: "ai" | "human", id: string) => void;
};
export function ChapterRoleplayChooser(props: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"ai" | "human" | null>(null);
  const [characters, setCharacters] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [character, setCharacter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState(
    `Chapter ${props.chapterNumber}: ${props.chapterTitle}\n\n${props.content.slice(0, 1000)}`,
  );
  const lock = useRef(false);
  const alive = useRef(true);
  const dialog = useDialogFocus(true, () => {
    if (!lock.current) props.onClose();
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (mode !== "ai") return;
    let current = true;
    void (async () => {
      const { data, error: loadError } = await supabase
        .from("ai_characters")
        .select("user_id,profiles!ai_characters_user_id_fkey(display_name)")
        .limit(100);
      if (!current) return;
      if (loadError) {
        setError(
          "Characters could not be loaded. Try choosing AI Roleplay again.",
        );
        return;
      }
      setCharacters(
        (data || []).map((row) => {
          const profile = Array.isArray(row.profiles)
            ? row.profiles[0]
            : row.profiles;
          return {
            id: row.user_id,
            name: profile?.display_name || "Unnamed character",
          };
        }),
      );
    })();
    return () => {
      current = false;
    };
  }, [mode]);
  const create = async () => {
    if (lock.current || !user || !mode || (mode === "ai" && !character)) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const title = `Roleplay: ${props.storyTitle}`.slice(0, 120);
      const result =
        mode === "ai"
          ? await supabase.rpc("create_chimera_scene", {
              p_bot_ids: [character],
              p_name: title,
              p_canon: context,
            })
          : await supabase.rpc("create_human_roleplay_session", {
              p_title: title,
              p_description: `Inspired by ${props.storyTitle}, chapter ${props.chapterNumber}.`,
              p_setting: context,
              p_lore: "",
              p_rules: "",
              p_objectives: "",
              p_visibility: "private",
              p_max_participants: 2,
            });
      const record = singleRpcRecord<{ id: string }>(result.data);
      if (result.error || !record)
        throw new Error(
          "The room could not be confirmed. Check your rooms before creating another. Your chapter is unchanged.",
        );
      if (alive.current) props.onCreated(mode, record.id);
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Room creation failed. Your chapter is unchanged.",
        );
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-roleplay-title"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-warm-900 dark:bg-warm-900 dark:text-white"
      >
        <h2 id="chapter-roleplay-title" className="text-xl font-bold">
          Step into Roleplay
        </h2>
        <p className="my-3 text-sm">
          Start a separate scene. Your writing and story canon stay unchanged.
        </p>
        <div className="flex flex-wrap gap-2">
          {(["ai", "human"] as const).map((value) => (
            <button
              key={value}
              disabled={busy}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setError("");
              }}
              className="min-h-11 rounded-lg border px-4"
            >
              {value === "ai" ? "AI Roleplay" : "Human Roleplay"}
            </button>
          ))}
        </div>
        {mode === "ai" && (
          <label className="mt-4 block">
            Choose an AI character
            <select
              aria-label="AI character"
              value={character}
              disabled={busy}
              onChange={(event) => setCharacter(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border bg-white p-2 text-black"
            >
              <option value="">Select a character</option>
              {characters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {mode === "human" && (
          <p className="mt-4 text-sm">
            A private Human Roleplay room starts with AI off. Invite people
            after creation. Hybrid participation requires the room’s existing
            consent controls.
          </p>
        )}
        {mode && (
          <label className="mt-4 block">
            Review scene context
            <textarea
              value={context}
              disabled={busy}
              maxLength={2000}
              onChange={(event) => setContext(event.target.value)}
              className="mt-2 h-36 w-full rounded-lg border bg-white p-2 text-black"
            />
            <span className="text-sm">
              Creating the scene approves this context for the new room only. No
              AI writing is generated here.
            </span>
          </label>
        )}
        {!user && <p className="mt-4">Sign in before creating a room.</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            disabled={busy}
            onClick={props.onClose}
            className="min-h-11 rounded-lg border px-4"
          >
            Cancel
          </button>
          <button
            disabled={busy || !user || !mode || (mode === "ai" && !character)}
            onClick={() => void create()}
            className="btn-primary min-h-11 px-4"
          >
            {busy ? "Creating…" : "Create separate scene"}
          </button>
        </div>
      </div>
    </div>
  );
}
