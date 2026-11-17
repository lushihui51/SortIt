import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
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
import { BoardsProvider } from "../board/BoardsProvider";
import AppRoutes from "../routes/AppRoutes";
import { deckAddress } from "../routes/deckAddress";
import DeckListScreen from "./DeckListScreen";
import { DeckNotOpenedProvider, useDeckNotOpened } from "./DeckNotOpened";

// No test reaches Convex: each sets the decks the list query gives and what
// the deck's own query gives for an id, and reads what was sent, each
// mutation's function name with its arguments. Each mutation resolves with
// what `reply` gives for its function's name.
const convex = vi.hoisted(() => ({
  decks: undefined as Deck[] | undefined,
  deck: (() => null) as (id: string) => Deck | null,
  sent: [] as { name: string; args: unknown }[],
  reply: (() => Promise.resolve(null)) as (name: string) => Promise<unknown>,
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const mutation = (name: string) =>
    Object.assign(
      (args: unknown) => {
        convex.sent.push({ name, args });
        return convex.reply(name);
      },
      {
        withOptimisticUpdate() {
          return mutation(name);
        },
      },
    );
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (query: never, args?: unknown) => {
      if (args === "skip") return undefined;
      const name = getFunctionName(query);
      if (name === "decks:list") return convex.decks;
      if (name === "decks:get")
        return convex.deck((args as { id: string }).id);
      return undefined;
    },
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

function deck(id: string, name: string, count = 0): Deck {
  const cards = Array.from({ length: count }, (_, index) => ({
    id: `${id}-card-${index}`,
    name: `Card ${index}`,
    answers: {},
  }));
  return { id, name, dimensions: [], cards };
}

const decks = [
  deck("3f2b8c1e-9a4d-4e6f-8b21-0c5d7e9fa1b3", "History", 3),
  deck("0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "Animals", 1),
  deck("9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b", "Biology revision"),
];

beforeEach(() => {
  convex.decks = decks;
  convex.deck = (id) => decks.find((deck) => deck.id === id) ?? null;
  convex.sent = [];
  convex.reply = () => Promise.resolve(null);
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
  expect(status).toHaveTextContent(
    new RegExp(`^${line.replace(/\./g, "\\.")}$`),
  );
  expect(status.nextElementSibling).toBe(screen.getByRole("list"));
});

test("the line for a deck that cannot be opened is a notice", async () => {
  const user = userEvent.setup();
  render(app());
  await user.click(screen.getByRole("button", { name: "Show the line" }));
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent(line);
  const icons = status.querySelectorAll("svg");
  expect(icons).toHaveLength(1);
  expect(icons[0]).toHaveAttribute("aria-hidden", "true");
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

/** The list item of the deck named `name`. */
function deckItem(name: string) {
  return screen.getByRole("link", { name }).closest("li")!;
}

/** The ⓘ of the deck named `name`. */
function infoOf(name: string) {
  return within(deckItem(name)).getByRole("button", { name: "ⓘ" });
}

test("each deck holds an ⓘ beside its link, not inside it", () => {
  renderList();
  for (const { name } of decks) {
    const item = deckItem(name);
    const link = within(item).getByRole("link");
    const buttons = within(item).getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(/^ⓘ$/);
    expect(buttons[0]).toHaveAttribute("type", "button");
    expect(link).not.toContainElement(buttons[0]);
    expect(buttons[0].parentElement).toBe(item);
    expect(link.parentElement).toBe(item);
  }
});

test("a deck's ⓘ opens a panel headed by the deck's name with Delete", async () => {
  const user = userEvent.setup();
  renderList();
  expect(screen.queryByRole("dialog")).toBeNull();
  const info = infoOf("Biology revision");
  await user.click(info);

  const panel = screen.getByRole("dialog", { name: "Biology revision" });
  expect(
    within(panel).getByRole("heading", { level: 2, name: "Biology revision" }),
  ).toBeInTheDocument();
  const buttons = within(panel).getAllByRole("button");
  expect(buttons).toEqual([
    within(panel).getByRole("button", { name: "Close" }),
    within(panel).getByRole("button", { name: "Delete" }),
  ]);
  expect(buttons[1]).toHaveAttribute("type", "button");
  expect(screen.queryByRole("alertdialog")).toBeNull();

  await user.click(buttons[0]);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(info).toHaveFocus();
  await user.click(info);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(info).toHaveFocus();
  expect(convex.sent).toHaveLength(0);
});

test("Delete asks the question that names the deck and its cards", async () => {
  const user = userEvent.setup();
  renderList();
  for (const [name, asked] of [
    ["History", 'Delete the deck "History"? 3 cards and their answers will be lost.'],
    ["Animals", 'Delete the deck "Animals"? 1 card and their answers will be lost.'],
    ["Biology revision", 'Delete the deck "Biology revision"?'],
  ]) {
    await user.click(infoOf(name));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const question = screen.getByRole("alertdialog", { name: asked });
    expect(question).toHaveTextContent(asked);
    expect(
      within(question)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Delete", "Cancel"]);
    await user.click(within(question).getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
  }
  expect(convex.sent).toHaveLength(0);
});

test("Cancel closes the question and keeps the panel and the deck", async () => {
  const user = userEvent.setup();
  renderList();
  await user.click(infoOf("History"));
  const remove = screen.getByRole("button", { name: "Delete" });

  await user.click(remove);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.getByRole("dialog", { name: "History" })).toBeInTheDocument();
  expect(remove).toHaveFocus();

  await user.click(remove);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.getByRole("dialog", { name: "History" })).toBeInTheDocument();
  expect(remove).toHaveFocus();

  expect(screen.getByRole("link", { name: "History" })).toBeInTheDocument();
  expect(convex.sent).toHaveLength(0);
});

test("confirming deletes the deck and closes the question and the panel", async () => {
  const user = userEvent.setup();
  renderList();
  await user.click(infoOf("Animals"));
  await user.click(screen.getByRole("button", { name: "Delete" }));
  const question = screen.getByRole("alertdialog");
  await user.click(within(question).getByRole("button", { name: "Delete" }));

  expect(convex.sent).toEqual([
    { name: "decks:deleteDeck", args: { deck: decks[1].id } },
  ]);
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the panel and the question of a deck show only while the list holds it", async () => {
  const user = userEvent.setup();
  const { rerender } = renderList();
  await user.click(infoOf("History"));
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();

  convex.decks = decks.slice(1);
  rerender(
    <MemoryRouter initialEntries={["/decks"]}>
      <DeckListScreen />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("a line for a change not kept shows at the top of the list, after the line for a deck that cannot be opened", async () => {
  const [history, animals] = decks;
  // Animals cannot be opened, and the card made on History's board waits for
  // its mutation.
  convex.deck = (id) => (id === history.id ? history : null);
  let resolve: (value: unknown) => void = () => {};
  convex.reply = (name) =>
    name === "decks:addCard"
      ? new Promise((settle) => {
          resolve = settle;
        })
      : Promise.resolve(null);
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[deckAddress(history)]}>
      <BoardsProvider>
        <main>
          <AppRoutes />
        </main>
      </BoardsProvider>
    </MemoryRouter>,
  );
  await user.type(
    screen.getByRole("textbox", { name: "New card" }),
    "Seal{Enter}",
  );
  expect(screen.queryByRole("alert")).toBeNull();
  await user.click(
    screen.getByRole("link", { name: "Back to the list of decks" }),
  );
  await user.click(screen.getByRole("link", { name: animals.name }));
  expect(
    within(screen.getByRole("main"))
      .getAllByRole("status")
      .map((status) => status.textContent),
  ).toEqual([line]);

  await act(async () =>
    resolve({ refused: "nameTaken", kind: "card", name: "Seal" }),
  );
  const statuses = within(screen.getByRole("main")).getAllByRole("status");
  expect(statuses.map((status) => status.textContent)).toEqual([
    line,
    'Your new card "Seal" was not kept. The deck "History" already has a card called "Seal".',
  ]);
  expect(statuses[1].querySelector("svg")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(statuses[0].nextElementSibling).toBe(statuses[1]);
  expect(statuses[1].nextElementSibling).toBe(screen.getByRole("list"));
});
