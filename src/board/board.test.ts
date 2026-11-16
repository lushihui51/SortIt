import { expect, test } from "vitest";
import {
  type BoardState,
  createBoardReducer,
  emptyBoard,
  type RandomSource,
  score,
  shuffle,
} from "./board";
import type { Deck } from "../../convex/model/deck";

/** Returns the numbers of `numbers` in turn, and throws once they run out. */
function fixedRandom(
  numbers: readonly number[],
): RandomSource & { calls: () => number } {
  let calls = 0;
  const random = () => {
    if (calls >= numbers.length)
      throw new Error("the fixed random source ran out");
    return numbers[calls++];
  };
  return Object.assign(random, { calls: () => calls });
}

// Every draw of 0 swaps the last unshuffled element with the first, so each shuffle
// of four cards rotates the order left by one.
const zeros = () => fixedRandom([0, 0, 0]);

// Every id differs from its name, so a state keyed by a name fails the tests.
const id = {
  habitat: "dimension-1",
  diet: "dimension-2",
  ocean: "category-1",
  forest: "category-2",
  herbivore: "category-3",
  carnivore: "category-4",
  shark: "card-1",
  deer: "card-2",
  whale: "card-3",
  wolf: "card-4",
} as const;

const deck: Deck = {
  id: "deck-1",
  name: "Animals",
  dimensions: [
    {
      id: id.habitat,
      name: "Habitat",
      categories: [
        { id: id.ocean, name: "Ocean" },
        { id: id.forest, name: "Forest" },
      ],
    },
    {
      id: id.diet,
      name: "Diet",
      categories: [
        { id: id.herbivore, name: "Herbivore" },
        { id: id.carnivore, name: "Carnivore" },
      ],
    },
  ],
  cards: [
    {
      id: id.shark,
      name: "Shark",
      answers: { [id.habitat]: id.ocean, [id.diet]: id.carnivore },
    },
    {
      id: id.deer,
      name: "Deer",
      answers: { [id.habitat]: id.forest, [id.diet]: id.herbivore },
    },
    {
      id: id.whale,
      name: "Whale",
      answers: { [id.habitat]: id.ocean, [id.diet]: id.carnivore },
    },
    {
      id: id.wolf,
      name: "Wolf",
      answers: { [id.habitat]: id.forest, [id.diet]: id.carnivore },
    },
  ],
};

const reduce = createBoardReducer(deck);
const pool = { kind: "pool" } as const;
const zone = (category: string) => ({ kind: "zone", category }) as const;
const allInPool = {
  [id.shark]: pool,
  [id.deer]: pool,
  [id.whale]: pool,
  [id.wolf]: pool,
};

function loaded(): BoardState {
  return reduce(emptyBoard, { type: "load", random: zeros() });
}

function habitat(): BoardState {
  return reduce(loaded(), {
    type: "chooseDimension",
    dimension: id.habitat,
    random: zeros(),
  });
}

test("shuffle gives the Fisher-Yates order for a fixed sequence and leaves the list unchanged", () => {
  const list = ["a", "b", "c", "d", "e"];
  const random = fixedRandom([0.5, 0.1, 0.9, 0.3]);
  expect(shuffle(list, random)).toEqual(["b", "d", "e", "a", "c"]);
  expect(random.calls()).toBe(4);
  expect(list).toEqual(["a", "b", "c", "d", "e"]);
});

test("load puts every card in the pool in the shuffled order with no dimension and no selection", () => {
  expect(loaded()).toEqual({
    dimension: null,
    places: allInPool,
    order: [id.deer, id.whale, id.wolf, id.shark],
    marks: {},
    selected: null,
  });
});

test("chooseDimension with the current dimension returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, {
      type: "chooseDimension",
      dimension: id.habitat,
      random: zeros(),
    }),
  ).toBe(state);
});

test("chooseDimension with an id the deck lacks returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, {
      type: "chooseDimension",
      dimension: "Size",
      random: zeros(),
    }),
  ).toBe(state);
});

test("chooseDimension with another dimension sets it, empties the zones, reshuffles and clears the selection", () => {
  let state = habitat();
  state = reduce(state, {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  state = reduce(state, { type: "select", card: id.deer });
  expect(state.order).toEqual([id.whale, id.wolf, id.shark, id.deer]);
  expect(
    reduce(state, {
      type: "chooseDimension",
      dimension: id.diet,
      random: zeros(),
    }),
  ).toEqual({
    dimension: id.diet,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    marks: {},
    selected: null,
  });
});

/** Habitat chosen, order Whale, Wolf, Shark, Deer, and only Shark in its answer's zone. */
function placedOneRight(): BoardState {
  let state = habitat();
  state = reduce(state, {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  state = reduce(state, {
    type: "place",
    card: id.whale,
    place: zone(id.forest),
  });
  state = reduce(state, {
    type: "place",
    card: id.wolf,
    place: zone(id.ocean),
  });
  state = reduce(state, {
    type: "place",
    card: id.deer,
    place: zone(id.ocean),
  });
  return state;
}

const oneRightPlaces = {
  [id.shark]: zone(id.ocean),
  [id.whale]: zone(id.forest),
  [id.wolf]: zone(id.ocean),
  [id.deer]: zone(id.ocean),
};

const oneRightMarks = {
  [id.shark]: "correct",
  [id.whale]: "incorrect",
  [id.wolf]: "incorrect",
  [id.deer]: "incorrect",
} as const;

function checked(): BoardState {
  return reduce(placedOneRight(), { type: "check" });
}

test("select before a dimension is chosen returns the same state", () => {
  const state = loaded();
  expect(reduce(state, { type: "select", card: id.shark })).toBe(state);
});

test("select on a card the board lacks returns the same state", () => {
  const state = habitat();
  expect(reduce(state, { type: "select", card: "toString" })).toBe(state);
});

test("select selects the card", () => {
  const state = habitat();
  expect(reduce(state, { type: "select", card: id.shark })).toEqual({
    ...state,
    selected: id.shark,
  });
});

test("select on the selected card clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", card: id.shark });
  expect(reduce(selected, { type: "select", card: id.shark })).toEqual(state);
});

test("select on another card moves the selection", () => {
  const selected = reduce(habitat(), { type: "select", card: id.shark });
  expect(reduce(selected, { type: "select", card: id.deer })).toEqual({
    ...selected,
    selected: id.deer,
  });
});

test("dragStart clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", card: id.shark });
  expect(reduce(selected, { type: "dragStart", card: id.deer })).toEqual(state);
});

test("dragStart with no selection returns the same state", () => {
  const state = habitat();
  expect(reduce(state, { type: "dragStart", card: id.shark })).toBe(state);
});

test("place before a dimension is chosen returns the same state", () => {
  const state = loaded();
  expect(
    reduce(state, { type: "place", card: id.shark, place: zone(id.ocean) }),
  ).toBe(state);
});

test("place into a zone of the chosen dimension moves the card and clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", card: id.shark });
  expect(
    reduce(selected, { type: "place", card: id.shark, place: zone(id.ocean) }),
  ).toEqual({
    ...state,
    places: { ...allInPool, [id.shark]: zone(id.ocean) },
  });
});

test("place into a zone of a category the dimension lacks returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, { type: "place", card: id.shark, place: zone(id.herbivore) }),
  ).toBe(state);
});

test("place of a card the board lacks returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, { type: "place", card: "Lion", place: zone(id.ocean) }),
  ).toBe(state);
});

test("place back into the pool moves the card", () => {
  const state = habitat();
  const placed = reduce(state, {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  expect(
    reduce(placed, { type: "place", card: id.shark, place: pool }),
  ).toEqual(state);
});

test("place where the card already lies, with no selection, returns the same state", () => {
  const placed = reduce(habitat(), {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  expect(
    reduce(placed, { type: "place", card: id.shark, place: zone(id.ocean) }),
  ).toBe(placed);
});

test("reset returns every card to the pool, reshuffles, clears the selection and keeps the dimension", () => {
  let state = habitat();
  state = reduce(state, {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  state = reduce(state, {
    type: "place",
    card: id.deer,
    place: zone(id.forest),
  });
  state = reduce(state, { type: "select", card: id.whale });
  expect(reduce(state, { type: "reset", random: zeros() })).toEqual({
    dimension: id.habitat,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    marks: {},
    selected: null,
  });
});

test("check while a card is in the pool returns the same state", () => {
  const state = reduce(habitat(), {
    type: "place",
    card: id.shark,
    place: zone(id.ocean),
  });
  expect(reduce(state, { type: "check" })).toBe(state);
});

test("check before a dimension is chosen returns the same state", () => {
  const state = loaded();
  expect(reduce(state, { type: "check" })).toBe(state);
});

test("check marks each card correct or incorrect by where it lies and clears the selection", () => {
  const selected = reduce(placedOneRight(), { type: "select", card: id.wolf });
  expect(reduce(selected, { type: "check" })).toEqual({
    dimension: id.habitat,
    places: oneRightPlaces,
    order: [id.whale, id.wolf, id.shark, id.deer],
    marks: oneRightMarks,
    selected: null,
  });
});

test("place leaves the marks as they are", () => {
  const state = checked();
  expect(
    reduce(state, { type: "place", card: id.wolf, place: zone(id.forest) }),
  ).toEqual({
    ...state,
    places: { ...oneRightPlaces, [id.wolf]: zone(id.forest) },
  });
});

test("retry returns only the incorrect cards to the pool and permutes them among the positions they held", () => {
  const random = fixedRandom([0, 0]);
  expect(reduce(checked(), { type: "retry", random })).toEqual({
    dimension: id.habitat,
    places: {
      [id.shark]: zone(id.ocean),
      [id.whale]: pool,
      [id.wolf]: pool,
      [id.deer]: pool,
    },
    order: [id.wolf, id.deer, id.shark, id.whale],
    marks: { [id.shark]: "correct" },
    selected: null,
  });
  expect(random.calls()).toBe(2);
});

test("retry while no card is marked incorrect returns the same state", () => {
  const retried = reduce(checked(), {
    type: "retry",
    random: fixedRandom([0, 0]),
  });
  expect(reduce(retried, { type: "retry", random: zeros() })).toBe(retried);
});

test("retry before Check returns the same state", () => {
  const state = placedOneRight();
  expect(reduce(state, { type: "retry", random: zeros() })).toBe(state);
});

test("select on a marked card removes its mark", () => {
  const state = checked();
  const { [id.shark]: _shark, ...rest } = oneRightMarks;
  expect(reduce(state, { type: "select", card: id.shark })).toEqual({
    ...state,
    marks: rest,
    selected: id.shark,
  });
});

test("dragStart on a marked card removes its mark", () => {
  const state = checked();
  const { [id.shark]: _shark, ...rest } = oneRightMarks;
  expect(reduce(state, { type: "dragStart", card: id.shark })).toEqual({
    ...state,
    marks: rest,
  });
});

test("dragStart on an unmarked card with no selection returns the same state", () => {
  const state = reduce(checked(), {
    type: "retry",
    random: fixedRandom([0, 0]),
  });
  expect(reduce(state, { type: "dragStart", card: id.wolf })).toBe(state);
});

test("reset removes every mark", () => {
  expect(reduce(checked(), { type: "reset", random: zeros() })).toEqual({
    dimension: id.habitat,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    marks: {},
    selected: null,
  });
});

test("chooseDimension with another dimension removes every mark", () => {
  expect(
    reduce(checked(), {
      type: "chooseDimension",
      dimension: id.diet,
      random: zeros(),
    }),
  ).toEqual({
    dimension: id.diet,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    marks: {},
    selected: null,
  });
});

test("score is null before Check, counts the correct cards over all cards after Check, and is null once a mark is removed", () => {
  expect(score(placedOneRight())).toBeNull();
  const state = checked();
  expect(score(state)).toEqual({ correct: 1, total: 4 });
  expect(score(reduce(state, { type: "select", card: id.wolf }))).toBeNull();
});

test("no action changes the state, the action or the deck it is given", () => {
  const before = structuredClone(deck);
  let state = habitat();
  const actions = [
    { type: "select", card: id.shark },
    { type: "place", card: id.shark, place: zone(id.ocean) },
    { type: "select", card: id.deer },
    { type: "dragStart", card: id.deer },
    { type: "place", card: id.deer, place: pool },
    { type: "reset", random: zeros() },
    { type: "place", card: id.shark, place: zone(id.ocean) },
    { type: "place", card: id.whale, place: zone(id.forest) },
    { type: "place", card: id.wolf, place: zone(id.ocean) },
    { type: "place", card: id.deer, place: zone(id.ocean) },
    { type: "check" },
    { type: "retry", random: fixedRandom([0, 0]) },
    { type: "chooseDimension", dimension: id.diet, random: zeros() },
    { type: "load", random: zeros() },
  ] as const;
  for (const action of actions) {
    const snapshot = structuredClone(state);
    const actionSnapshot = { ...action };
    const next = reduce(state, action);
    expect(state).toEqual(snapshot);
    expect(action).toEqual(actionSnapshot);
    state = next;
  }
  expect(deck).toEqual(before);
});
