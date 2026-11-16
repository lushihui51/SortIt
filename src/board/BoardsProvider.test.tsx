import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { fitBoard, shuffle, type RandomSource } from "./board";
import { BoardsProvider, useDeckBoard } from "./BoardsProvider";

afterEach(cleanup);

// With every draw 0, each shuffle is a fixed rotation of the order before it.
const zero = () => 0;

const deck: Deck = {
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
  ],
  cards: [
    { id: "card-1", name: "Shark", answers: { "dimension-1": "category-1" } },
    { id: "card-2", name: "Deer", answers: { "dimension-1": "category-2" } },
    { id: "card-3", name: "Owl", answers: { "dimension-1": "category-2" } },
  ],
};
const ids = deck.cards.map((card) => card.id);
const other: Deck = { ...deck, id: "deck-2", name: "More animals" };

type DeckBoard = ReturnType<typeof useDeckBoard>;

/** What each `Screen` returned at its last render, keyed by deck id. */
let seen: Record<string, DeckBoard> = {};
/** Every board each `Screen` returned, in the order of its renders, keyed by deck id. */
let renders: Record<string, DeckBoard["board"][]> = {};
afterEach(() => {
  seen = {};
  renders = {};
});

function Screen({ deck, random }: { deck: Deck; random?: RandomSource }) {
  const result = useDeckBoard(deck, random);
  seen[deck.id] = result;
  (renders[deck.id] ??= []).push(result.board);
  return null;
}

test("useDeckBoard loads a deck's board in the shuffled order", () => {
  render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
    </BoardsProvider>,
  );
  expect(renders[deck.id][0]).toBeNull();
  expect(seen[deck.id].board).toEqual({
    dimension: null,
    places: Object.fromEntries(ids.map((id) => [id, { kind: "pool" }])),
    order: shuffle(ids, zero),
    checking: false,
  });
  expect(seen[deck.id].board!.order).not.toEqual(ids);
});

test("useDeckBoard keeps a deck's board while its screen unmounts and mounts again", () => {
  const { rerender } = render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
    </BoardsProvider>,
  );
  act(() => {
    seen[deck.id].dispatch({
      type: "chooseDimension",
      dimension: "dimension-1",
      random: zero,
    });
    seen[deck.id].dispatch({
      type: "place",
      card: "card-2",
      place: { kind: "zone", category: "category-2" },
    });
    seen[deck.id].dispatch({ type: "toggleCheck" });
  });
  const left = seen[deck.id].board;
  expect(left!.places["card-2"]).toEqual({
    kind: "zone",
    category: "category-2",
  });
  rerender(<BoardsProvider>{null}</BoardsProvider>);
  renders = {};
  rerender(
    <BoardsProvider>
      <Screen deck={deck} random={() => 0.5} />
    </BoardsProvider>,
  );
  expect(renders[deck.id]).not.toContain(null);
  expect(seen[deck.id].board).toBe(left);
});

test("useDeckBoard keeps one board for each deck id", () => {
  const sameId: Deck = { ...deck, name: "Animals again" };
  const { rerender } = render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
      <Screen deck={other} random={zero} />
    </BoardsProvider>,
  );
  act(() => {
    seen[deck.id].dispatch({
      type: "chooseDimension",
      dimension: "dimension-1",
      random: zero,
    });
  });
  expect(seen[deck.id].board!.dimension).toBe("dimension-1");
  expect(seen[other.id].board!.dimension).toBeNull();
  const kept = seen[deck.id].board;
  rerender(
    <BoardsProvider>
      <Screen deck={sameId} random={() => 0.5} />
      <Screen deck={other} random={zero} />
    </BoardsProvider>,
  );
  expect(seen[deck.id].board).toBe(kept);
});

test("useDeckBoard returns the board fitted to the deck it is given", () => {
  const { rerender } = render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
    </BoardsProvider>,
  );
  act(() => {
    seen[deck.id].dispatch({
      type: "chooseDimension",
      dimension: "dimension-1",
      random: zero,
    });
    seen[deck.id].dispatch({
      type: "place",
      card: "card-2",
      place: { kind: "zone", category: "category-2" },
    });
    seen[deck.id].dispatch({
      type: "place",
      card: "card-1",
      place: { kind: "zone", category: "category-1" },
    });
  });
  const stored = seen[deck.id].board!;
  // Forest is gone, Owl is gone and Crab is new.
  const changed: Deck = {
    ...deck,
    dimensions: [
      {
        ...deck.dimensions[0],
        categories: [deck.dimensions[0].categories[0]],
      },
    ],
    cards: [
      deck.cards[0],
      deck.cards[1],
      { id: "card-4", name: "Crab", answers: { "dimension-1": "category-1" } },
    ],
  };
  rerender(
    <BoardsProvider>
      <Screen deck={changed} random={zero} />
    </BoardsProvider>,
  );
  const fitted = seen[deck.id].board!;
  expect(fitted).toEqual(fitBoard(stored, changed));
  expect(fitted.order).toEqual([
    ...stored.order.filter((id) => id !== "card-3"),
    "card-4",
  ]);
  expect(fitted.places).toEqual({
    "card-1": { kind: "zone", category: "category-1" },
    "card-2": { kind: "pool" },
    "card-4": { kind: "pool" },
  });
});

test("the dispatch of useDeckBoard applies an action to its own deck's board", () => {
  const { rerender } = render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
      <Screen deck={other} random={zero} />
    </BoardsProvider>,
  );
  const untouched = seen[other.id].board;
  act(() => {
    seen[deck.id].dispatch({
      type: "chooseDimension",
      dimension: "dimension-1",
      random: zero,
    });
    seen[deck.id].dispatch({ type: "toggleCheck" });
  });
  expect(seen[deck.id].board).toMatchObject({
    dimension: "dimension-1",
    checking: true,
    order: shuffle(shuffle(ids, zero), zero),
  });
  expect(seen[other.id].board).toBe(untouched);

  // The dispatch of an earlier render carries the deck as it stands now: a
  // card may be placed in a category added since.
  const dispatch = seen[deck.id].dispatch;
  const grown: Deck = {
    ...deck,
    dimensions: [
      {
        ...deck.dimensions[0],
        categories: [
          ...deck.dimensions[0].categories,
          { id: "category-9", name: "Desert" },
        ],
      },
    ],
  };
  rerender(
    <BoardsProvider>
      <Screen deck={grown} random={zero} />
      <Screen deck={other} random={zero} />
    </BoardsProvider>,
  );
  act(() => {
    dispatch({
      type: "place",
      card: "card-3",
      place: { kind: "zone", category: "category-9" },
    });
  });
  expect(seen[deck.id].board!.places["card-3"]).toEqual({
    kind: "zone",
    category: "category-9",
  });
  expect(seen[other.id].board).toBe(untouched);
});

test("the dispatch of useDeckBoard sends an action with the deck it is handed in place of the deck of the last render", () => {
  // The deck an act adding Diet returned, not yet given to `Screen`.
  const grown: Deck = {
    ...deck,
    dimensions: [
      ...deck.dimensions,
      { id: "dimension-2", name: "Diet", categories: [] },
    ],
  };
  // The board of the deck's id fitted to `grown`, where Diet stays in sight
  // while `Screen` still shows `deck`.
  let viewed: DeckBoard["board"] = null;
  function Viewer() {
    viewed = useDeckBoard(grown, zero).board;
    return null;
  }
  render(
    <BoardsProvider>
      <Screen deck={deck} random={zero} />
      <Viewer />
    </BoardsProvider>,
  );

  act(() => {
    seen[deck.id].dispatch(
      { type: "chooseDimension", dimension: "dimension-2", random: zero },
      grown,
    );
  });
  expect(viewed!.dimension).toBe("dimension-2");

  // The next action carries the deck of the last render, which has no Diet,
  // so the board it fits leaves no dimension chosen.
  act(() => {
    seen[deck.id].dispatch({ type: "reset", random: zero });
  });
  expect(viewed!.dimension).toBeNull();
});
