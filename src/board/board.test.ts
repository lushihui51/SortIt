import { expect, test } from "vitest";
import {
  type BoardState,
  createBoardReducer,
  emptyBoard,
  type RandomSource,
  shuffle,
} from "./board";
import type { ItemSet } from "../set/itemSet";

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

const set: ItemSet = {
  dimensions: [
    { name: "Habitat", categories: ["Ocean", "Forest"] },
    { name: "Diet", categories: ["Herbivore", "Carnivore"] },
  ],
  items: [
    { name: "Shark", answers: { Habitat: "Ocean", Diet: "Carnivore" } },
    { name: "Deer", answers: { Habitat: "Forest", Diet: "Herbivore" } },
    { name: "Whale", answers: { Habitat: "Ocean", Diet: "Carnivore" } },
    { name: "Wolf", answers: { Habitat: "Forest", Diet: "Carnivore" } },
  ],
};

const reduce = createBoardReducer(set);
const pool = { kind: "pool" } as const;
const zone = (category: string) => ({ kind: "zone", category }) as const;
const allInPool = { Shark: pool, Deer: pool, Whale: pool, Wolf: pool };

function loaded(): BoardState {
  return reduce(emptyBoard, { type: "load", random: zeros() });
}

function habitat(): BoardState {
  return reduce(loaded(), {
    type: "chooseDimension",
    dimension: "Habitat",
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

test("load puts every item in the pool in the shuffled order with no dimension and no selection", () => {
  expect(loaded()).toEqual({
    dimension: null,
    places: allInPool,
    order: ["Deer", "Whale", "Wolf", "Shark"],
    selected: null,
  });
});

test("chooseDimension with the current dimension returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, {
      type: "chooseDimension",
      dimension: "Habitat",
      random: zeros(),
    }),
  ).toBe(state);
});

test("chooseDimension with a name the set lacks returns the same state", () => {
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
  state = reduce(state, { type: "place", item: "Shark", place: zone("Ocean") });
  state = reduce(state, { type: "select", item: "Deer" });
  expect(state.order).toEqual(["Whale", "Wolf", "Shark", "Deer"]);
  expect(
    reduce(state, {
      type: "chooseDimension",
      dimension: "Diet",
      random: zeros(),
    }),
  ).toEqual({
    dimension: "Diet",
    places: allInPool,
    order: ["Wolf", "Shark", "Deer", "Whale"],
    selected: null,
  });
});

test("select before a dimension is chosen returns the same state", () => {
  const state = loaded();
  expect(reduce(state, { type: "select", item: "Shark" })).toBe(state);
});

test("select on an item the board lacks returns the same state", () => {
  const state = habitat();
  expect(reduce(state, { type: "select", item: "toString" })).toBe(state);
});

test("select selects the card", () => {
  const state = habitat();
  expect(reduce(state, { type: "select", item: "Shark" })).toEqual({
    ...state,
    selected: "Shark",
  });
});

test("select on the selected card clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", item: "Shark" });
  expect(reduce(selected, { type: "select", item: "Shark" })).toEqual(state);
});

test("select on another card moves the selection", () => {
  const selected = reduce(habitat(), { type: "select", item: "Shark" });
  expect(reduce(selected, { type: "select", item: "Deer" })).toEqual({
    ...selected,
    selected: "Deer",
  });
});

test("dragStart clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", item: "Shark" });
  expect(reduce(selected, { type: "dragStart", item: "Deer" })).toEqual(state);
});

test("dragStart with no selection returns the same state", () => {
  const state = habitat();
  expect(reduce(state, { type: "dragStart", item: "Shark" })).toBe(state);
});

test("place before a dimension is chosen returns the same state", () => {
  const state = loaded();
  expect(
    reduce(state, { type: "place", item: "Shark", place: zone("Ocean") }),
  ).toBe(state);
});

test("place into a zone of the chosen dimension moves the card and clears the selection", () => {
  const state = habitat();
  const selected = reduce(state, { type: "select", item: "Shark" });
  expect(
    reduce(selected, { type: "place", item: "Shark", place: zone("Ocean") }),
  ).toEqual({
    ...state,
    places: { ...allInPool, Shark: zone("Ocean") },
  });
});

test("place into a zone of a category the dimension lacks returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, { type: "place", item: "Shark", place: zone("Herbivore") }),
  ).toBe(state);
});

test("place of an item the board lacks returns the same state", () => {
  const state = habitat();
  expect(
    reduce(state, { type: "place", item: "Lion", place: zone("Ocean") }),
  ).toBe(state);
});

test("place back into the pool moves the card", () => {
  const state = habitat();
  const placed = reduce(state, {
    type: "place",
    item: "Shark",
    place: zone("Ocean"),
  });
  expect(reduce(placed, { type: "place", item: "Shark", place: pool })).toEqual(
    state,
  );
});

test("place where the card already lies, with no selection, returns the same state", () => {
  const placed = reduce(habitat(), {
    type: "place",
    item: "Shark",
    place: zone("Ocean"),
  });
  expect(
    reduce(placed, { type: "place", item: "Shark", place: zone("Ocean") }),
  ).toBe(placed);
});

test("reset returns every card to the pool, reshuffles, clears the selection and keeps the dimension", () => {
  let state = habitat();
  state = reduce(state, { type: "place", item: "Shark", place: zone("Ocean") });
  state = reduce(state, { type: "place", item: "Deer", place: zone("Forest") });
  state = reduce(state, { type: "select", item: "Whale" });
  expect(reduce(state, { type: "reset", random: zeros() })).toEqual({
    dimension: "Habitat",
    places: allInPool,
    order: ["Wolf", "Shark", "Deer", "Whale"],
    selected: null,
  });
});

test("no action changes the state, the action or the set it is given", () => {
  const before = structuredClone(set);
  let state = habitat();
  const actions = [
    { type: "select", item: "Shark" },
    { type: "place", item: "Shark", place: zone("Ocean") },
    { type: "select", item: "Deer" },
    { type: "dragStart", item: "Deer" },
    { type: "place", item: "Deer", place: pool },
    { type: "reset", random: zeros() },
    { type: "chooseDimension", dimension: "Diet", random: zeros() },
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
  expect(set).toEqual(before);
});
