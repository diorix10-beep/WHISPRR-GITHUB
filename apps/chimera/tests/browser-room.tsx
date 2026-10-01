// Local visual fixture only. All database/auth operations are synthetic.
// Open /tests/browser-room.html on the local Vite server; never use live accounts.
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import HumanRoleplaySessionPage from "../src/pages/HumanRoleplaySessionPage";
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
    updated_at:"synthetic-revision-1",
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
  ai_characters: [],
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
            : name === "maybeSingle"
              ? async () => result()
              : () => query,
      },
    );
    return query;
  },
  rpc: async (name: string, args: Record<string, unknown>) => {
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
    return { data: {}, error: null };
  },
  channel: () => {
    const channel = { on: () => channel, subscribe: () => channel };
    return channel;
  },
  removeChannel: async () => undefined,
});
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <MemoryRouter initialEntries={["/human-roleplay/synthetic-room"]}>
        <Routes>
          <Route
            path="/human-roleplay/:sessionId"
            element={<HumanRoleplaySessionPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  </ThemeProvider>,
);
