import { useEffect, useState } from "react";
import type { Profile } from "../../types";
import { supabase } from "../../lib/supabase";
import type { ContinuitySource, ScopedFact } from "../../lib/continuity";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: Profile;
  conversationId?: string;
}
type Recall = {
  canon: string;
  recentSources: Array<{ id: string; excerpt: string }>;
  lore: Array<{ id: string; title: string; content: string }>;
  personaRelationships: string;
  memories: ScopedFact[];
  sources: ContinuitySource[];
  relationships: Array<{
    id: string;
    relationship_type: string;
    description: string;
  }>;
  scope: { persona_id: string | null };
};
export function ChatMemoryModal({
  isOpen,
  onClose,
  character,
  conversationId,
}: Props) {
  const [recall, setRecall] = useState<Recall | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fact, setFact] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!isOpen || !conversationId) return;
    let active = true;
    setLoading(true);
    setError("");
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const res = await fetch("/api/scene-recall", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session?.access_token || ""}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            bot_user_id: character.user_id,
          }),
        });
        if (!res.ok)
          throw new Error("Scene recall could not be loaded. Please retry.");
        const value = await res.json();
        if (active) setRecall(value);
      })
      .catch(() => {
        if (active)
          setError("Scene recall could not be loaded. Please reopen to retry.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, conversationId, character.user_id]);
  const propose = async () => {
    if (!source || !fact.trim()) return;
    setSaving(true);
    setError("");
    const { data: definition } = await supabase
      .from("ai_characters")
      .select("id")
      .eq("user_id", character.user_id)
      .maybeSingle();
    const { error } = await supabase.rpc("propose_chimera_memory", {
      p_conversation_id: conversationId,
      p_character_id: definition?.id,
      p_content: fact,
      p_source_ids: [source],
      p_memory_type: "long_term",
    });
    setSaving(false);
    if (error) {
      setError("The fact could not be proposed. Your text is still here.");
      return;
    }
    setFact("");
    setError(
      "Proposal saved. Approve it in the private memory cabinet before it can be recalled.",
    );
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Scene recall"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 text-warm-900 dark:bg-warm-950 dark:text-warm-100"
      >
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">Scene recall</h2>
          <button className="min-h-11 px-3" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-2 text-sm">
          Context selected now. Source excerpts support continuity; only your
          approved facts are durable canon. Private facts stay with your persona
          and scope.
        </p>
        {loading && <p role="status">Loading recall…</p>}
        {error && (
          <p role="status" className="mt-3 text-sm">
            {error}
          </p>
        )}
        {recall && (
          <div className="space-y-5 mt-4">
            <section>
              <h3 className="font-bold">Creator-controlled scene canon</h3>
              <p className="whitespace-pre-wrap">
                {recall.canon || "No scene canon yet."}
              </p>
            </section>
            <section>
              <h3 className="font-bold">Approved private facts</h3>
              {recall.memories.map((m) => (
                <p key={m.id} className="mt-2">
                  [{m.memory_type}] {m.content}
                </p>
              ))}
              {!recall.memories.length && (
                <p>No approved facts in this scope.</p>
              )}
            </section>
            <section>
              <h3 className="font-bold">Earlier source excerpts</h3>
              {recall.sources.map((s) => (
                <details key={s.id} className="mt-2">
                  <summary className="min-h-11 cursor-pointer">
                    {s.excerpt.slice(0, 90)}
                  </summary>
                  <p className="whitespace-pre-wrap">{s.excerpt}</p>
                  <small>Source: {s.id}</small>
                </details>
              ))}
            </section>
            <section>
              <h3 className="font-bold">Linked lore selected now</h3>
              {(recall.lore || []).map((entry) => (
                <details key={entry.id}>
                  <summary className="min-h-11 cursor-pointer">
                    {entry.title}
                  </summary>
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                </details>
              ))}
              <p className="whitespace-pre-wrap">
                {recall.personaRelationships}
              </p>
            </section>
            <section>
              <h3 className="font-bold">Character relationships</h3>
              {recall.relationships.map((r) => (
                <p key={r.id}>
                  {r.relationship_type}: {r.description}
                </p>
              ))}
            </section>
            <section className="border-t pt-4">
              <h3 className="font-bold">Propose a durable fact</h3>
              <p className="text-sm">
                Edit the wording, choose its source, then approve separately in
                the memory cabinet.
              </p>
              <label className="block mt-2">
                Source
                <select
                  className="block w-full min-h-11 border rounded bg-transparent"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">Choose a source turn</option>
                  {[...(recall.recentSources || []), ...recall.sources].map(
                    (s) => (
                      <option key={s.id} value={s.id}>
                        {s.excerpt.slice(0, 80)}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <textarea
                aria-label="Proposed fact"
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                maxLength={4000}
                className="mt-2 w-full rounded border bg-transparent p-2"
              />
              <button
                className="min-h-11 px-3 rounded bg-purple-600 text-white disabled:opacity-50"
                disabled={saving || !source || !fact.trim()}
                onClick={() => void propose()}
              >
                Save for approval
              </button>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
