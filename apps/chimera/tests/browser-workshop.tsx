// Local visual fixture only. All database/auth operations are synthetic.
// Open /tests/browser-workshop.html on the local Vite server; never use live accounts.
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import { useState } from "react";
import { WorldCanvasTab } from "../src/components/world/WorldCanvasTab";
import { ChapterRoleplayChooser } from "../src/components/writers/ChapterRoleplayChooser";
import { AiCoPilotDrawer } from "../src/components/writers/AiCoPilotDrawer";
import { ToastProvider } from "../src/contexts/ToastContext";
import "../src/index.css";
const user = { id: "synthetic-browser-alice", email: "alice@example.invalid" };
const turns: Record<string, unknown>[] = [
  {
    id: "first-turn",
    sender_id: user.id,
    content: "Mira opens the observatory and waits for the other creators.",
    author_kind: "human",
    message_type: "narration",
    sequence_number: 1,
    profiles: { display_name: "Alice" },
  },
];
const database: Record<string, unknown> = {
  profiles: {
    user_id: user.id,
    display_name: "Alice",
    role: "user",
    access_level: "full",
  },
  human_roleplay_sessions: {
    id: "synthetic-room",
    creator_id: user.id,
    title: "The Observatory",
    description:
      "An entirely synthetic room for desktop and mobile verification.",
    status: "active",
    updated_at: "synthetic-revision-1",
    ai_enabled: false,
    ai_policy: "host",
    turn_user_id: null,
    setting: "A library above the clouds",
    lore: "Creators decide what becomes canon.",
    rules: "Respect each participant’s agency.",
    objectives: "Discover the next constellation.",
  },
  human_roleplay_participants: [
    {
      id: "synthetic-member",
      user_id: user.id,
      status: "accepted",
      ai_opt_in: false,
      persona_id: null,
      profile: { display_name: "Alice" },
    },
  ],
  human_roleplay_characters: [
    {
      id: "mira",
      owner_id: user.id,
      name: "Mira",
      description: "An astronomer",
      ai_character_id: null,
    },
  ],
  human_roleplay_messages: turns,
  personas: [{ id: "mira-persona", name: "Mira" }],
  ai_characters: [{user_id:"mira",profiles:{display_name:"Mira"}}],
  worlds: {
    canvas_layout: { positions: {}, connections: [] },
    canvas_revision: 0,
  },
};
Object.assign(supabase.auth, {
  getSession: async () => ({
    data: { session: { user, access_token: "synthetic-browser-token" } },
  }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
});
Object.assign(supabase, {
  from: (table: string) => {
    const result = () => ({ data: database[table] ?? [], error: null });
    let query: unknown;
    query = new Proxy(
      {},
      {
        get: (_, name) =>
          name === "then"
            ? (resolve: (value: unknown) => void) =>
                Promise.resolve(result()).then(resolve)
            : name === "maybeSingle" || name === "single"
              ? async () => result()
              : () => query,
      },
    );
    return query;
  },
  rpc: async (name: string, args: Record<string, unknown>) => {
    if (name === "can_access_chimera_project")
      return { data: true, error: null };
    if (name === "save_chimera_world_canvas") return { data: 1, error: null };
    if (
      name === "send_human_roleplay_message" &&
      !turns.some((t) => t.id === args.p_request_id)
    )
      turns.push({
        id: args.p_request_id,
        sender_id: user.id,
        content: args.p_content,
        message_type: args.p_type,
        author_kind: "human",
        sequence_number: turns.length + 1,
        profiles: { display_name: "Alice" },
      });
    if (name === "create_chimera_scene" || name === "create_human_roleplay_session") return {data:[{id:"synthetic-created-room"}],error:null};
    return { data: {}, error: null };
  },
  channel: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  },
  removeChannel: async () => undefined,
});

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) =>
  String(input) === "/api/writing-suggestions"
    ? new Response(
        JSON.stringify({
          suggestion:
            "An optional proposal. The author decides what happens next.",
        }),
        { status: 200 },
      )
    : nativeFetch(input, init);
function Workshop() {
  const [chooser, setChooser] = useState(false);
  const [created, setCreated] = useState("");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("The human writes the first scene.");
  return (
    <main className="max-w-4xl mx-auto p-4 space-y-5">
      <h1 className="text-2xl">CHIMERA creative workshop</h1>
      <label className="block">
        Human-authored draft
        <textarea
          className="input-field w-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Optional writing assistant
      </button>
      <AiCoPilotDrawer
        storyId="synthetic-story"
        chapterId="synthetic-chapter"
        isOpen={open}
        onClose={() => setOpen(false)}
        chapterContent={text}
        onInsertText={(s) => setText((old) => old + "\n\n" + s)}
      />
      <button className="btn-primary" onClick={()=>setChooser(true)}>Step into Roleplay</button>
      {created && <p role="status">{created}</p>}
      {chooser && <ChapterRoleplayChooser storyTitle="Synthetic story" chapterTitle="Beginning" chapterNumber={1} content={text} onClose={()=>setChooser(false)} onCreated={(mode)=>{setCreated(`Created ${mode} room`);setChooser(false);}}/>}
      <WorldCanvasTab
        worldId="synthetic-world"
        locations={[
          {
            id: "place",
            name: "Observatory",
            description: "A creator-defined location.",
          },
        ]}
        factions={[
          {
            id: "faction",
            name: "Astronomers",
            description: "A creator-defined faction.",
          },
        ]}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <Workshop />
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>,
);
