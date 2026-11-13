// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { noteOnline, useNet } from "@/lib/net";
import { useSocial } from "@/lib/social";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { ClubScreen, Friends, InviteScreen, PersonScreen } from "./Friends";
import { SendToFriend } from "./SendToFriend";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

// The app's Friends screens against the real server code (an in-memory database): each fetch to /api/social/
// runs src/server/social.ts as the account whose token it carries.
const accounts: Record<string, string> = { "tok-a": "acc-a", "tok-b": "acc-b" };
function signIn(token: string) {
  const a: Account = { token, id: accounts[token]!, email: null, providers: ["email"], via: "email" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  useSocial.setState({ me: null, error: null });
}

beforeEach(async () => {
  await resetDb();
  localStorage.clear();
  useNet.setState({ busy: 0, offline: false });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const token = String((init.headers as Record<string, string>).Authorization ?? "").replace("Bearer ", "");
    if (url !== "/api/social/" || !accounts[token]) return Response.json({ error: "Not found" }, { status: 404 });
    const r = await handle(accounts[token], JSON.parse(String(init.body)));
    return Response.json(r.body, { status: r.code });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAccount.setState({ account: null });
});

describe("Friends", () => {
  it("asks a signed-out lifter to sign in first", () => {
    render(<Friends />);
    expect(screen.getByText("Train with friends")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("joins with private defaults, then follows someone who approves", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true });
    signIn("tok-a");
    render(<Friends />);
    await u.type(await screen.findByLabelText("Handle"), "alex");
    await u.type(screen.getByLabelText("Name friends see"), "Alex");
    expect(screen.getByRole("switch", { name: "Anyone can follow me" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Post every workout" })).toHaveAttribute("aria-checked", "false");
    await u.click(screen.getByRole("button", { name: "Agree and join" }));
    expect(await screen.findByText("No workouts yet")).toBeInTheDocument();
    cleanup();

    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Ask to follow" }));
    expect(await screen.findByRole("button", { name: "Requested · Cancel" })).toBeInTheDocument();
    expect(screen.getByText("Your request is waiting for an answer.")).toBeInTheDocument();
    cleanup();

    signIn("tok-b");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /People/ }));
    await u.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Accept" })).toBeNull());
    expect(await screen.findByText("@alex")).toBeInTheDocument();
  });

  it("reports a profile from its menu", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Block or report Blair" }));
    await u.click(screen.getByRole("button", { name: "Report profile" }));
    await u.click(screen.getByRole("button", { name: "Spam or scam" }));
    await u.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByText("Thanks. We’ll take a look.")).toBeInTheDocument();
  });

  it("rings the bell for someone the lifter follows, and silences it again", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    // No bell before following: there's nothing to be told about yet.
    await u.click(await screen.findByRole("button", { name: "Follow" }));
    const bell = await screen.findByRole("button", { name: "Get alerts when Blair posts" });
    expect(bell).toHaveAttribute("aria-pressed", "false");
    await u.click(bell);
    expect(await screen.findByText("You’ll get a notification when Blair posts a workout.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Stop alerts when Blair posts" }));
    await waitFor(() => expect(screen.queryByText("You’ll get a notification when Blair posts a workout.")).toBeNull());
  });

  it("sends a routine to a friend, who finds it in Activity", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true, open: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    await handle("acc-b", { op: "follow", handle: "alex" });
    signIn("tok-a");
    useSocial.setState({
      me: {
        profile: {
          handle: "alex",
          name: "Alex",
          open: true,
          autoPost: false,
          weights: true,
          public: false,
          push: { follows: true, comments: true, sent: true, likes: false, cheers: true, posts: true },
          avatar: "",
          audience: "all",
          showLifts: true,
          lifts: [],
          suggest: true,
          live: false,
          cheers: true,
          level: 0,
          streak: 0,
        },
      },
    });
    render(<SendToFriend name="Leg day" items={[{ exerciseId: "back-squat", sets: 4 }]} />);
    await u.click(screen.getByRole("button", { name: "Send to a friend" }));
    await u.click(await screen.findByRole("button", { name: "Send to Blair" }));
    expect(await screen.findByText("Sent to Blair.")).toBeInTheDocument();
    cleanup();

    signIn("tok-b");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /Activity/ }));
    expect(await screen.findByText("Alex sent you a workout: Leg day")).toBeInTheDocument();
  });

  it("edits a post's caption and audience, and offers to save a friend's workout as a routine", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-a", {
      op: "post",
      workoutId: "s1",
      at: Date.now() - 3_600_000,
      body: {
        seconds: 3000,
        sets: 5,
        volume: null,
        prs: 0,
        muscles: [],
        exercises: [{ id: "back-squat", name: "", sets: 5, w: null, r: 5 }],
      },
    });
    signIn("tok-a");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /^See Alex’s whole workout/ }));
    expect(await screen.findByRole("button", { name: "Do this workout" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Close" }));
    await u.click(screen.getByRole("button", { name: "More options" }));
    await u.click(screen.getByRole("button", { name: "Edit post" }));
    await u.type(screen.getByLabelText("Caption"), "Felt strong");
    await u.click(screen.getByRole("button", { name: "Only me" }));
    expect(screen.getByText("Just for you: it stays on your profile, hidden from everyone else.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Felt strong")).toBeInTheDocument();
    expect(screen.getByText(/· Only me/)).toBeInTheDocument();
  });

  it("mutes someone from their profile's menu", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Block or report Blair" }));
    await u.click(screen.getByRole("button", { name: "Mute" }));
    expect(await screen.findByText("Muted: their workouts don’t show in your feed.")).toBeInTheDocument();
  });

  it("invites a friend who joins from the link, and both show on the board", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    const code = (await handle("acc-a", { op: "invite" })).body.code as string;
    signIn("tok-b");
    render(<InviteScreen code={code} />);
    expect(await screen.findByText("Alex invited you")).toBeInTheDocument();
    await u.type(await screen.findByLabelText("Handle"), "blair");
    await u.click(screen.getByRole("button", { name: "Agree and join" }));
    await waitFor(async () =>
      expect((await handle("acc-b", { op: "people", list: "friends" })).body.people).toMatchObject([{ handle: "alex" }]),
    );
    cleanup();

    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: "Board" }));
    expect(await within(await screen.findByRole("list", { name: "Friends leaderboard" })).findByText("blair (you)")).toBeInTheDocument();
    expect(screen.getByText("Post a workout to get on this week’s board.")).toBeInTheDocument();
    // The same people on this month's challenge, for everyone.
    expect(
      await within(await screen.findByRole("list", { name: "Friends on this month’s challenge" })).findByText("blair (you)"),
    ).toBeInTheDocument();
  });
  it("shows a finished challenge's result once, with a share and a rematch with the same friends", async () => {
    const u = userEvent.setup();
    const then = Date.now() - 20 * 86_400_000;
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true, open: true }, then);
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true }, then);
    await handle("acc-a", { op: "follow", handle: "blair" }, then);
    await handle("acc-b", { op: "follow", handle: "alex" }, then);
    const made = await handle(
      "acc-a",
      { op: "challengeCreate", name: "Most workouts", metric: "workouts", days: 14, handles: ["blair"] },
      then,
    );
    const ch = String(made.body.id);
    await handle("acc-b", { op: "challengeAnswer", id: ch, accept: true }, then);
    const post = (who: string, w: string) =>
      handle(
        who,
        {
          op: "post",
          workoutId: w,
          at: then + 3_600_000,
          body: { seconds: 3000, sets: 10, volume: 0, prs: 0, muscles: [], exercises: [{ id: "bench-press", sets: 3, w: 60, r: 8 }] },
        },
        then + 7_200_000,
      );
    await post("acc-a", "w1");
    await post("acc-a", "w2");
    await post("acc-b", "w3");
    signIn("tok-a");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: "Board" }));
    const sheet = within(await screen.findByRole("dialog"));
    expect(sheet.getByText("You won!")).toBeInTheDocument();
    expect(sheet.getByText("Your total: 2 workouts")).toBeInTheDocument();
    await u.click(sheet.getByRole("button", { name: "Start a rematch" }));
    const start = within(await screen.findByRole("dialog"));
    expect(start.getByRole("button", { name: "2 weeks" })).toHaveAttribute("aria-pressed", "true");
    expect(await start.findByRole("button", { name: "Blair" })).toHaveAttribute("aria-pressed", "true");
    cleanup();

    // Seen once on this device: opening the board again doesn't pop it up, but Results does.
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: "Board" }));
    await u.click(await screen.findByRole("button", { name: "Results" }));
    expect(await screen.findByText("You won!")).toBeInTheDocument();
  });

  it("discovers a public profile's workout and opens it to follow", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-b", { op: "update", public: true });
    await handle("acc-b", {
      op: "post",
      workoutId: "w1",
      at: Date.now() - 3_600_000,
      caption: "Leg day",
      body: { seconds: 3000, sets: 10, volume: 0, prs: 0, muscles: [], exercises: [{ id: "bench-press", sets: 3, w: 60, r: 8 }] },
    });
    signIn("tok-a");
    render(<Friends />);
    expect(await screen.findByText("No workouts yet")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Discover" }));
    expect(await screen.findByText("Leg day")).toBeInTheDocument();
    await u.click(screen.getAllByRole("button", { name: /Blair/ })[0]!);
    await waitFor(() => expect(location.hash).toBe("#/person/blair"));
  });

  it("opens with one request, and shows the last feed at once when opened again", async () => {
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    await handle("acc-b", { op: "follow", handle: "alex" });
    await handle("acc-a", { op: "answer", handle: "blair", accept: true });
    await handle("acc-b", {
      op: "post",
      workoutId: "w1",
      at: Date.now() - 3_600_000,
      caption: "Pull day",
      body: { seconds: 3000, sets: 10, volume: 0, prs: 0, muscles: [], exercises: [{ id: "bench-press", sets: 3, w: 60, r: 8 }] },
    });
    const ops: string[] = [];
    const real = fetch;
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      ops.push(String((JSON.parse(String(init.body)) as { op: string }).op));
      return real(url, init);
    });
    signIn("tok-a");
    const first = render(<Friends />);
    expect(await screen.findByText("Pull day")).toBeInTheDocument();
    // The whole tab (own state, feed, training now, suggestions) came in the one "home" request.
    await new Promise((r) => setTimeout(r, 50));
    expect(ops.filter((o) => o !== "update")).toEqual(["home"]);
    first.unmount();

    // Back on the tab, even offline, the feed is there at once.
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")));
    useSocial.setState({ me: null });
    render(<Friends />);
    expect(screen.getByText("Pull day")).toBeInTheDocument();
    await waitFor(() => expect(useSocial.getState().loading).toBe(false));
    expect(screen.getByText("Pull day")).toBeInTheDocument();
    // …with a note at the top saying it's the last copy, gone once a request gets through.
    expect(screen.getByText(/You’re offline/)).toBeInTheDocument();
    act(() => noteOnline());
    expect(screen.queryByText(/You’re offline/)).toBeNull();
  });

  it("starts a challenge that a friend joins, and tags a training partner on a post", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true, open: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    await handle("acc-b", { op: "follow", handle: "alex" });
    signIn("tok-a");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: "Board" }));
    expect(await screen.findByText(/No challenges yet/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Start a challenge" }));
    const sheet = within(screen.getByRole("dialog"));
    await u.click(sheet.getByRole("button", { name: "Sets" }));
    await u.click(sheet.getByRole("button", { name: "2 weeks" }));
    await u.click(await sheet.findByRole("button", { name: "Blair" }));
    await u.click(sheet.getByRole("button", { name: "Start" }));
    expect(await screen.findByText("Most sets")).toBeInTheDocument();
    expect(screen.getByText("1 invite not answered yet")).toBeInTheDocument();
    cleanup();

    signIn("tok-b");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /Activity/ }));
    await u.click(await screen.findByText("Alex challenged you: Most sets"));
    expect(await screen.findByText("Alex invited you to this challenge.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Join" }));
    // Blair shows on the challenge, and on the weekly board too once that has loaded, so there can be two.
    expect((await screen.findAllByText("Blair (you)")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument();
    cleanup();

    await handle("acc-b", {
      op: "post",
      workoutId: "b1",
      at: Date.now() - 3_600_000,
      partners: ["alex"],
      body: {
        seconds: 3000,
        sets: 5,
        volume: null,
        prs: 0,
        muscles: [],
        exercises: [{ id: "back-squat", name: "", sets: 5, w: null, r: 5 }],
      },
    });
    signIn("tok-a");
    render(<Friends />);
    expect(await screen.findByText("with Alex")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "More options" }));
    await u.click(screen.getByRole("button", { name: "Remove me from this post" }));
    await waitFor(() => expect(screen.queryByText("with Alex")).toBeNull());
  });
  it("starts a club, and someone joins it from its link and sees the week's board", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true });
    signIn("tok-a");
    render(<Friends tab="clubs" />);
    expect(await screen.findByText("No clubs yet")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Start a club" }));
    await u.type(screen.getByLabelText("Club name"), "Iron Barn crew");
    await u.click(screen.getByRole("button", { name: "Start the club" }));
    const sheet = within(await screen.findByRole("dialog", { name: "Iron Barn crew" }));
    expect(await sheet.findByText("Alex (you)")).toBeInTheDocument();
    cleanup();

    const [club] = (await handle("acc-a", { op: "clubs" })).body.clubs as { id: string }[];
    const { code } = (await handle("acc-a", { op: "club", id: club!.id, from: Date.now() - 86_400_000 })).body.club as { code: string };
    signIn("tok-b");
    render(<ClubScreen code={code} />);
    expect(await screen.findByText("Iron Barn crew")).toBeInTheDocument();
    expect(screen.getByText("1 member · run by Alex")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Join the club" }));
    await waitFor(async () => expect(((await handle("acc-b", { op: "clubs" })).body.clubs as unknown[]).length).toBe(1));
  });
  it("lets the starter set a crew goal with − and +, shows everyone's progress, and the club's posts", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-b", { op: "update", public: true });
    const { code } = (await handle("acc-a", { op: "clubCreate", name: "Iron Barn crew" })).body as { code: string };
    await handle("acc-b", { op: "clubJoin", code });
    await handle("acc-b", {
      op: "post",
      workoutId: "w1",
      at: Date.now() - 60_000,
      body: {
        seconds: 3000,
        sets: 12,
        volume: 4200,
        prs: 0,
        muscles: ["chest"],
        exercises: [{ id: "bench", name: "Bench", sets: 4, w: 100, r: 5 }],
      },
    });
    signIn("tok-a");
    render(<Friends tab="clubs" />);
    await u.click(await screen.findByRole("button", { name: /Iron Barn crew/ }));
    const sheet = within(await screen.findByRole("dialog", { name: "Iron Barn crew" }));
    await u.click(await sheet.findByRole("button", { name: "Set a crew goal" }));
    // Two members, three workouts each to start; one tap of − makes it five.
    expect(sheet.getByText("6 workouts")).toBeInTheDocument();
    await u.click(sheet.getByRole("button", { name: "Less weekly target" }));
    await u.click(sheet.getByRole("button", { name: "Save goal" }));
    expect(await sheet.findByText("This week as a crew: 5 workouts")).toBeInTheDocument();
    expect(sheet.getByText("4 workouts to go as a crew. You’ve put in 0 workouts.")).toBeInTheDocument();
    await u.click(sheet.getByRole("button", { name: "Posts" }));
    expect(await sheet.findByRole("article", { name: "Workout from Blair" })).toBeInTheDocument();
  });
});
