import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { deckAddress } from "../routes/deckAddress";
import DeckListScreen from "./DeckListScreen";
import { DeckNotOpenedProvider, useDeckNotOpened } from "./DeckNotOpened";

// No test reaches Convex: each sets the decks the list query gives, and reads
// what was sent, each mutation's function name with its arguments.
const convex = vi.hoisted(() => ({
  decks: undefined as Deck[] | undefined,
  sent: [] as { name: string; args: unknown }[],
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const mutation = (name: string) =>
    Object.assign(
      (args: unknown) => {
        convex.sent.push({ name, args });
        return Promise.resolve(null);
      },
      {
        withOptimisticUpdate() {
          return mutation(name);
        },
      },
    );
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (query: never) =>
      getFunctionName(query) === "decks:list" ? convex.decks : undefined,
    useMutation: (fn: never) => mutation(getFunctionName(fn)),
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
  convex.sent = [];
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

/** A stand-in for a deck's screen, showing the address it was reached at and how. */
function DeckReached() {
  return (
    <>
      <output aria-label="path">{decodeURI(useLocation().pathname)}</output>
      <output aria-label="navigation">{useNavigationType()}</output>
    </>
  );
}

/** The list at `/decks` and the stand-in for a deck's screen at each deck's address. */
function renderListRoutes() {
  return render(
    <MemoryRouter initialEntries={["/decks"]}>
      <Routes>
        <Route path="/decks" element={<DeckListScreen />} />
        <Route path="/decks/:segment" element={<DeckReached />} />
      </Routes>
    </MemoryRouter>,
  );
}

function newDeck() {
  return screen.getByRole("textbox", { name: "New deck" });
}

test("the New deck field stands after the list and is no item of it", () => {
  renderList();
  const list = screen.getByRole("list");
  expect(within(list).queryByRole("textbox")).toBeNull();
  expect(newDeck()).toHaveAttribute("placeholder", "New deck");
  expect(list.nextElementSibling).toContainElement(newDeck());
  expect(list.parentElement).toContainElement(newDeck());
});

test("Enter in New deck makes a deck and opens its address", async () => {
  const user = userEvent.setup();
  renderListRoutes();

  await user.type(newDeck(), "  Geography {Enter}");

  expect(convex.sent).toHaveLength(1);
  const [{ name, args }] = convex.sent;
  expect(name).toBe("decks:createDeck");
  expect(args).toEqual({ id: expect.any(String), name: "  Geography " });
  const { id } = args as { id: string };
  expect(screen.getByLabelText("path")).toHaveTextContent(
    deckAddress({ id, name: "Geography" }),
  );
  expect(screen.getByLabelText("navigation")).toHaveTextContent("PUSH");
});

test("a refused deck name shows its words under New deck and opens nothing", async () => {
  const user = userEvent.setup();
  renderListRoutes();

  await user.type(newDeck(), "History{Enter}");
  const taken = screen.getByRole("alert");
  expect(taken).toHaveTextContent(/^You already have a deck called "History"\.$/);
  expect(newDeck()).toHaveAccessibleDescription(taken.textContent ?? "");
  expect(newDeck()).toHaveValue("History");

  await user.clear(newDeck());
  await user.type(newDeck(), "   {Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent(/^A deck needs a name\.$/);
  expect(newDeck()).toHaveValue("   ");

  expect(convex.sent).toHaveLength(0);
  expect(screen.queryByLabelText("path")).toBeNull();
  expect(screen.getByRole("list")).toBeInTheDocument();
});
