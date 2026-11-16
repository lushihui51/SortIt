import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { BoardsProvider } from "../board/BoardsProvider";
import AppRoutes from "./AppRoutes";
import { deckAddress } from "./deckAddress";

// No test reaches Convex or Clerk: each test sets whether the learner is
// signed in, to both alike, and the decks the list query gives.
const learner = vi.hoisted(() => ({
  signedIn: false,
  decks: [] as Deck[],
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
    useQuery: (query: never, args?: unknown) =>
      args !== "skip" && getFunctionName(query) === "decks:list"
        ? learner.decks
        : undefined,
    useMutation: () => mutation(),
  };
});

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
    openSignIn: vi.fn(),
    closeSignIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

beforeEach(() => {
  learner.signedIn = false;
  learner.decks = [];
});

afterEach(cleanup);

/** Shows the router's current path and how it was reached, for the tests to read. */
function Path() {
  return (
    <>
      <output aria-label="path">{useLocation().pathname}</output>
      <output aria-label="navigation">{useNavigationType()}</output>
    </>
  );
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <BoardsProvider>
        <AppRoutes />
        <Path />
      </BoardsProvider>
    </MemoryRouter>,
  );
}

test("the path / shows the board of the app's own deck", () => {
  renderAt("/");
  expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
  expect(screen.getByText("Shark")).toBeInTheDocument();
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
});

test("any other path is replaced by /", () => {
  for (const path of [
    "/decks/Biology-3f2b8c1e9a4d4e6f8b210c5d7e9fa1b3",
    "/nowhere",
  ]) {
    renderAt(path);
    expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
    expect(screen.getByLabelText("navigation")).toHaveTextContent("REPLACE");
    expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
    cleanup();
  }
});

test("the path /decks shows the list of decks to a signed-in learner", () => {
  const decks: Deck[] = [
    {
      id: "3f2b8c1e-9a4d-4e6f-8b21-0c5d7e9fa1b3",
      name: "Biology",
      dimensions: [],
      cards: [],
    },
  ];
  learner.signedIn = true;
  learner.decks = decks;
  renderAt("/decks");
  const deck = within(screen.getByRole("list")).getByRole("link");
  expect(deck).toHaveAccessibleName("Biology");
  expect(deck).toHaveAttribute("href", deckAddress(decks[0]));
  expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  expect(screen.queryByText("Choose how to sort to begin")).toBeNull();
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/decks$/);
});
