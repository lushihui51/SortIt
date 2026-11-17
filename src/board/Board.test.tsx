import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import type { ActResult } from "../../convex/model/deckActs";
import { appDeck } from "../deck/appDeck";
import Board, { type BoardActs, type BoardProps } from "./Board";
import { boardsReducer, noBoards, shuffle, type BoardState } from "./board";
import type { DeckBoardAction } from "./BoardsProvider";

afterEach(cleanup);

// With every draw 0, each shuffle is a fixed rotation of the order before it,
// so every test knows the exact order of the cards after each shuffle.
const zero = () => 0;

/** The board of `deck` after its load and then `actions`, built by `boardsReducer`. */
function boardAfter(deck: Deck, ...actions: DeckBoardAction[]): BoardState {
  let state = boardsReducer(noBoards, { type: "load", deck, random: zero });
  for (const action of actions) {
    state = boardsReducer(
      state,
      action.type === "toggleCheck"
        ? { type: "toggleCheck", deckId: deck.id }
        : { ...action, deck },
    );
  }
  return state[deck.id];
}

function setUp(deck: Deck, board: BoardState, acts?: BoardActs) {
  const user = userEvent.setup();
  const dispatch = vi.fn<BoardProps["dispatch"]>();
  const shown = (deck: Deck, board: BoardState) => (
    <Board
      deck={deck}
      board={board}
      dispatch={dispatch}
      random={zero}
      acts={acts}
    />
  );
  const { rerender } = render(shown(deck, board));
  /** Renders the same board over `deck` and `board`, as a new deck arriving does. */
  const renderAgain = (deck: Deck, board: BoardState) =>
    rerender(shown(deck, board));
  return { user, dispatch, renderAgain };
}

/**
 * Acts made of `vi.fn()`, each returning the result `results` gives for it,
 * or else `deck` unchanged.
 */
function actsOf(
  deck: Deck,
  results: {
    [Act in keyof BoardActs]?: ReturnType<BoardActs[Act]>;
  } = {},
) {
  const same: ActResult = { ok: true, deck };
  return {
    addCard: vi.fn<BoardActs["addCard"]>(() => results.addCard ?? same),
    addDimension: vi.fn<BoardActs["addDimension"]>(
      () => results.addDimension ?? same,
    ),
    addCategory: vi.fn<BoardActs["addCategory"]>(
      () => results.addCategory ?? same,
    ),
    deleteCard: vi.fn<BoardActs["deleteCard"]>(
      () => results.deleteCard ?? same,
    ),
    deleteDimension: vi.fn<BoardActs["deleteDimension"]>(
      () => results.deleteDimension ?? same,
    ),
    deleteCategory: vi.fn<BoardActs["deleteCategory"]>(
      () => results.deleteCategory ?? same,
    ),
    saveAnswers: vi.fn<BoardActs["saveAnswers"]>(
      () =>
        results.saveAnswers ?? {
          ok: true,
          deck,
          leftOut: { cards: [], categories: [] },
        },
    ),
  };
}

/** The text field whose words are `label`. */
function field(label: string): HTMLElement {
  return screen.getByRole("textbox", { name: label });
}

function region(name: string) {
  return screen.getByRole("region", { name });
}

/** The element whose text names `region`. */
function labelOf(region: HTMLElement): HTMLElement {
  return document.getElementById(region.getAttribute("aria-labelledby")!)!;
}

/** The card named `name`, found by the text of its name in `container`. */
function cardNamed(name: string, container: HTMLElement = document.body) {
  return within(container).getByText(name).parentElement!;
}

/** The ⓘ of the card named `name`. */
function infoOf(name: string): HTMLElement {
  return within(cardNamed(name)).getByRole("button", { name: "ⓘ" });
}

/** The text of each card in a region but its ⓘ, in the order shown. */
function cardsIn(name: string): string[] {
  return within(region(name))
    .queryAllByRole("button", { name: "ⓘ" })
    .map((info) => info.parentElement!.textContent!.replace(/ⓘ$/, ""));
}

const choose = (dimension: string): DeckBoardAction => ({
  type: "chooseDimension",
  dimension,
  random: zero,
});
const place = (card: string, category: string): DeckBoardAction => ({
  type: "place",
  card,
  place: { kind: "zone", category },
});
const toggleCheck: DeckBoardAction = { type: "toggleCheck" };

const names = appDeck.cards.map((card) => card.name);
const afterLoad = shuffle(names, zero);
const afterChoose = shuffle(afterLoad, zero);
const habitat = appDeck.dimensions[0];
const habitatCategories = habitat.categories.map((category) => category.name);

// In `appDeck` every id is its name, so a card's name is its id here.
/** The id of the Habitat category that is the answer of `card`. */
const answer = (card: string) =>
  appDeck.cards.find((each) => each.id === card)!.answers[habitat.id];
/** The id of a Habitat category that is not the answer of `card`. */
const wrongFor = (card: string) =>
  habitat.categories.find((category) => category.id !== answer(card))!.id;

// Two cards placed right, one placed wrong, the rest in the pool.
const [right1, wrong1, right2] = afterChoose;
const mixed = [
  choose(habitat.id),
  place(right1, answer(right1)),
  place(wrong1, wrongFor(wrong1)),
  place(right2, answer(right2)),
];

test("shows every card in the pool, the prompt and no zone before a dimension is chosen", () => {
  setUp(appDeck, boardAfter(appDeck));
  expect(cardsIn("Unsorted")).toEqual(afterLoad);
  expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
  expect(screen.getAllByRole("region")).toHaveLength(1);
  expect(screen.getByRole("group", { name: "Sort by" })).toBeInTheDocument();
  for (const dimension of appDeck.dimensions) {
    expect(
      screen.getByRole("button", { name: dimension.name }),
    ).toHaveAttribute("aria-pressed", "false");
  }
});

test("shows one zone per category of the chosen dimension, the pool and each zone labelled in plain text", () => {
  setUp(appDeck, boardAfter(appDeck, choose(habitat.id)));
  const regions = screen.getAllByRole("region");
  expect(regions.map((each) => region(labelOf(each).textContent!))).toEqual(
    regions,
  );
  expect(regions.map((each) => labelOf(each).textContent)).toEqual([
    "Unsorted",
    ...habitatCategories,
  ]);
  for (const each of regions) {
    expect(labelOf(each).tagName).toBe("SPAN");
    expect(each).toContainElement(labelOf(each));
  }
  for (const name of ["Unsorted", ...habitatCategories])
    expect(screen.queryByRole("button", { name })).toBeNull();
  expect(cardsIn("Unsorted")).toEqual(afterChoose);
  expect(screen.queryByText("Choose how to sort to begin")).toBeNull();
  expect(screen.getByRole("button", { name: habitat.name })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

// Every id differs from its name, so a dimension, zone or card that showed its
// id, or a board keyed by names, fails this test.
const numbered: Deck = {
  id: "deck-1",
  name: "Animals",
  dimensions: [
    {
      id: "dimension-1",
      name: "Habitat",
      categories: [
        { id: "category-1", name: "Ocean" },
        { id: "category-2", name: "Forest" },
      ],
    },
    {
      id: "dimension-2",
      name: "Diet",
      categories: [
        { id: "category-3", name: "Herbivore" },
        { id: "category-4", name: "Carnivore" },
      ],
    },
  ],
  cards: [
    {
      id: "card-1",
      name: "Shark",
      answers: { "dimension-1": "category-1", "dimension-2": "category-4" },
    },
    {
      id: "card-2",
      name: "Deer",
      answers: { "dimension-1": "category-2", "dimension-2": "category-3" },
    },
  ],
};

test("shows each dimension, zone and card by its name for a deck whose ids differ from its names", () => {
  setUp(numbered, boardAfter(numbered));
  expect(
    within(screen.getByRole("group", { name: "Sort by" }))
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual(["Habitat", "Diet"]);
  expect(cardsIn("Unsorted")).toEqual(["Deer", "Shark"]);
  cleanup();
  setUp(
    numbered,
    boardAfter(
      numbered,
      choose("dimension-1"),
      place("card-1", "category-1"),
      place("card-2", "category-1"),
      toggleCheck,
    ),
  );
  expect(
    screen
      .getAllByRole("region")
      .slice(1)
      .map((zone) => labelOf(zone).textContent),
  ).toEqual(["Ocean", "Forest"]);
  expect(cardsIn("Ocean")).toEqual(["Shark ✓Correct", "Deer ✕Incorrect"]);
  for (const [name, word] of [
    ["Shark", "Correct"],
    ["Deer", "Incorrect"],
  ])
    expect(
      within(cardNamed(name, region("Ocean"))).getByText(word),
    ).toHaveClass("visually-hidden");
  expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
  expect(screen.queryByText(/(dimension|category|card)-\d/)).toBeNull();
});

test("shows what it is given as account at the end of the bar", () => {
  render(
    <Board
      deck={appDeck}
      board={boardAfter(appDeck, ...mixed, toggleCheck)}
      dispatch={vi.fn()}
      random={zero}
      account={<button type="button">Probe</button>}
    />,
  );
  const account = screen.getByRole("button", { name: "Probe" });
  const bar = account.parentElement!;
  expect(bar).toContainElement(screen.getByRole("button", { name: "Reset" }));
  expect(bar.lastElementChild).toBe(account);
  expect(account.previousElementSibling).toContainElement(
    screen.getByText("2 of 3 correct"),
  );
});

test("shows what it is given as back at the start of the bar", () => {
  render(
    <Board
      deck={appDeck}
      board={boardAfter(appDeck)}
      dispatch={vi.fn()}
      random={zero}
      back={<a href="/decks">Probe</a>}
    />,
  );
  const back = screen.getByRole("link", { name: "Probe" });
  const bar = back.parentElement!;
  expect(bar.firstElementChild).toBe(back);
  expect(back.nextElementSibling).toBe(
    screen.getByRole("group", { name: "Sort by" }),
  );
});

test("shows what it is given as notices between the bar and the pool", () => {
  render(
    <Board
      deck={appDeck}
      board={boardAfter(appDeck)}
      dispatch={vi.fn()}
      random={zero}
      notices={
        <>
          <p>First probe</p>
          <p>Second probe</p>
        </>
      }
    />,
  );
  const first = screen.getByText("First probe");
  const second = screen.getByText("Second probe");
  expect(first.previousElementSibling).toContainElement(
    screen.getByRole("button", { name: "Reset" }),
  );
  expect(first.nextElementSibling).toBe(second);
  expect(second.nextElementSibling).toBe(
    screen.getByRole("region", { name: "Unsorted" }),
  );
});

test("pressing a dimension dispatches chooseDimension with its id", async () => {
  const { user, dispatch } = setUp(numbered, boardAfter(numbered));
  await user.click(screen.getByRole("button", { name: "Diet" }));
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: "chooseDimension",
    dimension: "dimension-2",
    random: zero,
  });
});

test("Reset dispatches reset", async () => {
  const { user, dispatch } = setUp(appDeck, boardAfter(appDeck, ...mixed));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: "reset",
    random: zero,
  });
});

test("a press on a card dispatches nothing and no card reads Selected", async () => {
  const { user, dispatch } = setUp(appDeck, boardAfter(appDeck));
  await user.click(cardNamed(afterLoad[0]));
  cleanup();
  const after = setUp(appDeck, boardAfter(appDeck, ...mixed));
  await after.user.click(cardNamed(afterChoose[3]));
  await after.user.click(cardNamed(right1));
  await after.user.keyboard("{Enter}");
  expect(dispatch).not.toHaveBeenCalled();
  expect(after.dispatch).not.toHaveBeenCalled();
  expect(screen.queryByText("Selected")).toBeNull();
  expect(cardsIn("Unsorted")).toEqual(afterChoose.slice(3));
});

test("Check is a switch that shows whether it is on, is never disabled and dispatches toggleCheck", async () => {
  const { user, dispatch } = setUp(appDeck, boardAfter(appDeck));
  const off = screen.getByRole("switch", { name: "Check" });
  expect(off.tagName).toBe("BUTTON");
  expect(off).toHaveAttribute("type", "button");
  expect(off).toHaveAttribute("aria-checked", "false");
  expect(off).toBeEnabled();
  await user.click(off);
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "toggleCheck" });
  cleanup();
  const on = setUp(appDeck, boardAfter(appDeck, toggleCheck));
  const check = screen.getByRole("switch", { name: "Check" });
  expect(check).toHaveAttribute("aria-checked", "true");
  expect(check).toBeEnabled();
  await on.user.click(check);
  expect(on.dispatch).toHaveBeenCalledExactlyOnceWith({ type: "toggleCheck" });
});

test("no hint stands beside Check", () => {
  for (const board of [
    boardAfter(appDeck),
    boardAfter(appDeck, ...mixed),
    boardAfter(appDeck, ...mixed, toggleCheck),
  ]) {
    setUp(appDeck, board);
    const check = screen.getByRole("switch", { name: "Check" });
    expect(check).toHaveTextContent(/^Check$/);
    let next = check.nextElementSibling;
    if (next?.textContent === "Retry") next = next.nextElementSibling;
    expect(next).toHaveAttribute("aria-live", "polite");
    expect(next?.nextElementSibling).toBeNull();
    expect(screen.queryByText("Place every card to check")).toBeNull();
    cleanup();
  }
});

test("while Check is on, each card in a zone shows Correct or Incorrect and no card in the pool shows either", () => {
  setUp(appDeck, boardAfter(appDeck, ...mixed, toggleCheck));
  for (const [card, mark, word, icon] of [
    [right1, "correct", "Correct", "✓"],
    [wrong1, "incorrect", "Incorrect", "✕"],
    [right2, "correct", "Correct", "✓"],
  ]) {
    const zone = mark === "correct" ? answer(card) : wrongFor(card);
    const shown = cardNamed(card, region(zone));
    expect(shown).toHaveAttribute("data-mark", mark);
    expect(within(shown).getByText(word)).toHaveClass("visually-hidden");
    expect(within(shown).getByText(icon)).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  }
  expect(cardsIn("Unsorted")).toEqual(afterChoose.slice(3));
  for (const card of afterChoose.slice(3))
    expect(cardNamed(card, region("Unsorted"))).not.toHaveAttribute(
      "data-mark",
    );
});

test("while Check is off, no card shows Correct or Incorrect", () => {
  setUp(appDeck, boardAfter(appDeck, ...mixed));
  expect(document.querySelector("[data-mark]")).toBeNull();
  expect(screen.queryByText("Correct")).toBeNull();
  expect(screen.queryByText("Incorrect")).toBeNull();
  expect(screen.queryByText(/[✓✕]/)).toBeNull();
  expect(cardsIn(habitatCategories[0]).length).toBeGreaterThan(0);
});

test("an incorrect card shows its name, the icon and Incorrect, and no category", () => {
  setUp(appDeck, boardAfter(appDeck, ...mixed, toggleCheck));
  const card = cardNamed(wrong1);
  expect(within(card).getByText("Incorrect")).toHaveClass("visually-hidden");
  expect(card).toHaveTextContent(`${wrong1} ✕Incorrect`, {
    normalizeWhitespace: false,
  });
  for (const category of habitatCategories)
    expect(card.textContent).not.toContain(category);
});

// Platypus has no answer under Habitat, so it bears the no-answer mark there,
// while every card of `appDeck` has an answer under each dimension.
const partial: Deck = {
  id: "deck-2",
  name: "Animals",
  dimensions: [
    {
      id: "habitat",
      name: "Habitat",
      categories: [
        { id: "ocean", name: "Ocean" },
        { id: "forest", name: "Forest" },
      ],
    },
  ],
  cards: [
    { id: "shark", name: "Shark", answers: { habitat: "ocean" } },
    { id: "deer", name: "Deer", answers: { habitat: "forest" } },
    { id: "platypus", name: "Platypus", answers: {} },
    { id: "owl", name: "Owl", answers: { habitat: "forest" } },
  ],
};

test("a card with no answer under the chosen dimension shows No answer in the pool and in a zone, with Check on and off", () => {
  for (const [where, actions] of [
    ["Unsorted", [choose("habitat")]],
    ["Unsorted", [choose("habitat"), toggleCheck]],
    ["Ocean", [choose("habitat"), place("platypus", "ocean")]],
    ["Ocean", [choose("habitat"), place("platypus", "ocean"), toggleCheck]],
  ] as const) {
    setUp(partial, boardAfter(partial, ...actions));
    const card = cardNamed("Platypus", region(where));
    expect(card).toHaveAttribute("data-mark", "noAnswer");
    expect(within(card).getByText("No answer")).toHaveClass("visually-hidden");
    expect(card).toHaveTextContent("Platypus ?No answer", {
      normalizeWhitespace: false,
    });
    expect(within(card).getByText("?")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByText("No answer")).toHaveLength(1);
    cleanup();
  }
});

test("the score reads the correct cards over the cards judged while Check is on and a card lies in a zone", () => {
  setUp(
    partial,
    boardAfter(
      partial,
      choose("habitat"),
      place("shark", "ocean"),
      place("deer", "ocean"),
      place("platypus", "forest"),
      toggleCheck,
    ),
  );
  const score = screen.getByText("1 of 2 correct");
  expect(score.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
  expect(cardsIn("Unsorted")).toEqual(["Owl"]);
  cleanup();
  setUp(appDeck, boardAfter(appDeck, ...mixed, toggleCheck));
  expect(screen.getByText("2 of 3 correct")).toBeInTheDocument();
});

test("no score shows while Check is off or no card lies in a zone", () => {
  for (const board of [
    boardAfter(appDeck, ...mixed),
    boardAfter(appDeck, toggleCheck),
    boardAfter(appDeck, choose(habitat.id), toggleCheck),
  ]) {
    setUp(appDeck, board);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live).toBeEmptyDOMElement();
    expect(screen.queryByText(/ of \d+ correct$/)).toBeNull();
    cleanup();
  }
});

test("Retry shows only while Check is on and a card in a zone is incorrect, and dispatches retry", async () => {
  for (const board of [
    boardAfter(appDeck),
    boardAfter(appDeck, ...mixed),
    boardAfter(appDeck, toggleCheck),
    boardAfter(
      appDeck,
      choose(habitat.id),
      place(right1, answer(right1)),
      toggleCheck,
    ),
  ]) {
    setUp(appDeck, board);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    cleanup();
  }
  const { user, dispatch } = setUp(
    appDeck,
    boardAfter(appDeck, ...mixed, toggleCheck),
  );
  const retry = screen.getByRole("button", { name: "Retry" });
  expect(retry).toBeEnabled();
  await user.click(retry);
  expect(dispatch).toHaveBeenCalledExactlyOnceWith({
    type: "retry",
    random: zero,
  });
});

test("a card is not a button and holds one button, its ⓘ", () => {
  for (const board of [
    boardAfter(appDeck),
    boardAfter(appDeck, ...mixed, toggleCheck),
  ]) {
    setUp(appDeck, board);
    for (const name of names) {
      expect(screen.getByText(name).tagName).toBe("SPAN");
      const card = cardNamed(name);
      expect(card.tagName).toBe("DIV");
      expect(card).not.toHaveAttribute("role");
      expect(card).not.toHaveAttribute("tabindex");
      const buttons = within(card).getAllByRole("button");
      expect(buttons).toEqual([infoOf(name)]);
      expect(buttons[0]).toHaveTextContent(/^ⓘ$/);
      expect(buttons[0]).toHaveAttribute("type", "button");
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    cleanup();
  }
});

test("pressing a card's ⓘ opens a panel headed by the card's name, before and after a dimension is chosen", async () => {
  for (const [deck, board, name] of [
    [appDeck, boardAfter(appDeck), afterLoad[2]],
    [appDeck, boardAfter(appDeck, ...mixed, toggleCheck), wrong1],
    [numbered, boardAfter(numbered), "Shark"],
  ] as const) {
    const { user, dispatch } = setUp(deck, board);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(infoOf(name));
    const panel = screen.getByRole("dialog", { name });
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(
      within(panel).getByRole("heading", { level: 2, name }),
    ).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Close" })).toHaveFocus();
    expect(screen.queryByText(/card-\d/)).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
});

test("Close closes the card's panel", async () => {
  const { user, dispatch } = setUp(appDeck, boardAfter(appDeck, ...mixed));
  const info = infoOf(right1);
  await user.click(info);
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(info).toHaveFocus();
  await user.click(info);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(info).toHaveFocus();
  expect(dispatch).not.toHaveBeenCalled();
});

test("a pointer press on a card's ⓘ stops at the ⓘ, and one on the card's name does not", () => {
  for (const [board, name] of [
    [boardAfter(appDeck), afterLoad[0]],
    [boardAfter(appDeck, ...mixed), right1],
  ] as const) {
    const outside = vi.fn();
    render(
      <div onPointerDown={outside}>
        <Board deck={appDeck} board={board} dispatch={vi.fn()} random={zero} />
      </div>,
    );
    fireEvent.pointerDown(infoOf(name));
    expect(outside).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText(name));
    expect(outside).toHaveBeenCalledOnce();
    cleanup();
  }
});

// A deck as a learner makes it: first with no card and no dimension, then
// with cards and still no dimension.
const empty: Deck = {
  id: "deck-3",
  name: "Biology",
  dimensions: [],
  cards: [],
};
const cardsOnly: Deck = { ...empty, cards: numbered.cards };

const fields = ["New card", "New dimension", "New category"];

test("given no acts, the board shows no field", () => {
  for (const [deck, board] of [
    [empty, boardAfter(empty)],
    [numbered, boardAfter(numbered)],
    [numbered, boardAfter(numbered, choose("dimension-1"))],
    [appDeck, boardAfter(appDeck, ...mixed, toggleCheck)],
  ] as const) {
    setUp(deck, board);
    expect(screen.queryByRole("textbox")).toBeNull();
    for (const label of fields)
      expect(screen.queryByPlaceholderText(label)).toBeNull();
    cleanup();
  }
});

test("given acts, New card ends the pool, New dimension ends the picker and New category follows the zones only while a dimension is chosen", () => {
  setUp(numbered, boardAfter(numbered), actsOf(numbered));
  for (const label of fields.slice(0, 2))
    expect(field(label)).toHaveAttribute("placeholder", label);
  let pool = region("Unsorted");
  expect(pool.lastElementChild).toContainElement(field("New card"));
  expect(pool.lastElementChild!.previousElementSibling).toBe(
    cardNamed("Shark"),
  );
  let picker = screen.getByRole("group", { name: "Sort by" });
  expect(picker.lastElementChild).toContainElement(field("New dimension"));
  expect(picker.lastElementChild!.previousElementSibling).toContainElement(
    screen.getByRole("button", { name: "Diet" }),
  );
  expect(screen.queryByRole("textbox", { name: "New category" })).toBeNull();
  expect(screen.getAllByRole("textbox")).toHaveLength(2);
  cleanup();

  setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    actsOf(numbered),
  );
  pool = region("Unsorted");
  picker = screen.getByRole("group", { name: "Sort by" });
  expect(pool.lastElementChild).toContainElement(field("New card"));
  expect(picker.lastElementChild).toContainElement(field("New dimension"));
  const zones = screen.getAllByRole("region").slice(1);
  expect(zones.map((zone) => labelOf(zone).textContent)).toEqual([
    "Ocean",
    "Forest",
  ]);
  const box = zones.at(-1)!.nextElementSibling!;
  expect(box).toContainElement(field("New category"));
  expect(field("New category")).toHaveAttribute("placeholder", "New category");
  expect(box.nextElementSibling).toBeNull();
  expect(box.tagName).toBe("DIV");
  expect(box).not.toHaveAttribute("role");
  expect(box).toHaveClass("board-new-category");
  expect(screen.getAllByRole("textbox")).toHaveLength(3);
});

test("Enter in New card calls addCard with the text as typed", async () => {
  const added: Deck = {
    ...numbered,
    cards: [...numbered.cards, { id: "card-3", name: "Seal", answers: {} }],
  };
  const acts = actsOf(numbered, { addCard: { ok: true, deck: added } });
  const { user, dispatch } = setUp(numbered, boardAfter(numbered), acts);
  await user.type(field("New card"), "  Seal {Enter}");
  expect(acts.addCard).toHaveBeenCalledExactlyOnceWith("  Seal ");
  expect(field("New card")).toHaveValue("");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(acts.addDimension).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});

test("Enter in New dimension calls addDimension and dispatches chooseDimension for the new dimension with the deck the act returned", async () => {
  const added: Deck = {
    ...numbered,
    dimensions: [
      ...numbered.dimensions,
      { id: "dimension-3", name: "Size", categories: [] },
    ],
  };
  const acts = actsOf(numbered, { addDimension: { ok: true, deck: added } });
  const { user, dispatch } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    acts,
  );
  await user.type(field("New dimension"), "Size{Enter}");
  expect(acts.addDimension).toHaveBeenCalledExactlyOnceWith("Size");
  expect(dispatch).toHaveBeenCalledExactlyOnceWith(
    { type: "chooseDimension", dimension: "dimension-3", random: zero },
    added,
  );
  expect(dispatch.mock.calls[0][1]).toBe(added);
  expect(field("New dimension")).toHaveValue("");
});

test("Enter in New category calls addCategory with the chosen dimension's id", async () => {
  const added: Deck = {
    ...numbered,
    dimensions: [
      numbered.dimensions[0],
      {
        ...numbered.dimensions[1],
        categories: [
          ...numbered.dimensions[1].categories,
          { id: "category-5", name: "Omnivore" },
        ],
      },
    ],
  };
  const acts = actsOf(numbered, { addCategory: { ok: true, deck: added } });
  const { user, dispatch } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-2")),
    acts,
  );
  await user.type(field("New category"), "Omnivore{Enter}");
  expect(acts.addCategory).toHaveBeenCalledExactlyOnceWith(
    "dimension-2",
    "Omnivore",
  );
  expect(field("New category")).toHaveValue("");
  expect(dispatch).not.toHaveBeenCalled();
});

test("a refused name shows its words under its field, naming the deck for a card or a dimension and the dimension for a category", async () => {
  for (const [label, act, typed, refusal, words] of [
    [
      "New card",
      "addCard",
      "Shark",
      { refused: "nameTaken", kind: "card", name: "Shark" },
      'The deck "Animals" already has a card called "Shark".',
    ],
    [
      "New card",
      "addCard",
      "  ",
      { refused: "noName", kind: "card" },
      "A card needs a name.",
    ],
    [
      "New dimension",
      "addDimension",
      "Habitat",
      { refused: "nameTaken", kind: "dimension", name: "Habitat" },
      'The deck "Animals" already has a dimension called "Habitat".',
    ],
    [
      "New dimension",
      "addDimension",
      " ",
      { refused: "noName", kind: "dimension" },
      "A dimension needs a name.",
    ],
    [
      "New category",
      "addCategory",
      "Carnivore",
      { refused: "nameTaken", kind: "category", name: "Carnivore" },
      'The dimension "Diet" already has a category called "Carnivore".',
    ],
    [
      "New category",
      "addCategory",
      "   ",
      { refused: "noName", kind: "category" },
      "A category needs a name.",
    ],
  ] as const) {
    const acts = actsOf(numbered, { [act]: { ok: false, refusal } });
    const { user, dispatch } = setUp(
      numbered,
      boardAfter(numbered, choose("dimension-2")),
      acts,
    );
    await user.type(field(label), `${typed}{Enter}`);
    expect(acts[act]).toHaveBeenCalledOnce();
    const line = screen.getByRole("alert");
    expect(line).toHaveTextContent(words, { normalizeWhitespace: false });
    expect(line.textContent).toBe(words);
    expect(field(label).nextElementSibling).toBe(line);
    expect(field(label)).toHaveAccessibleDescription(words);
    expect(field(label)).toHaveValue(typed);
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }

  // A category whose dimension is gone is no name refused: the field shows
  // nothing and empties.
  const acts = actsOf(numbered, {
    addCategory: {
      ok: false,
      refusal: { refused: "gone", kind: "dimension", id: "dimension-2" },
    },
  });
  const { user } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-2")),
    acts,
  );
  await user.type(field("New category"), "Omnivore{Enter}");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(field("New category")).toHaveValue("");
});

test("a deck with no dimension reads Add cards and a dimension to begin", () => {
  for (const deck of [empty, cardsOnly]) {
    setUp(deck, boardAfter(deck), actsOf(deck));
    const prompt = screen.getByText("Add cards and a dimension to begin");
    expect(prompt).toHaveClass("board-prompt");
    expect(region("Unsorted").nextElementSibling).toContainElement(prompt);
    expect(screen.queryByText("Choose how to sort to begin")).toBeNull();
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(
      within(screen.getByRole("group", { name: "Sort by" })).queryAllByRole(
        "button",
      ),
    ).toEqual([]);
    expect(field("New card")).toBeInTheDocument();
    expect(field("New dimension")).toBeInTheDocument();
    cleanup();
  }
});

test("a deck with a dimension reads Choose how to sort to begin before one is chosen", () => {
  setUp(numbered, boardAfter(numbered), actsOf(numbered));
  const prompt = screen.getByText("Choose how to sort to begin");
  expect(prompt).toHaveClass("board-prompt");
  expect(region("Unsorted").nextElementSibling).toContainElement(prompt);
  expect(screen.queryByText("Add cards and a dimension to begin")).toBeNull();
});

/** The ⓘ of the dimension named `name`. */
function dimensionInfo(name: string): HTMLElement {
  return within(screen.getByRole("button", { name }).parentElement!).getByRole(
    "button",
    { name: "ⓘ" },
  );
}

/** The ⓘ of the zone named `name`. */
function zoneInfo(name: string): HTMLElement {
  return within(labelOf(region(name)).parentElement!).getByRole("button", {
    name: "ⓘ",
  });
}

/** Asserts that `panel` holds Delete alone in a row of its own at its end, and returns Delete. */
function deleteIn(panel: HTMLElement): HTMLElement {
  const remove = within(panel).getByRole("button", { name: "Delete" });
  expect(remove).toHaveAttribute("type", "button");
  expect(remove).toHaveClass("panel-delete");
  const row = remove.parentElement!;
  expect(row).toHaveClass("panel-row");
  expect([...row.children]).toEqual([remove]);
  expect(panel.lastElementChild).toBe(row);
  return remove;
}

/** The acts called so far, by name. */
function called(acts: ReturnType<typeof actsOf>): string[] {
  return Object.entries(acts)
    .filter(([, act]) => act.mock.calls.length > 0)
    .map(([name]) => name);
}

test("given no acts, no dimension and no zone holds an ⓘ and a card's panel holds no Delete", async () => {
  for (const [deck, board, card] of [
    [numbered, boardAfter(numbered, choose("dimension-1")), "Shark"],
    [appDeck, boardAfter(appDeck, ...mixed, toggleCheck), right1],
  ] as const) {
    const { user } = setUp(deck, board);
    const picker = screen.getByRole("group", { name: "Sort by" });
    expect(within(picker).queryAllByRole("button", { name: "ⓘ" })).toEqual([]);
    for (const button of within(picker).getAllByRole("button"))
      expect(button).not.toHaveClass("picker-dimension-info");
    for (const zone of screen.getAllByRole("region").slice(1))
      expect(
        within(labelOf(zone).parentElement!).queryAllByRole("button"),
      ).toEqual([]);
    expect(screen.getAllByRole("button", { name: "ⓘ" })).toHaveLength(
      deck.cards.length,
    );
    await user.click(infoOf(card));
    const panel = screen.getByRole("dialog", { name: card });
    expect(within(panel).getAllByRole("button")).toEqual([
      within(panel).getByRole("button", { name: "Close" }),
    ]);
    expect(within(panel).queryByRole("button", { name: "Delete" })).toBeNull();
    cleanup();
  }
});

test("given acts, each dimension holds an ⓘ beside its button and each zone's label holds one after the element that names the zone", () => {
  setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    actsOf(numbered),
  );
  for (const name of ["Habitat", "Diet"]) {
    const button = screen.getByRole("button", { name });
    const info = dimensionInfo(name);
    expect(button).toHaveTextContent(/^(Habitat|Diet)$/);
    expect(button).not.toContainElement(info);
    expect(button).toHaveClass("picker-dimension", "picker-dimension-info");
    expect(info).toHaveTextContent(/^ⓘ$/);
    expect(info).toHaveAttribute("type", "button");
    expect([...button.parentElement!.children]).toEqual([button, info]);
  }
  const zones = screen.getAllByRole("region").slice(1);
  expect(zones.map((zone) => region(labelOf(zone).textContent!))).toEqual(
    zones,
  );
  for (const [zone, name] of zones.map(
    (zone, at) => [zone, ["Ocean", "Forest"][at]] as const,
  )) {
    const label = labelOf(zone);
    expect(label.textContent).toBe(name);
    expect(label.tagName).toBe("SPAN");
    const info = zoneInfo(name);
    expect(info).toHaveTextContent(/^ⓘ$/);
    expect([...label.parentElement!.children]).toEqual([label, info]);
    expect(zone.firstElementChild).toBe(label.parentElement);
  }
});

test("the ⓘ of a dimension and of a zone each open a panel headed by its name with Delete", async () => {
  const acts = actsOf(numbered);
  const { user, dispatch } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    acts,
  );
  for (const [info, name, close] of [
    [dimensionInfo("Diet"), "Diet", "{Escape}"],
    [zoneInfo("Ocean"), "Ocean", "Close"],
    [infoOf("Shark"), "Shark", "Close"],
  ] as const) {
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(info);
    const panel = screen.getByRole("dialog", { name });
    expect(
      within(panel).getByRole("heading", { level: 2, name }),
    ).toBeInTheDocument();
    deleteIn(panel);
    expect(within(panel).getByRole("button", { name: "Close" })).toHaveFocus();
    if (close === "Close")
      await user.click(within(panel).getByRole("button", { name: "Close" }));
    else await user.keyboard(close);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(info).toHaveFocus();
  }
  expect(called(acts)).toEqual([]);
  expect(dispatch).not.toHaveBeenCalled();
});

test("Delete in a card's panel asks the card's question, and confirming calls deleteCard and closes the question and the panel", async () => {
  const acts = actsOf(numbered);
  const { user, dispatch } = setUp(numbered, boardAfter(numbered), acts);
  await user.click(infoOf("Shark"));
  await user.click(deleteIn(screen.getByRole("dialog", { name: "Shark" })));
  const question = screen.getByRole("alertdialog", {
    name: 'Delete the card "Shark"? Its answers will be lost.',
  });
  expect(called(acts)).toEqual([]);
  await user.click(within(question).getByRole("button", { name: "Delete" }));
  expect(acts.deleteCard).toHaveBeenCalledExactlyOnceWith("card-1");
  expect(called(acts)).toEqual(["deleteCard"]);
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(dispatch).not.toHaveBeenCalled();
});

test("Delete in a category's panel asks the question that counts its cards, and confirming calls deleteCategory with the chosen dimension", async () => {
  // In `partial` Deer and Owl have Forest as their answer, Platypus none.
  for (const [deck, dimension, category, id, words] of [
    [
      partial,
      "habitat",
      "Forest",
      "forest",
      'Delete the category "Forest"? 2 cards\' answers will be lost.',
    ],
    [
      numbered,
      "dimension-2",
      "Carnivore",
      "category-4",
      'Delete the category "Carnivore"? 1 card\'s answer will be lost.',
    ],
  ] as const) {
    const acts = actsOf(deck);
    const { user, dispatch } = setUp(
      deck,
      boardAfter(deck, choose(dimension)),
      acts,
    );
    await user.click(zoneInfo(category));
    await user.click(deleteIn(screen.getByRole("dialog", { name: category })));
    const question = screen.getByRole("alertdialog", { name: words });
    await user.click(within(question).getByRole("button", { name: "Delete" }));
    expect(acts.deleteCategory).toHaveBeenCalledExactlyOnceWith(dimension, id);
    expect(called(acts)).toEqual(["deleteCategory"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
});

test("Delete in a dimension's panel asks the question that counts its categories, and confirming calls deleteDimension", async () => {
  const acts = actsOf(numbered);
  const { user, dispatch } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    acts,
  );
  await user.click(dimensionInfo("Diet"));
  await user.click(deleteIn(screen.getByRole("dialog", { name: "Diet" })));
  const question = screen.getByRole("alertdialog", {
    name: 'Delete the dimension "Diet"? 2 categories and their answers will be lost.',
  });
  await user.click(within(question).getByRole("button", { name: "Delete" }));
  expect(acts.deleteDimension).toHaveBeenCalledExactlyOnceWith("dimension-2");
  expect(called(acts)).toEqual(["deleteDimension"]);
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(dispatch).not.toHaveBeenCalled();
});

test("Cancel closes the question and keeps the panel and calls no act", async () => {
  const acts = actsOf(numbered);
  const { user, dispatch } = setUp(
    numbered,
    boardAfter(numbered, choose("dimension-1")),
    acts,
  );
  for (const [info, name] of [
    [infoOf("Shark"), "Shark"],
    [dimensionInfo("Habitat"), "Habitat"],
    [zoneInfo("Forest"), "Forest"],
  ] as const) {
    await user.click(info);
    const panel = screen.getByRole("dialog", { name });
    const remove = deleteIn(panel);
    await user.click(remove);
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("dialog", { name })).toBe(panel);
    expect(remove).toHaveFocus();
    await user.click(within(panel).getByRole("button", { name: "Close" }));
  }
  expect(called(acts)).toEqual([]);
  expect(dispatch).not.toHaveBeenCalled();
});

test("a panel closes when the deck no longer holds its thing", async () => {
  const withoutShark: Deck = { ...numbered, cards: [numbered.cards[1]] };
  const withoutDiet: Deck = {
    ...numbered,
    dimensions: [numbered.dimensions[0]],
  };
  const withoutOcean: Deck = {
    ...numbered,
    dimensions: [
      {
        ...numbered.dimensions[0],
        categories: [numbered.dimensions[0].categories[1]],
      },
      numbered.dimensions[1],
    ],
  };
  const withoutHabitat: Deck = {
    ...numbered,
    dimensions: [numbered.dimensions[1]],
  };
  for (const [info, name, after, asking] of [
    [() => infoOf("Shark"), "Shark", withoutShark, true],
    [() => dimensionInfo("Diet"), "Diet", withoutDiet, false],
    [() => zoneInfo("Ocean"), "Ocean", withoutOcean, true],
    [() => zoneInfo("Ocean"), "Ocean", withoutHabitat, true],
  ] as const) {
    const acts = actsOf(numbered);
    const { user, renderAgain } = setUp(
      numbered,
      boardAfter(numbered, choose("dimension-1")),
      acts,
    );
    await user.click(info());
    const panel = screen.getByRole("dialog", { name });
    if (asking) await user.click(deleteIn(panel));
    renderAgain(
      after,
      boardAfter(
        after,
        ...(after === withoutHabitat ? [] : [choose("dimension-1")]),
      ),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(called(acts)).toEqual([]);
    cleanup();
  }
});

/**
 * The board of `partial` with Habitat chosen, its cards in a fixed order, each
 * in the zone of the category `places` gives it or else in the pool.
 */
function habitatOf(
  places: Record<string, string> = {},
  checking = false,
): BoardState {
  const order = ["shark", "deer", "platypus", "owl"];
  return {
    dimension: "habitat",
    order,
    places: Object.fromEntries(
      order.map((card) => [
        card,
        Object.hasOwn(places, card)
          ? { kind: "zone", category: places[card] }
          : { kind: "pool" },
      ]),
    ),
    checking,
  };
}

/** The "Save answers" button of the bar. */
function saveButton(): HTMLElement {
  return within(
    screen.getByRole("group", { name: "Sort by" }).parentElement!,
  ).getByRole("button", { name: "Save answers" });
}

/** Presses "Save answers" in the open question. */
async function confirmSave(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Save answers",
    }),
  );
}

test("given no acts, the board shows no Save answers", () => {
  for (const [deck, board] of [
    [empty, boardAfter(empty)],
    [numbered, boardAfter(numbered)],
    [partial, habitatOf({ shark: "forest", deer: "forest" })],
    [appDeck, boardAfter(appDeck, ...mixed, toggleCheck)],
  ] as const) {
    setUp(deck, board);
    expect(screen.queryByRole("button", { name: "Save answers" })).toBeNull();
    expect(screen.queryByText("Save answers")).toBeNull();
    cleanup();
  }
});

test("Save answers calls saveAnswers at once when it changes no existing answer", async () => {
  // Shark and Deer lie in their answers' zones, Platypus has no answer, and
  // Owl lies in the pool.
  for (const checking of [false, true]) {
    const acts = actsOf(partial);
    const dispatch = vi.fn<BoardProps["dispatch"]>();
    const user = userEvent.setup();
    render(
      <Board
        deck={partial}
        board={habitatOf(
          { shark: "ocean", deer: "forest", platypus: "ocean" },
          checking,
        )}
        dispatch={dispatch}
        random={zero}
        acts={acts}
        account={<button type="button">Probe</button>}
      />,
    );
    const save = saveButton();
    expect(save).toHaveAttribute("type", "button");
    expect(save).toBeEnabled();
    expect(save).toHaveClass("board-action", "board-save");
    expect(save.previousElementSibling).toHaveAttribute("aria-live", "polite");
    expect(save.nextElementSibling).toBe(
      screen.getByRole("button", { name: "Probe" }),
    );
    await user.click(save);
    expect(acts.saveAnswers).toHaveBeenCalledExactlyOnceWith("habitat", [
      { card: "shark", category: "ocean" },
      { card: "deer", category: "forest" },
      { card: "platypus", category: "ocean" },
    ]);
    expect(called(acts)).toEqual(["saveAnswers"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
});

test("Save answers asks how many cards' answers change, and calls saveAnswers only once the learner confirms", async () => {
  for (const [places, words] of [
    [
      { shark: "forest", deer: "ocean", platypus: "ocean", owl: "forest" },
      'Change the answers of 2 cards for the dimension "Habitat"?',
    ],
    [
      { shark: "forest", platypus: "ocean", owl: "forest" },
      'Change the answers of 1 card for the dimension "Habitat"?',
    ],
  ] as const) {
    const acts = actsOf(partial);
    const { user, dispatch, renderAgain } = setUp(
      partial,
      habitatOf(places),
      acts,
    );
    const save = saveButton();
    await user.click(save);
    const question = screen.getByRole("alertdialog", { name: words });
    expect(
      within(question).getByRole("button", { name: "Save answers" }),
    ).toBeInTheDocument();
    expect(called(acts)).toEqual([]);
    // Owl goes back to the pool while the question shows; confirming reads
    // the board as it is then.
    const { owl: _, ...withoutOwl } = places;
    renderAgain(partial, habitatOf(withoutOwl));
    await confirmSave(user);
    expect(acts.saveAnswers).toHaveBeenCalledExactlyOnceWith(
      "habitat",
      Object.entries(withoutOwl).map(([card, category]) => ({
        card,
        category,
      })),
    );
    expect(called(acts)).toEqual(["saveAnswers"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(save).toHaveFocus();
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
});

test("Cancel in the question calls nothing", async () => {
  const acts = actsOf(partial);
  const { user, dispatch } = setUp(
    partial,
    habitatOf({ shark: "forest", deer: "ocean" }),
    acts,
  );
  const save = saveButton();
  await user.click(save);
  await user.click(
    within(
      screen.getByRole("alertdialog", {
        name: 'Change the answers of 2 cards for the dimension "Habitat"?',
      }),
    ).getByRole("button", { name: "Cancel" }),
  );
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(save).toHaveFocus();
  expect(called(acts)).toEqual([]);
  expect(dispatch).not.toHaveBeenCalled();
});

test("Save answers calls nothing while no dimension is chosen or no card lies in a zone", async () => {
  for (const [deck, board] of [
    [numbered, boardAfter(numbered)],
    [numbered, boardAfter(numbered, choose("dimension-1"), toggleCheck)],
    [partial, habitatOf()],
  ] as const) {
    const acts = actsOf(deck);
    const { user, dispatch } = setUp(deck, board, acts);
    expect(saveButton()).toBeEnabled();
    await user.click(saveButton());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(called(acts)).toEqual([]);
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
  // The question shows, and by the time the learner confirms no dimension is
  // chosen or every card has gone back to the pool.
  for (const after of [habitatOf(), boardAfter(partial)]) {
    const acts = actsOf(partial);
    const { user, dispatch, renderAgain } = setUp(
      partial,
      habitatOf({ shark: "forest" }),
      acts,
    );
    await user.click(saveButton());
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    renderAgain(partial, after);
    await confirmSave(user);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(called(acts)).toEqual([]);
    expect(dispatch).not.toHaveBeenCalled();
    cleanup();
  }
});
