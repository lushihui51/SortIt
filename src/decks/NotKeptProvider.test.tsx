import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
  type NavigateFunction,
} from "react-router";
import { afterEach, expect, test } from "vitest";
import type { Thing } from "./notKept";
import {
  NotKeptProvider,
  useNotKept,
  useNotKeptLines,
} from "./NotKeptProvider";

const animals: Thing = { kind: "deck", id: "deck-1", name: "Animals" };
const crab: Thing = { kind: "card", id: "card-1", name: "Crab" };
const owl: Thing = { kind: "card", id: "card-2", name: "Owl" };
const history: Thing = { kind: "deck", id: "deck-2", name: "History" };

const crabTaken = { refused: "nameTaken", kind: "card", name: "Crab" } as const;
const owlTaken = { refused: "nameTaken", kind: "card", name: "Owl" } as const;

const crabLine =
  'Your new card "Crab" was not kept. The deck "Animals" already has a card called "Crab".';
const owlLine =
  'Your new card "Owl" was not kept. The deck "Animals" already has a card called "Owl".';

/** What a test reads of the provider and the router, set by `Probe` on each render. */
let sender: ReturnType<typeof useNotKept>;
let navigate: NavigateFunction;

/** Gives the test the provider's `send` and the router's `navigate`. */
function Probe(): null {
  sender = useNotKept();
  navigate = useNavigate();
  return null;
}

/** A screen that shows the lines. */
function Lines(): ReactElement {
  const lines = useNotKeptLines();
  return (
    <ul aria-label="Lines">
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
}

/** The acts a test sends, as the hook would record them. */
function making(subject: Thing): Parameters<typeof sender.send>[0] {
  return subject.kind === "deck"
    ? { making: true, subject, others: [], held: null }
    : { making: true, subject, others: [animals], held: animals.name };
}

function deleting(subject: Thing): Parameters<typeof sender.send>[0] {
  return { making: false, subject, others: [animals], held: animals.name };
}

/** The provider at `path`, where /decks and /decks/:id show the lines and /quiet and /still show none. */
function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotKeptProvider>
        <Probe />
        <Routes>
          <Route path="/decks" element={<Lines />} />
          <Route path="/decks/:id" element={<Lines />} />
          <Route path="/quiet" element={null} />
          <Route path="/still" element={null} />
        </Routes>
      </NotKeptProvider>
    </MemoryRouter>,
  );
}

/** The lines the screen shows; none when no screen shows lines. */
function shown(): string[] {
  return screen.queryAllByRole("listitem").map((item) => item.textContent);
}

/** Sends `sent` and settles it at once with `returned`. */
function settled(
  sent: Parameters<typeof sender.send>[0],
  returned: Parameters<ReturnType<typeof sender.send>["settle"]>[0],
): void {
  act(() => sender.send(sent).settle(returned));
}

function go(to: string | number, replace = false): void {
  act(() => {
    if (typeof to === "number") void navigate(to);
    else void navigate(to, { replace });
  });
}

afterEach(cleanup);

test("a line shows on the screen that is showing when it arises", () => {
  renderAt("/decks/deck-1");
  expect(shown()).toEqual([]);

  settled(making(crab), crabTaken);
  expect(shown()).toEqual([crabLine]);

  settled(making(owl), owlTaken);
  expect(shown()).toEqual([crabLine, owlLine]);
});

test("a line that arises while no screen shows lines shows on the next screen that does", () => {
  renderAt("/quiet");

  settled(making(crab), crabTaken);
  expect(shown()).toEqual([]);

  // A move made before any screen has shown the line takes nothing away.
  go("/still");
  go("/decks");
  expect(shown()).toEqual([crabLine]);
});

test("a line stays while the path stays, stays when the app replaces the address, and is gone once the learner has moved to another path", () => {
  renderAt("/decks/deck-1");
  settled(making(crab), crabTaken);

  go("/decks/deck-1");
  expect(shown()).toEqual([crabLine]);
  go("/decks", true);
  expect(shown()).toEqual([crabLine]);

  go("/decks/deck-1");
  expect(shown()).toEqual([]);
  go("/decks");
  expect(shown()).toEqual([]);

  // A move along the history takes a line away as a new entry does.
  settled(making(owl), owlTaken);
  expect(shown()).toEqual([owlLine]);
  go(-1);
  expect(shown()).toEqual([]);
  go(1);
  expect(shown()).toEqual([]);
});

test("outside the provider no line shows and settling does nothing", () => {
  render(
    <MemoryRouter initialEntries={["/decks"]}>
      <Probe />
      <Lines />
    </MemoryRouter>,
  );

  settled(making(crab), crabTaken);

  expect(screen.getByRole("list", { name: "Lines" })).toBeEmptyDOMElement();
});

test("the things never made and the acts sent outlast a change of path", () => {
  renderAt("/decks/deck-1");
  const made = sender.send(making(crab));
  go("/decks");
  const deleted = sender.send(deleting(crab));
  go("/quiet");

  act(() => made.settle(crabTaken));
  go("/decks/deck-1");
  expect(shown()).toEqual([
    'Your new card "Crab" and your later changes to it were not kept. The deck "Animals" already has a card called "Crab".',
  ]);

  go("/decks");
  act(() => deleted.settle({ refused: "gone", kind: "card", id: crab.id }));
  expect(shown()).toEqual([]);
});

test("a making refused after a later act on its subject was sent, from any screen, gives the line that names the later changes", () => {
  const senders: Record<string, ReturnType<typeof useNotKept>> = {};
  /** A screen that sends acts of its own. */
  function Sending({ name }: { name: string }): ReactElement {
    senders[name] = useNotKept();
    return <Lines />;
  }
  render(
    <MemoryRouter initialEntries={["/decks"]}>
      <NotKeptProvider>
        <Probe />
        <Routes>
          <Route path="/decks" element={<Sending name="list" />} />
          <Route path="/decks/:id" element={<Sending name="board" />} />
        </Routes>
      </NotKeptProvider>
    </MemoryRouter>,
  );

  const made = senders.list.send(making(history));
  go("/decks/deck-2");
  senders.board.send({
    making: true,
    subject: owl,
    others: [history],
    held: history.name,
  });

  act(() =>
    made.settle({ refused: "nameTaken", kind: "deck", name: "History" }),
  );
  expect(shown()).toEqual([
    'Your new deck "History" and your later changes to it were not kept. You already have a deck called "History".',
  ]);
});
