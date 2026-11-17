import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { BoardsProvider } from "../board/BoardsProvider";
import AppRoutes from "../routes/AppRoutes";
import { deckAddress } from "../routes/deckAddress";

// No test reaches Convex or Clerk: each test sets whether the learner is
// signed in, to both alike, the decks the list query gives, and what the
// deck's own query gives for an id: a deck, null, or undefined while loading.
// Each mutation sent is kept in `sent` by its function's name, and resolves
// with what `reply` gives for that name. Convex's client reports `inflight`
// mutations in flight, none unless a test sets it through `reportInflight`.
const learner = vi.hoisted(() => ({
  signedIn: true,
  decks: [] as Deck[] | undefined,
  deck: (() => undefined) as (id: string) => Deck | null | undefined,
  sent: [] as { name: string; args: unknown }[],
  reply: (() => Promise.resolve(null)) as (name: string) => Promise<unknown>,
  inflight: 0,
  listeners: new Set<() => void>(),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { useSyncExternalStore } = await import("react");
  const mutation = (name: string) =>
    Object.assign(
      (args: unknown) => {
        learner.sent.push({ name, args });
        return learner.reply(name);
      },
      {
        withOptimisticUpdate() {
          return mutation(name);
        },
      },
    );
  return {
    useConvexAuth: () => ({
      isLoading: false,
      isAuthenticated: learner.signedIn,
    }),
    useQuery: (query: never, args?: unknown) => {
      if (args === "skip") return undefined;
      const name = getFunctionName(query);
      if (name === "decks:list") return learner.decks;
      if (name === "decks:get")
        return learner.deck((args as { id: string }).id);
      return undefined;
    },
    useMutation: (fn: never) => mutation(getFunctionName(fn)),
    useConvexConnectionState: () => ({
      inflightMutations: useSyncExternalStore(
        (listener) => {
          learner.listeners.add(listener);
          return () => learner.listeners.delete(listener);
        },
        () => learner.inflight,
      ),
    }),
  };
});

/** Has Convex's client report `count` mutations in flight. */
function reportInflight(count: number) {
  learner.inflight = count;
  act(() => learner.listeners.forEach((listener) => listener()));
}

const clerk = vi.hoisted(() => ({ openSignIn: vi.fn() }));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: learner.signedIn }),
  useUser: () => ({
    user: learner.signedIn
      ? {
          hasImage: false,
          imageUrl: "",
          primaryEmailAddress: { emailAddress: "sam@example.com" },
        }
      : null,
  }),
  useClerk: () => ({
    openSignIn: clerk.openSignIn,
    closeSignIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const animals: Deck = {
  id: "3f2b8c1e-9a4d-4e6f-8b21-0c5d7e9fa1b3",
  name: "Animals",
  dimensions: [
    {
      id: "d1",
      name: "Habitat",
      categories: [
        { id: "c1", name: "Ocean" },
        { id: "c2", name: "Forest" },
      ],
    },
    { id: "d2", name: "Diet", categories: [{ id: "c3", name: "Meat" }] },
  ],
  cards: [
    { id: "k1", name: "Orca", answers: { d1: "c1", d2: "c3" } },
    { id: "k2", name: "Bear", answers: { d1: "c2", d2: "c3" } },
  ],
};

const code = "3f2b8c1e9a4d4e6f8b210c5d7e9fa1b3";

/** The deck's own query as the server answers it: the deck of the id, or null. */
function served(...decks: Deck[]) {
  return (id: string) => decks.find((deck) => deck.id === id) ?? null;
}

beforeEach(() => {
  learner.signedIn = true;
  learner.decks = [animals];
  learner.deck = served(animals);
  learner.sent = [];
  learner.reply = () => Promise.resolve(null);
  learner.inflight = 0;
  clerk.openSignIn.mockReset();
});

afterEach(cleanup);

/** Shows the router's current path and how it was reached, for the tests to read. */
function Path() {
  return (
    <>
      <output aria-label="path">{decodeURI(useLocation().pathname)}</output>
      <output aria-label="navigation">{useNavigationType()}</output>
    </>
  );
}

function renderAt(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <BoardsProvider>
        <main>
          <AppRoutes />
        </main>
        <Path />
      </BoardsProvider>
    </MemoryRouter>,
  );
  return { user };
}

function path() {
  return screen.getByLabelText("path").textContent;
}

function navigation() {
  return screen.getByLabelText("navigation").textContent;
}

const line =
  "This deck cannot be opened. It may have been deleted, or belong to another account.";

test("renders nothing while the deck is loading and the list holds no deck of its id", () => {
  learner.deck = () => undefined;
  for (const decks of [undefined, []]) {
    learner.decks = decks;
    renderAt(deckAddress(animals));
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
    expect(path()).toBe(deckAddress(animals));
    cleanup();
  }
});

test("shows the board of a deck the list holds while the deck's own query is loading", () => {
  learner.deck = () => undefined;
  renderAt(deckAddress(animals));
  expect(screen.getByRole("button", { name: "Habitat" })).toBeInTheDocument();
  expect(screen.getByText("Orca")).toBeInTheDocument();
  expect(screen.getByText("Bear")).toBeInTheDocument();
});

test("shows the board of the deck its address names by the code alone, with the arrow and the account button", () => {
  learner.decks = [];
  renderAt(`/decks/Another-name-${code}`);
  const sortBy = screen.getByRole("group", { name: "Sort by" });
  expect(
    within(sortBy).getByRole("button", { name: "Habitat" }),
  ).toBeInTheDocument();
  expect(
    within(sortBy).getByRole("button", { name: "Diet" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Orca")).toBeInTheDocument();
  expect(screen.getByText("Bear")).toBeInTheDocument();
  const back = screen.getByRole("link", { name: "Back to the list of decks" });
  expect(back).toHaveAttribute("href", "/decks");
  expect(back.nextElementSibling).toBe(sortBy);
  expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
});

test("replaces the address with the deck's own when the name in it differs", () => {
  renderAt(`/decks/Another-name-${code}`);
  expect(path()).toBe(deckAddress(animals));
  expect(navigation()).toBe("REPLACE");
  cleanup();

  renderAt(deckAddress(animals));
  expect(path()).toBe(deckAddress(animals));
  expect(navigation()).toBe("POP");
  cleanup();

  // A name of other scripts reaches the screen decoded, and matches.
  const biologia = { ...animals, name: "Biología" };
  learner.decks = [biologia];
  learner.deck = served(biologia);
  renderAt(encodeURI(deckAddress(biologia)));
  expect(path()).toBe(deckAddress(biologia));
  expect(navigation()).toBe("POP");
  expect(screen.getByText("Orca")).toBeInTheDocument();
});

test("replaces the address with / for a segment that ends in no code, whether or not the learner is signed in", () => {
  for (const signedIn of [true, false]) {
    learner.signedIn = signedIn;
    for (const segment of [
      "Animals",
      `Animals-${code.slice(1)}`,
      `Animals-${code.toUpperCase()}`,
    ]) {
      renderAt(`/decks/${segment}`);
      expect(path()).toBe("/");
      expect(navigation()).toBe("REPLACE");
      expect(
        screen.getByText("Choose how to sort to begin"),
      ).toBeInTheDocument();
      expect(screen.getByText("Shark")).toBeInTheDocument();
      cleanup();
    }
  }
  expect(clerk.openSignIn).not.toHaveBeenCalled();
});

test("brings the list of decks with the line when the deck cannot be opened, and makes the address the list's", () => {
  learner.deck = () => null;
  renderAt(deckAddress(animals));
  expect(path()).toBe("/decks");
  expect(navigation()).toBe("REPLACE");
  expect(
    within(screen.getByRole("main")).getByRole("status"),
  ).toHaveTextContent(line);
  expect(
    within(screen.getByRole("list")).getByRole("link", { name: "Animals" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Orca")).toBeNull();
});

test("the arrow leads to the list of decks", async () => {
  const { user } = renderAt(deckAddress(animals));
  await user.click(
    screen.getByRole("link", { name: "Back to the list of decks" }),
  );
  expect(path()).toBe("/decks");
  expect(navigation()).toBe("PUSH");
  expect(
    within(screen.getByRole("list")).getByRole("link", { name: "Animals" }),
  ).toBeInTheDocument();
  expect(within(screen.getByRole("main")).queryByRole("status")).toBeNull();
});

test("a deck's board keeps its chosen dimension when the learner goes to the list and opens the deck again", async () => {
  const { user } = renderAt(deckAddress(animals));
  await user.click(screen.getByRole("button", { name: "Diet" }));
  expect(screen.getByRole("button", { name: "Diet" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("region", { name: "Meat" })).toBeInTheDocument();

  await user.click(
    screen.getByRole("link", { name: "Back to the list of decks" }),
  );
  expect(path()).toBe("/decks");
  await user.click(screen.getByRole("link", { name: "Animals" }));
  expect(path()).toBe(deckAddress(animals));
  expect(screen.getByRole("button", { name: "Diet" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Habitat" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByRole("region", { name: "Meat" })).toBeInTheDocument();
});

test("the board of a learner's deck is given the acts of the hook for that deck", async () => {
  const { user } = renderAt(deckAddress(animals));
  const newCard = screen.getByRole("textbox", { name: "New card" });
  await user.type(newCard, "Orca{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent(
    'The deck "Animals" already has a card called "Orca".',
  );
  expect(learner.sent).toEqual([]);
  await user.clear(newCard);
  await user.type(newCard, "Seal{Enter}");
  expect(learner.sent).toEqual([
    {
      name: "decks:addCard",
      args: { deck: animals.id, id: expect.any(String), name: "Seal" },
    },
  ]);
  cleanup();

  // The board of the app's own deck takes no acts.
  renderAt("/");
  expect(screen.getByText("Shark")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).toBeNull();
});

/**
 * Makes the mutation of `name` wait; the function returned resolves it with
 * `value` and lets the screens take what it gives.
 */
function waitingReply(name: string): (value: unknown) => Promise<void> {
  let resolve: (value: unknown) => void = () => {};
  learner.reply = (sent) =>
    sent === name
      ? new Promise((settle) => {
          resolve = settle;
        })
      : Promise.resolve(null);
  return (value) => act(async () => resolve(value));
}

/**
 * The notices of the screen, in order: each element of role status in the
 * page that holds an icon, which dnd-kit's own status of a drag never does.
 */
function notices(): HTMLElement[] {
  return within(screen.getByRole("main"))
    .queryAllByRole("status")
    .filter((status) => status.querySelector("svg") !== null);
}

const notKept =
  'Your new card "Seal" was not kept. The deck "Animals" already has a card called "Seal".';

const sealTaken = { refused: "nameTaken", kind: "card", name: "Seal" };

test("a line for a change not kept shows at the top of the deck's board", async () => {
  const reply = waitingReply("decks:addCard");
  const { user } = renderAt(deckAddress(animals));
  await user.type(
    screen.getByRole("textbox", { name: "New card" }),
    "Seal{Enter}",
  );
  expect(notices()).toEqual([]);

  await reply(sealTaken);
  const [status, ...more] = notices();
  expect(more).toEqual([]);
  expect(status).toHaveTextContent(
    /^Your new card "Seal" was not kept\. The deck "Animals" already has a card called "Seal"\.$/,
  );
  expect(status.previousElementSibling).toContainElement(
    screen.getByRole("button", { name: "Reset" }),
  );
  expect(status.nextElementSibling).toBe(
    screen.getByRole("region", { name: "Unsorted" }),
  );
});

test("the line is gone after the learner goes to the list and opens the deck again", async () => {
  const reply = waitingReply("decks:addCard");
  const { user } = renderAt(deckAddress(animals));
  await user.type(
    screen.getByRole("textbox", { name: "New card" }),
    "Seal{Enter}",
  );
  await reply(sealTaken);
  expect(notices().map((each) => each.textContent)).toEqual([notKept]);

  await user.click(
    screen.getByRole("link", { name: "Back to the list of decks" }),
  );
  expect(path()).toBe("/decks");
  expect(screen.queryByText(notKept)).toBeNull();
  await user.click(screen.getByRole("link", { name: "Animals" }));
  expect(path()).toBe(deckAddress(animals));
  expect(screen.getByText("Orca")).toBeInTheDocument();
  expect(screen.queryByText(notKept)).toBeNull();
  expect(notices()).toEqual([]);
});

const waitingLine = "Your changes are not saved yet. Keep this page open.";

test("the board shows the waiting line while a change is not yet kept, before the lines for changes not kept, and not otherwise", async () => {
  const reply = waitingReply("decks:addCard");
  const { user } = renderAt(deckAddress(animals));
  expect(notices()).toEqual([]);

  await user.type(
    screen.getByRole("textbox", { name: "New card" }),
    "Seal{Enter}",
  );
  reportInflight(1);
  const [waiting, ...more] = notices();
  expect(more).toEqual([]);
  expect(waiting).toHaveTextContent(
    /^Your changes are not saved yet\. Keep this page open\.$/,
  );
  expect(waiting.previousElementSibling).toContainElement(
    screen.getByRole("button", { name: "Reset" }),
  );
  expect(waiting.nextElementSibling).toBe(
    screen.getByRole("region", { name: "Unsorted" }),
  );

  // The card's mutation returns its refusal while a later change still waits.
  await reply(sealTaken);
  expect(notices().map((each) => each.textContent)).toEqual([
    waitingLine,
    notKept,
  ]);

  reportInflight(0);
  expect(notices().map((each) => each.textContent)).toEqual([notKept]);
  cleanup();

  // The board of the app's own deck shows it too.
  renderAt("/");
  expect(notices()).toEqual([]);
  reportInflight(2);
  expect(notices().map((each) => each.textContent)).toEqual([waitingLine]);
  reportInflight(0);
  expect(notices()).toEqual([]);
});
