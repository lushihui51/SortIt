import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
const learner = vi.hoisted(() => ({
  signedIn: true,
  decks: [] as Deck[] | undefined,
  deck: (() => undefined) as (id: string) => Deck | null | undefined,
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const mutation = () =>
    Object.assign(() => Promise.resolve(null), {
      withOptimisticUpdate() {
        return mutation();
      },
    });
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
    useMutation: () => mutation(),
  };
});

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
