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
import { appDeck } from "../deck/appDeck";
import Board from "./Board";
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

function setUp(deck: Deck, board: BoardState) {
  const user = userEvent.setup();
  const dispatch = vi.fn<(action: DeckBoardAction) => void>();
  render(<Board deck={deck} board={board} dispatch={dispatch} random={zero} />);
  return { user, dispatch };
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
