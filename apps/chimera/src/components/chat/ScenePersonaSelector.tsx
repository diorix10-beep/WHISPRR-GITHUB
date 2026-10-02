import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export function ScenePersonaSelector({
  conversationId,
  onChange,
}: {
  conversationId: string;
  onChange?: (id: string | null) => void;
}) {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<
    Array<{ id: string; name: string; is_default: boolean }>
  >([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!user) return;
    void Promise.all([
      supabase
        .from("personas")
        .select("id,name,is_default")
        .eq("user_id", user.id),
      supabase
        .from("conversation_participants")
        .select("persona_id,persona_selected")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([list, participant]) => {
      if (!active) return;
      if (list.error || participant.error) {
        setError("Your scene persona could not be loaded.");
        return;
      }
      setPersonas(list.data || []);
      const id =
        participant.data?.persona_id ||
        (!participant.data?.persona_selected
          ? list.data?.find((p) => p.is_default)?.id
          : null) ||
        "";
      setSelected(id);
      onChange?.(id || null);
    });
    return () => {
      active = false;
    };
  }, [conversationId, user, onChange]);
  const select = async (id: string) => {
    setSaving(true);
    setError("");
    const { error } = await supabase.rpc("set_chimera_scene_persona", {
      p_conversation_id: conversationId,
      p_persona_id: id || null,
    });
    setSaving(false);
    if (error) {
      setError("Your persona could not be saved. Please retry.");
      return;
    }
    setSelected(id);
    onChange?.(id || null);
  };
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold">
        Scene persona
        <select
          aria-label="Scene persona"
          value={selected}
          disabled={saving}
          onChange={(e) => void select(e.target.value)}
          className="ml-2 min-h-11 max-w-48 rounded-lg border bg-transparent px-2"
        >
          <option value="">As yourself</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
