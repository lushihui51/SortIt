import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { deckAddress } from "../routes/deckAddress";
import DeckListScreen from "./DeckListScreen";
import { DeckNotOpenedProvider, useDeckNotOpened } from "./DeckNotOpened";

// No test reaches Convex: each sets the decks the list query gives.
const convex = vi.hoisted(() => ({ decks: undefined as Deck[] | undefined }));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const mutation = () =>
    Object.assign(() => Promise.resolve(null), {
      withOptimisticUpdate() {
        return mutation();
      },
    });
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (query: never) =>
      getFunctionName(query) === "decks:list" ? convex.decks : undefined,
    useMutation: () => mutation(),
  };
});

// No test reaches Clerk: the learner is signed in.
vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useUser: () => ({
    user: {
      hasImage: false,
      imageUrl: "",
      primaryEmailAddress: { emailAddress: "sam@example.com" },
    },
  }),
  useClerk: () => ({
    openSignIn: vi.fn(),
    closeSignIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

function deck(id: string, name: string): Deck {
  return { id, name, dimensions: [], cards: [] };
}

const decks = [
  deck("3f2b8c1e-9a4d-4e6f-8b21-0c5d7e9fa1b3", "History"),
  deck("0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "Animals"),
  deck("9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b", "Biology revision"),
];

beforeEach(() => {
  convex.decks = decks;
});

afterEach(cleanup);

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/decks"]}>
      <DeckListScreen />
    </MemoryRouter>,
  );
}

test("renders nothing while the decks are loading", () => {
  convex.decks = undefined;
  const { container } = renderList();
  expect(container).toBeEmptyDOMElement();
});

test("shows each deck by its name, in the query's order, as a link to its address", () => {
  renderList();
  const items = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(items).toHaveLength(decks.length);
  items.forEach((item, index) => {
    const links = within(item).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(decks[index].name);
    expect(links[0]).toHaveTextContent(new RegExp(`^${decks[index].name}$`));
    expect(links[0]).toHaveAttribute("href", deckAddress(decks[index]));
  });
});

test("shows the account button and no deck for a learner with no deck", () => {
  convex.decks = [];
  renderList();
  expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  expect(screen.queryAllByRole("link")).toHaveLength(0);
});

const line =
  "This deck cannot be opened. It may have been deleted, or belong to another account.";

/** A button that shows the line, standing in for a deck's screen that cannot open its deck. */
function ShowLine() {
  const { show } = useDeckNotOpened();
  return (
    <button type="button" onClick={show}>
      Show the line
    </button>
  );
}

/** The list at `/decks` and a stand-in for a deck's screen at each deck's address, which links back to the list, inside the provider of the line. */
function app() {
  return (
    <MemoryRouter initialEntries={["/decks"]}>
      <DeckNotOpenedProvider>
        <ShowLine />
        <Routes>
          <Route path="/decks" element={<DeckListScreen />} />
          <Route
            path="/decks/:segment"
            element={<Link to="/decks">A deck's screen</Link>}
          />
        </Routes>
      </DeckNotOpenedProvider>
    </MemoryRouter>
  );
}

test("shows the line that a deck cannot be opened only while it is shown", async () => {
  const user = userEvent.setup();
  renderList();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByText(line)).toBeNull();
  cleanup();

  render(app());
  expect(screen.queryByRole("status")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Show the line" }));
  const status = screen.getByRole("status");
  expect(status.tagName).toBe("P");
  expect(status).toHaveTextContent(
    new RegExp(`^${line.replace(/\./g, "\\.")}$`),
  );
  expect(status.nextElementSibling).toBe(screen.getByRole("list"));
});

test("the line is gone when the learner comes back to the list after opening a deck", async () => {
  const user = userEvent.setup();
  render(app());
  await user.click(screen.getByRole("button", { name: "Show the line" }));
  expect(screen.getByRole("status")).toHaveTextContent(line);

  await user.click(screen.getByRole("link", { name: "History" }));
  await user.click(screen.getByRole("link", { name: "A deck's screen" }));
  expect(screen.getByRole("link", { name: "History" })).toBeInTheDocument();
  expect(screen.queryByRole("status")).toBeNull();
});
