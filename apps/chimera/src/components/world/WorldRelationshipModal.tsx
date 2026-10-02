import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useDialogFocus } from "../../hooks/useDialogFocus";
interface Node {
  id: string;
  title: string;
  kind: string;
  description: string;
}
export function WorldRelationshipModal({
  isOpen,
  onClose,
  worldId,
  characterProfileId,
}: {
  isOpen: boolean;
  onClose: () => void;
  worldId?: string;
  worldName?: string;
  characterProfileId?: string;
}) {
  const ref = useDialogFocus(isOpen, onClose);
  const [title, setTitle] = useState("World connections");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relations, setRelations] = useState<
    Array<{
      id: string;
      source_character_id: string;
      target_character_id: string;
      relationship_type: string;
      description: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    setError("");
    setNodes([]);
    setRelations([]);
    (async () => {
      try {
        let id = worldId;
        if (!id && characterProfileId) {
          const { data, error } = await supabase
            .from("ai_characters")
            .select("world_id")
            .eq("user_id", characterProfileId)
            .maybeSingle();
          if (error) throw error;
          id = data?.world_id;
        }
        if (!id) {
          if (active)
            setError(
              "This character has no linked world. No world or relationships have been invented.",
            );
          return;
        }
        const [
          { data: world, error: worldError },
          { data: chars, error: charError },
          { data: factions, error: factionError },
          { data: links, error: linkError },
          { data: relationships, error: relationError },
          { data: characterLinks, error: characterLinkError },
        ] = await Promise.all([
          supabase
            .from("worlds")
            .select("name,description")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("ai_characters")
            .select(
              "id,short_description,profiles:profiles!ai_characters_user_id_fkey(display_name)",
            )
            .eq("world_id", id)
            .limit(100),
          supabase
            .from("world_factions")
            .select("id,name,description")
            .eq("world_id", id)
            .limit(100),
          supabase
            .from("lorebook_worlds")
            .select("lorebook_id,lorebook:lorebooks(title,description)")
            .eq("world_id", id)
            .limit(100),
          supabase
            .from("character_relationships")
            .select(
              "id,source_character_id,target_character_id,relationship_type,description",
            )
            .eq("world_id", id)
            .limit(200),
          supabase
            .from("world_characters")
            .select(
              "character:ai_characters(id,short_description,profiles:profiles!ai_characters_user_id_fkey(display_name))",
            )
            .eq("world_id", id)
            .limit(100),
        ]);
        if (
          worldError ||
          charError ||
          factionError ||
          linkError ||
          relationError ||
          characterLinkError
        )
          throw new Error("World connections could not be loaded.");
        if (!world)
          throw new Error("The linked world is private or unavailable.");
        if (!active) return;
        type CharacterDefinition = {
          id: string;
          short_description?: string;
          profiles: { display_name: string } | null;
        };
        const linked = (characterLinks || [])
          .map(
            (link) => link.character as unknown as CharacterDefinition | null,
          )
          .filter((c): c is CharacterDefinition => Boolean(c));
        const allCharacters = [
          ...new Map(
            [
              ...((chars as unknown as CharacterDefinition[]) || []),
              ...linked,
            ].map((c) => [c.id, c]),
          ).values(),
        ];
        setTitle(world.name);
        setNodes([
          {
            id,
            kind: "world",
            title: world.name,
            description: world.description || "",
          },
          ...allCharacters.map((c) => ({
            id: c.id,
            kind: "character",
            title:
              (c.profiles as unknown as { display_name: string })
                ?.display_name || "Character",
            description: c.short_description || "",
          })),
          ...(factions || []).map((f) => ({
            id: f.id,
            kind: "faction",
            title: f.name,
            description: f.description || "",
          })),
          ...(links || [])
            .filter((l) => l.lorebook)
            .map((l) => ({
              id: l.lorebook_id,
              kind: "lorebook",
              title: (l.lorebook as unknown as { title: string }).title,
              description:
                (l.lorebook as unknown as { description: string })
                  .description || "",
            })),
        ]);
        setRelations(relationships || []);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Connections are unavailable.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, worldId, characterProfileId]);
  if (!isOpen) return null;
  const names = new Map(nodes.map((n) => [n.id, n.title]));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-network-heading"
        className="bg-white dark:bg-warm-900 rounded-2xl p-5 w-full max-w-3xl max-h-[90dvh] overflow-auto space-y-4"
      >
        <div className="flex justify-between gap-3">
          <h2 id="world-network-heading" className="font-serif text-xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-secondary"
            aria-label="Close world connections"
          >
            Close
          </button>
        </div>
        <p className="text-sm">
          Existing creator-authored world links and relationships visible to
          you. Private lore is not disclosed by this view.
        </p>
        {loading && <p role="status">Loading world connections…</p>}
        {error && <p role="status">{error}</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {nodes.map((n) => (
            <li key={`${n.kind}:${n.id}`} className="border rounded-xl p-3">
              <strong>{n.title}</strong>
              <span className="block text-xs">{n.kind}</span>
              <p className="text-sm whitespace-pre-wrap">{n.description}</p>
            </li>
          ))}
        </ul>
        <h3 className="font-semibold">Character relationships</h3>
        {!loading && !relations.length && (
          <p>
            No visible character relationships have been defined for this world.
          </p>
        )}
        <ul>
          {relations
            .filter(
              (r) =>
                names.has(r.source_character_id) &&
                names.has(r.target_character_id),
            )
            .map((r) => (
              <li key={r.id} className="border-b py-2">
                {names.get(r.source_character_id)} →{" "}
                {names.get(r.target_character_id)}: {r.relationship_type}
                <p className="text-sm">{r.description}</p>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
