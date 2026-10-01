import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  clearSavedDraft,
  draftKey,
  draftMatches,
  readDraft,
  writeDraft,
  type DraftRecord,
} from "../../lib/draftJournal";
interface Entity {
  id: string;
  name: string;
  description?: string;
}
interface Layout {
  positions: Record<string, { x: number; y: number }>;
  connections: Array<{
    id: string;
    fromId: string;
    toId: string;
    label?: string;
  }>;
}
const empty: Layout = { positions: {}, connections: [] };
function validLayout(value: unknown): value is Layout {
  if (!value || typeof value !== "object") return false;
  const v = value as Layout;
  return (
    !!v.positions &&
    typeof v.positions === "object" &&
    !Array.isArray(v.positions) &&
    Object.values(v.positions).every(
      (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y),
    ) &&
    Array.isArray(v.connections) &&
    v.connections.every(
      (c) =>
        typeof c.id === "string" &&
        typeof c.fromId === "string" &&
        typeof c.toId === "string",
    )
  );
}
export function WorldCanvasTab({
  worldId,
  locations = [],
  factions = [],
}: {
  worldId: string;
  locations?: Entity[];
  factions?: Entity[];
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const key = user ? draftKey(user.id, "world-canvas", worldId) : null;
  const [layout, setLayout] = useState<Layout>(empty);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [editable, setEditable] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recovery, setRecovery] = useState<DraftRecord<Layout> | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");
  const live = useRef(layout);
  live.current = layout;
  const lock = useRef(false);
  const scope = useRef(key);
  scope.current = key;
  const entities = [...locations, ...factions];
  const names = new Map(entities.map((e) => [e.id, e.name]));
  useEffect(() => {
    let active = true;
    setReady(false);
    setDirty(false);
    setRecovery(null);
    (async () => {
      try {
        const [{ data, error }, { data: permission }] = await Promise.all([
          supabase
            .from("worlds")
            .select("canvas_layout,canvas_revision")
            .eq("id", worldId)
            .single(),
          supabase.rpc("can_access_chimera_project", {
            p_type: "world",
            p_id: worldId,
            p_edit: true,
          }),
        ]);
        if (error) throw error;
        if (!active) return;
        const next = validLayout(data.canvas_layout)
          ? data.canvas_layout
          : empty;
        setLayout(next);
        setRevision(Number(data.canvas_revision));
        setEditable(Boolean(permission));
        const draft = key ? readDraft<Layout>(key) : null;
        if (draft && validLayout(draft.value) && !draftMatches(draft, next))
          setRecovery(draft);
        setReady(true);
      } catch {
        if (active)
          showToast(
            "World map is unavailable. Existing entities are unchanged.",
            "error",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [worldId, key, showToast]);
  useEffect(() => {
    if (
      ready &&
      dirty &&
      editable &&
      key &&
      !writeDraft(key, layout, String(revision))
    )
      showToast(
        "Browser draft storage is unavailable. Save or copy your map before leaving.",
        "error",
      );
  }, [layout, dirty, editable, key, ready, revision, showToast]);
  const change = (next: Layout) => {
    setLayout(next);
    setDirty(true);
  };
  const save = async () => {
    if (!key || lock.current || !ready || recovery || !editable) return;
    lock.current = true;
    setSaving(true);
    const submitted = layout,
      requestScope = key;
    try {
      const { data, error } = await supabase.rpc("save_chimera_world_canvas", {
        p_world_id: worldId,
        p_expected_revision: revision,
        p_layout: submitted,
      });
      if (error) throw error;
      if (scope.current !== requestScope) return;
      setRevision(Number(data));
      clearSavedDraft(requestScope, submitted);
      if (JSON.stringify(live.current) === JSON.stringify(submitted))
        setDirty(false);
      showToast("World map saved.", "success");
    } catch {
      if (scope.current === requestScope)
        showToast(
          "Map was not saved. Your local draft is preserved; compare the latest world before retrying.",
          "error",
        );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  if (!ready) return <p role="status">Loading world map…</p>;
  return (
    <section aria-label="Persistent world map" className="space-y-4">
      <p className="text-sm text-warm-500">
        Map your existing locations and factions. Connections are creator notes.
        Removing a placement preserves the world entity.
      </p>
      {recovery && (
        <div role="status" className="border rounded-xl p-3 space-x-3">
          <p>
            A local map draft is available. Compare it with the server map
            before saving.
          </p>
          <button
            className="btn-secondary"
            onClick={() => {
              change(recovery.value);
              setRecovery(null);
            }}
          >
            Restore local map
          </button>
          <button className="btn-secondary" onClick={() => setRecovery(null)}>
            Keep server map
          </button>
        </div>
      )}
      <button
        className="btn-primary"
        disabled={!editable || saving || !dirty || !!recovery}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save map"}
      </button>
      {!entities.length && (
        <p>Add locations or factions in their tabs to place them here.</p>
      )}
      {Object.keys(layout.positions)
        .filter((id) => !names.has(id))
        .map((id) => (
          <div key={id} className="border rounded-xl p-3">
            <p>An entity previously placed here is no longer available.</p>
            <button
              className="btn-secondary"
              disabled={!editable}
              onClick={() => {
                const positions = { ...layout.positions };
                delete positions[id];
                change({
                  positions,
                  connections: layout.connections.filter(
                    (edge) => edge.fromId !== id && edge.toId !== id,
                  ),
                });
              }}
            >
              Remove unavailable placement
            </button>
          </div>
        ))}
      <div className="grid gap-3 sm:grid-cols-2">
        {entities.map((entity) => {
          const point = layout.positions[entity.id];
          return (
            <div key={entity.id} className="border rounded-xl p-3 space-y-2">
              <strong>{entity.name}</strong>
              <p className="text-sm line-clamp-2">{entity.description}</p>
              {point ? (
                <>
                  <div className="flex gap-2">
                    {(["x", "y"] as const).map((axis) => (
                      <label key={axis} className="text-sm flex-1">
                        {axis.toUpperCase()}
                        <input
                          className="input-field w-full"
                          type="number"
                          min={0}
                          max={2000}
                          aria-label={`${entity.name} ${axis} position`}
                          disabled={!editable}
                          value={point[axis]}
                          onChange={(e) => {
                            const number = Number(e.target.value);
                            if (Number.isFinite(number))
                              change({
                                ...layout,
                                positions: {
                                  ...layout.positions,
                                  [entity.id]: {
                                    ...point,
                                    [axis]: Math.max(0, Math.min(2000, number)),
                                  },
                                },
                              });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    disabled={!editable}
                    className="btn-secondary"
                    onClick={() => {
                      const positions = { ...layout.positions };
                      delete positions[entity.id];
                      change({
                        positions,
                        connections: layout.connections.filter(
                          (c) => c.fromId !== entity.id && c.toId !== entity.id,
                        ),
                      });
                    }}
                  >
                    Remove from map
                  </button>
                </>
              ) : (
                <button
                  className="btn-secondary"
                  disabled={!editable}
                  onClick={() =>
                    change({
                      ...layout,
                      positions: {
                        ...layout.positions,
                        [entity.id]: { x: 100, y: 100 },
                      },
                    })
                  }
                >
                  Place on map
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div
        className="overflow-auto border rounded-xl"
        aria-label="World map visual preview"
      >
        <svg
          viewBox="0 0 2200 2200"
          className="w-full min-w-[280px] max-h-[450px]"
          role="img"
          aria-label="Positions and connections of world locations and factions"
        >
          <title>
            World map; coordinates and relationships are also available in the
            controls below.
          </title>
          {layout.connections.map((c) => {
            const a = layout.positions[c.fromId],
              b = layout.positions[c.toId];
            return a && b ? (
              <g key={c.id}>
                <line
                  x1={a.x + 70}
                  y1={a.y + 30}
                  x2={b.x + 70}
                  y2={b.y + 30}
                  stroke="currentColor"
                  strokeWidth={4}
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2}
                  fill="currentColor"
                  fontSize={24}
                >
                  {c.label}
                </text>
              </g>
            ) : null;
          })}
          {Object.entries(layout.positions).map(([id, p]) => (
            <g key={id}>
              <rect
                x={p.x}
                y={p.y}
                width={170}
                height={75}
                fill="#7c3aed"
                rx={15}
              />
              <text x={p.x + 10} y={p.y + 40} fill="white" fontSize={22}>
                {(names.get(id) || "Unavailable entity").slice(0, 16)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <fieldset disabled={!editable} className="grid gap-2 sm:grid-cols-3">
        <legend className="font-semibold">Connect placed entities</legend>
        <label>
          From
          <select
            className="input-field"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">Choose source</option>
            {Object.keys(layout.positions).map((id) => (
              <option key={id} value={id}>
                {names.get(id) || "Unavailable entity"}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select
            className="input-field"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            <option value="">Choose destination</option>
            {Object.keys(layout.positions).map((id) => (
              <option key={id} value={id}>
                {names.get(id) || "Unavailable entity"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Relationship label
          <input
            className="input-field"
            maxLength={200}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <button
          className="btn-secondary"
          disabled={!from || !to || from === to}
          onClick={() => {
            change({
              ...layout,
              connections: [
                ...layout.connections,
                { id: crypto.randomUUID(), fromId: from, toId: to, label },
              ],
            });
            setLabel("");
          }}
        >
          Add connection
        </button>
      </fieldset>
      <ul>
        {layout.connections.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
            {names.get(c.fromId) || "Unavailable entity"} →{" "}
            {names.get(c.toId) || "Unavailable entity"}: {c.label}
            <button
              disabled={!editable}
              className="btn-secondary"
              aria-label={`Remove connection ${c.label || ""}`}
              onClick={() =>
                change({
                  ...layout,
                  connections: layout.connections.filter(
                    (edge) => edge.id !== c.id,
                  ),
                })
              }
            >
              Remove connection
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
