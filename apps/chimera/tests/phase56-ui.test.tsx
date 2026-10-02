// @vitest-environment jsdom
import HumanRoleplayCreatePage from "../src/pages/HumanRoleplayCreatePage";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
const state = vi.hoisted(() => ({
  toast: vi.fn(),
  accept: vi.fn(),
  navigation: vi.fn(),
  rpc: vi.fn(async () => ({data:[{id:"synthetic-room"}],error:null})),
}));
vi.mock("../src/contexts/ToastContext", () => ({
  useToast: () => ({ showToast: state.toast }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => state.navigation }));
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    rpc: state.rpc,
    from: () => ({select: () => ({limit: async () => ({data:[{user_id:"character-id",profiles:{display_name:"Mira"}}],error:null})})}),
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "synthetic-token" } },
      }),
    },
  },
}));
vi.mock("../src/contexts/AuthContext", () => ({useAuth: () => ({user:{id:"alice"}})}));
import { ChapterRoleplayChooser } from "../src/components/writers/ChapterRoleplayChooser";
import { AiCoPilotDrawer } from "../src/components/writers/AiCoPilotDrawer";
const props = {
  storyId: "story",
  chapterId: "chapter",
  isOpen: true,
  onClose: vi.fn(),
  chapterContent: "The human writes a beginning.",
  onInsertText: state.accept,
};
beforeEach(() => {
  state.accept.mockClear();
  state.toast.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ suggestion: "A possible continuation." }),
          { status: 200 },
        ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("optional writing suggestions require preview acceptance and rejection leaves the manuscript unchanged", async () => {
  render(<AiCoPilotDrawer {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("A possible continuation.");
  expect(state.accept).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  expect(state.accept).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Polish Prose" }));
  await screen.findByText("A possible continuation.");
  fireEvent.click(screen.getByRole("button", { name: "Accept and Append" }));
  expect(state.accept).toHaveBeenCalledTimes(1);
  expect(state.accept).toHaveBeenCalledWith("A possible continuation.");
});
it("failed suggestions preserve manuscript and retry the same request identifier", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unavailable" }), { status: 502 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ suggestion: "Retry proposal" }), {
        status: 200,
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  render(<AiCoPilotDrawer {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(state.toast).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("Retry proposal");
  expect(JSON.parse(fetcher.mock.calls[0][1].body).request_id).toBe(
    JSON.parse(fetcher.mock.calls[1][1].body).request_id,
  );
  expect(state.accept).not.toHaveBeenCalled();
});
it("late suggestions from a changed chapter are discarded", async () => {
  let resolve!: (r: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    ),
  );
  const view = render(<AiCoPilotDrawer {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  view.rerender(<AiCoPilotDrawer {...props} chapterId="new-chapter" />);
  resolve(
    new Response(JSON.stringify({ suggestion: "Stale proposal" }), {
      status: 200,
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue" }).hasAttribute("disabled"),
    ).toBe(false),
  );
  expect(screen.queryByText("Stale proposal")).toBeNull();
  expect(state.accept).not.toHaveBeenCalled();
});

it("human room creation navigates to the actual ID from a composite-row RPC array", async () => {
  state.navigation.mockClear();
  render(<HumanRoleplayCreatePage />);
  fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
    target: { value: "A human-created room" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Create private session" }),
  );
  await waitFor(() =>
    expect(state.navigation).toHaveBeenCalledWith(
      "/human-roleplay/synthetic-room",
    ),
  );
});

const chooserProps = {storyTitle:"Story",chapterTitle:"Beginning",chapterNumber:1,content:"Human prose",onClose:vi.fn(),onCreated:vi.fn()};
it("chapter AI entry requires a character and creates a bound scene with approved context",async () => {
 state.rpc.mockClear();chooserProps.onCreated.mockClear();render(<ChapterRoleplayChooser {...chooserProps}/>);
 fireEvent.click(screen.getByRole("button",{name:"AI Roleplay"}));
 expect((screen.getByRole("button",{name:"Create separate scene"}) as HTMLButtonElement).disabled).toBe(true);
 await screen.findByRole("option",{name:"Mira"});
 fireEvent.change(screen.getByLabelText("AI character"),{target:{value:"character-id"}});
 fireEvent.click(screen.getByRole("button",{name:"Create separate scene"}));
 await waitFor(()=>expect(chooserProps.onCreated).toHaveBeenCalledWith("ai","synthetic-room"));
 expect(state.rpc).toHaveBeenCalledWith("create_chimera_scene",expect.objectContaining({p_bot_ids:["character-id"],p_canon:expect.stringContaining("Human prose")}));
});
it("chapter Human entry creates a private room without configuring AI",async () => {
 state.rpc.mockClear();chooserProps.onCreated.mockClear();render(<ChapterRoleplayChooser {...chooserProps}/>);
 fireEvent.click(screen.getByRole("button",{name:"Human Roleplay"}));
 fireEvent.click(screen.getByRole("button",{name:"Create separate scene"}));
 await waitFor(()=>expect(chooserProps.onCreated).toHaveBeenCalledWith("human","synthetic-room"));
 expect(state.rpc).toHaveBeenCalledWith("create_human_roleplay_session",expect.objectContaining({p_visibility:"private",p_setting:expect.stringContaining("Human prose")}));
 expect(state.rpc.mock.calls[0][1]).not.toHaveProperty("p_ai_enabled");
});
