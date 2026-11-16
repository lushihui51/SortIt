import { expect, test } from "vitest";
import {
  type BoardAction,
  type BoardState,
  type BoardsState,
  boardsReducer as reduce,
  fitBoard,
  markOf,
  noBoards,
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

// Every draw of 0 swaps the last unshuffled element with the first, so each
// shuffle of `count + 1` cards rotates the order left by one.
const zeros = (count = 3) => fixedRandom(Array<number>(count).fill(0));

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
  frog: "card-5",
  lion: "card-6",
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

const frog = {
  id: id.frog,
  name: "Frog",
  answers: { [id.habitat]: id.forest },
};

/** The deck with Frog last, which has no answer under Diet. */
const frogDeck: Deck = { ...deck, cards: [...deck.cards, frog] };

const deckWithoutWolf: Deck = {
  ...deck,
  cards: deck.cards.filter((card) => card.id !== id.wolf),
};

const otherDeck: Deck = {
  id: "deck-2",
  name: "Fruit",
  dimensions: [
    {
      id: "dimension-9",
      name: "Colour",
      categories: [{ id: "category-9", name: "Red" }],
    },
  ],
  cards: [
    { id: "card-9", name: "Apple", answers: { "dimension-9": "category-9" } },
    { id: "card-10", name: "Cherry", answers: { "dimension-9": "category-9" } },
  ],
};

const pool = { kind: "pool" } as const;
const zone = (category: string) => ({ kind: "zone", category }) as const;
const allInPool = {
  [id.shark]: pool,
  [id.deer]: pool,
  [id.whale]: pool,
  [id.wolf]: pool,
};

function loaded(of: Deck = deck): BoardsState {
  return reduce(noBoards, {
    type: "load",
    deck: of,
    random: zeros(of.cards.length - 1),
  });
}

/** Habitat chosen, Check off, every card in the pool, order Whale, Wolf, Shark, Deer. */
function habitat(): BoardsState {
  return reduce(loaded(), {
    type: "chooseDimension",
    deck,
    dimension: id.habitat,
    random: zeros(),
  });
}

function place(
  state: BoardsState,
  card: string,
  category: string | null,
  of: Deck = deck,
): BoardsState {
  return reduce(state, {
    type: "place",
    deck: of,
    card,
    place: category === null ? pool : zone(category),
  });
}

function toggle(state: BoardsState, deckId: string = deck.id): BoardsState {
  return reduce(state, { type: "toggleCheck", deckId });
}

/** Habitat chosen, Check off, order Whale, Wolf, Shark, Deer, and only Shark in its answer's zone. */
function placedOneRight(): BoardsState {
  let state = habitat();
  state = place(state, id.shark, id.ocean);
  state = place(state, id.whale, id.forest);
  state = place(state, id.wolf, id.ocean);
  state = place(state, id.deer, id.ocean);
  return state;
}

/** Frog's deck with Diet chosen, Check off, and every card in the pool. */
function frogDiet(): BoardsState {
  return reduce(loaded(frogDeck), {
    type: "chooseDimension",
    deck: frogDeck,
    dimension: id.diet,
    random: zeros(4),
  });
}

function boardOf(state: BoardsState, of: Deck = deck): BoardState {
  return state[of.id];
}

test("shuffle gives the Fisher-Yates order for a fixed sequence and leaves the list unchanged", () => {
  const list = ["a", "b", "c", "d", "e"];
  const random = fixedRandom([0.5, 0.1, 0.9, 0.3]);
  expect(shuffle(list, random)).toEqual(["b", "d", "e", "a", "c"]);
  expect(random.calls()).toBe(4);
  expect(list).toEqual(["a", "b", "c", "d", "e"]);
});

test("load gives a deck with no board a board with every card in the pool in the shuffled order, no dimension and Check off", () => {
  const random = zeros();
  expect(reduce(noBoards, { type: "load", deck, random })).toEqual({
    [deck.id]: {
      dimension: null,
      places: allInPool,
      order: [id.deer, id.whale, id.wolf, id.shark],
      checking: false,
    },
  });
  expect(random.calls()).toBe(3);
  const both = reduce(loaded(), {
    type: "load",
    deck: otherDeck,
    random: zeros(1),
  });
  expect(boardOf(both, otherDeck)).toEqual({
    dimension: null,
    places: { "card-9": pool, "card-10": pool },
    order: ["card-10", "card-9"],
    checking: false,
  });
});

test("load on a deck that has a board returns the same state", () => {
  const state = place(habitat(), id.shark, id.ocean);
  expect(reduce(state, { type: "load", deck, random: zeros() })).toBe(state);
  expect(
    reduce(state, { type: "load", deck: frogDeck, random: zeros(4) }),
  ).toBe(state);
});

test("every action but load on a deck with no board returns the same state", () => {
  const actions: BoardAction[] = [
    {
      type: "chooseDimension",
      deck,
      dimension: id.habitat,
      random: zeros(),
    },
    { type: "place", deck, card: id.shark, place: pool },
    { type: "toggleCheck", deckId: deck.id },
    { type: "retry", deck, random: zeros() },
    { type: "reset", deck, random: zeros() },
  ];
  const other = loaded(otherDeck);
  for (const action of actions) {
    expect(reduce(noBoards, action)).toBe(noBoards);
    expect(reduce(other, action)).toBe(other);
  }
});

test("an action on one deck leaves every other deck's board the same object", () => {
  const state = reduce(habitat(), {
    type: "load",
    deck: otherDeck,
    random: zeros(1),
  });
  const placed = place(state, id.shark, id.ocean);
  expect(placed).not.toBe(state);
  expect(boardOf(placed, otherDeck)).toBe(boardOf(state, otherDeck));
  const checked = toggle(state, otherDeck.id);
  expect(boardOf(checked, otherDeck).checking).toBe(true);
  expect(boardOf(checked)).toBe(boardOf(state));
});

test("chooseDimension sets the dimension, returns every card to the pool, reshuffles and leaves Check as it was", () => {
  const state = place(habitat(), id.shark, id.ocean);
  const choose = (from: BoardsState) =>
    reduce(from, {
      type: "chooseDimension",
      deck,
      dimension: id.diet,
      random: zeros(),
    });
  expect(boardOf(choose(state))).toEqual({
    dimension: id.diet,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    checking: false,
  });
  expect(boardOf(choose(toggle(state)))).toEqual({
    dimension: id.diet,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    checking: true,
  });
});

test("chooseDimension with the chosen dimension or an id the deck lacks returns the same state", () => {
  const state = place(habitat(), id.shark, id.ocean);
  for (const dimension of [id.habitat, "Habitat", "toString"]) {
    expect(
      reduce(state, {
        type: "chooseDimension",
        deck,
        dimension,
        random: zeros(),
      }),
    ).toBe(state);
  }
  const before = loaded();
  expect(
    reduce(before, {
      type: "chooseDimension",
      deck,
      dimension: "Habitat",
      random: zeros(),
    }),
  ).toBe(before);
});

test("place moves a card into a zone of the chosen dimension, to another zone and back to the pool", () => {
  const state = habitat();
  const inOcean = place(state, id.shark, id.ocean);
  expect(boardOf(inOcean)).toEqual({
    ...boardOf(state),
    places: { ...allInPool, [id.shark]: zone(id.ocean) },
  });
  const inForest = place(inOcean, id.shark, id.forest);
  expect(boardOf(inForest)).toEqual({
    ...boardOf(state),
    places: { ...allInPool, [id.shark]: zone(id.forest) },
  });
  expect(boardOf(place(inForest, id.shark, null))).toEqual(boardOf(state));
});

test("place before a dimension is chosen, of a card the deck lacks, or into a category the dimension lacks returns the same state", () => {
  const before = loaded();
  expect(place(before, id.shark, id.ocean)).toBe(before);
  const state = habitat();
  expect(place(state, "Shark", id.ocean)).toBe(state);
  expect(place(state, "toString", id.ocean)).toBe(state);
  expect(place(state, id.frog, id.ocean)).toBe(state);
  expect(place(state, id.shark, id.herbivore)).toBe(state);
  expect(place(state, id.shark, "Ocean")).toBe(state);
});

test("place where the card already lies returns the same state", () => {
  const state = habitat();
  expect(place(state, id.shark, null)).toBe(state);
  const placed = place(state, id.shark, id.ocean);
  expect(place(placed, id.shark, id.ocean)).toBe(placed);
});

test("toggleCheck turns Check on and off and changes nothing else", () => {
  const state = place(habitat(), id.shark, id.ocean);
  const on = toggle(state);
  expect(boardOf(on)).toEqual({ ...boardOf(state), checking: true });
  const off = toggle(on);
  expect(boardOf(off)).toEqual(boardOf(state));
  const before = loaded();
  expect(boardOf(toggle(before))).toEqual({
    ...boardOf(before),
    checking: true,
  });
});

test("reset returns every card to the pool, reshuffles, and keeps the dimension and Check", () => {
  let state = place(habitat(), id.shark, id.ocean);
  state = place(state, id.deer, id.forest);
  state = toggle(state);
  expect(
    boardOf(reduce(state, { type: "reset", deck, random: zeros() })),
  ).toEqual({
    dimension: id.habitat,
    places: allInPool,
    order: [id.wolf, id.shark, id.deer, id.whale],
    checking: true,
  });
});

test("retry returns only the incorrect cards to the pool and permutes them among the positions they held", () => {
  const random = fixedRandom([0, 0]);
  const state = toggle(placedOneRight());
  expect(boardOf(reduce(state, { type: "retry", deck, random }))).toEqual({
    dimension: id.habitat,
    places: {
      [id.shark]: zone(id.ocean),
      [id.whale]: pool,
      [id.wolf]: pool,
      [id.deer]: pool,
    },
    order: [id.wolf, id.deer, id.shark, id.whale],
    checking: true,
  });
  expect(random.calls()).toBe(2);

  // Frog has no answer under Diet, so it is never incorrect and stays.
  let diet = frogDiet();
  diet = place(diet, id.frog, id.herbivore, frogDeck);
  diet = place(diet, id.shark, id.herbivore, frogDeck);
  diet = place(diet, id.whale, id.carnivore, frogDeck);
  diet = toggle(diet);
  const retried = reduce(diet, {
    type: "retry",
    deck: frogDeck,
    random: fixedRandom([]),
  });
  expect(boardOf(retried)).toEqual({
    ...boardOf(diet),
    places: { ...boardOf(diet).places, [id.shark]: pool },
  });
});

test("retry while Check is off or no card is incorrect returns the same state", () => {
  const off = placedOneRight();
  expect(reduce(off, { type: "retry", deck, random: zeros() })).toBe(off);
  const allRight = toggle(place(habitat(), id.shark, id.ocean));
  expect(reduce(allRight, { type: "retry", deck, random: zeros() })).toBe(
    allRight,
  );
  const retried = reduce(toggle(placedOneRight()), {
    type: "retry",
    deck,
    random: fixedRandom([0, 0]),
  });
  expect(reduce(retried, { type: "retry", deck, random: zeros() })).toBe(
    retried,
  );
});

test("fitBoard removes a card the deck no longer holds", () => {
  const board = boardOf(
    place(place(habitat(), id.shark, id.ocean), id.wolf, id.forest),
  );
  expect(fitBoard(board, deckWithoutWolf)).toEqual({
    dimension: id.habitat,
    places: { [id.shark]: zone(id.ocean), [id.deer]: pool, [id.whale]: pool },
    order: [id.whale, id.shark, id.deer],
    checking: false,
  });
});

test("fitBoard adds a card the board does not hold to the end of the order, in the pool", () => {
  const lion = { id: id.lion, name: "Lion", answers: {} };
  const grown: Deck = { ...deck, cards: [frog, ...deck.cards, lion] };
  const board = boardOf(toggle(place(habitat(), id.shark, id.ocean)));
  expect(fitBoard(board, grown)).toEqual({
    dimension: id.habitat,
    places: {
      ...allInPool,
      [id.shark]: zone(id.ocean),
      [id.frog]: pool,
      [id.lion]: pool,
    },
    order: [id.whale, id.wolf, id.shark, id.deer, id.frog, id.lion],
    checking: true,
  });
});

test("fitBoard returns a card to the pool when the chosen dimension no longer holds its zone's category", () => {
  const noForest: Deck = {
    ...deck,
    dimensions: [
      {
        ...deck.dimensions[0],
        categories: deck.dimensions[0].categories.filter(
          (category) => category.id !== id.forest,
        ),
      },
      deck.dimensions[1],
    ],
  };
  let state = place(habitat(), id.shark, id.ocean);
  state = place(state, id.whale, id.forest);
  expect(fitBoard(boardOf(state), noForest)).toEqual({
    dimension: id.habitat,
    places: { ...allInPool, [id.shark]: zone(id.ocean) },
    order: [id.whale, id.wolf, id.shark, id.deer],
    checking: false,
  });
});

test("fitBoard leaves no dimension chosen and every card in the pool when the deck no longer holds the chosen dimension", () => {
  const noHabitat: Deck = { ...deck, dimensions: [deck.dimensions[1]] };
  const board = boardOf(toggle(placedOneRight()));
  expect(fitBoard(board, noHabitat)).toEqual({
    dimension: null,
    places: allInPool,
    order: [id.whale, id.wolf, id.shark, id.deer],
    checking: true,
  });
});

test("fitBoard returns the same board when it already fits", () => {
  for (const state of [loaded(), habitat(), toggle(placedOneRight())]) {
    const board = boardOf(state);
    expect(fitBoard(board, deck)).toBe(board);
    expect(fitBoard(board, structuredClone(deck))).toBe(board);
  }
});

test("an action that reads the deck applies to the board fitted to the deck it carries", () => {
  // Order Whale, Wolf, Shark, Deer, with Whale in Forest, which is not its answer.
  const state = place(habitat(), id.whale, id.forest);
  expect(boardOf(place(state, id.shark, id.ocean, deckWithoutWolf))).toEqual({
    dimension: id.habitat,
    places: {
      [id.whale]: zone(id.forest),
      [id.shark]: zone(id.ocean),
      [id.deer]: pool,
    },
    order: [id.whale, id.shark, id.deer],
    checking: false,
  });
  expect(
    boardOf(
      reduce(state, { type: "reset", deck: deckWithoutWolf, random: zeros(2) }),
    ),
  ).toEqual({
    dimension: id.habitat,
    places: { [id.whale]: pool, [id.shark]: pool, [id.deer]: pool },
    order: [id.shark, id.deer, id.whale],
    checking: false,
  });
  expect(
    boardOf(
      reduce(state, {
        type: "chooseDimension",
        deck: deckWithoutWolf,
        dimension: id.diet,
        random: zeros(2),
      }),
    ),
  ).toEqual({
    dimension: id.diet,
    places: { [id.whale]: pool, [id.shark]: pool, [id.deer]: pool },
    order: [id.shark, id.deer, id.whale],
    checking: false,
  });
  const retried = reduce(toggle(state), {
    type: "retry",
    deck: deckWithoutWolf,
    random: fixedRandom([]),
  });
  expect(boardOf(retried)).toEqual({
    dimension: id.habitat,
    places: { [id.whale]: pool, [id.shark]: pool, [id.deer]: pool },
    order: [id.whale, id.shark, id.deer],
    checking: true,
  });
});

test("an action that cannot apply still stores the board fitted to the deck it carries", () => {
  const state = place(habitat(), id.whale, id.forest);
  const fitted = fitBoard(boardOf(state), deckWithoutWolf);
  const cannotApply: BoardAction[] = [
    {
      type: "place",
      deck: deckWithoutWolf,
      card: id.shark,
      place: zone(id.herbivore),
    },
    {
      type: "chooseDimension",
      deck: deckWithoutWolf,
      dimension: id.habitat,
      random: zeros(),
    },
    { type: "retry", deck: deckWithoutWolf, random: zeros() },
  ];
  for (const action of cannotApply) {
    const next = reduce(state, action);
    expect(next).not.toBe(state);
    expect(boardOf(next)).toEqual(fitted);
    expect(reduce(state, { ...action, deck } as BoardAction)).toBe(state);
  }
});

test("markOf gives correct or incorrect to a card in a zone while Check is on, and null in the pool or while Check is off", () => {
  let state = place(habitat(), id.shark, id.ocean);
  state = place(state, id.whale, id.forest);
  const off = boardOf(state);
  for (const card of [id.shark, id.whale, id.deer, id.wolf]) {
    expect(markOf(off, deck, card)).toBeNull();
  }
  const on = boardOf(toggle(state));
  expect(markOf(on, deck, id.shark)).toBe("correct");
  expect(markOf(on, deck, id.whale)).toBe("incorrect");
  expect(markOf(on, deck, id.deer)).toBeNull();
  expect(markOf(on, deck, id.wolf)).toBeNull();
  expect(markOf(on, deck, "toString")).toBeNull();
});

test("markOf gives noAnswer to a card with no answer under the chosen dimension, in the pool and in a zone, with Check on and off", () => {
  const inPool = frogDiet();
  const inZone = place(inPool, id.frog, id.herbivore, frogDeck);
  for (const state of [inPool, inZone, toggle(inPool), toggle(inZone)]) {
    expect(markOf(boardOf(state), frogDeck, id.frog)).toBe("noAnswer");
  }
});

test("markOf gives null before a dimension is chosen", () => {
  for (const state of [loaded(frogDeck), toggle(loaded(frogDeck))]) {
    for (const card of frogDeck.cards) {
      expect(markOf(boardOf(state), frogDeck, card.id)).toBeNull();
    }
  }
});

test("score counts the correct cards over the cards judged, leaving out cards in the pool and cards with no answer", () => {
  let state = frogDiet();
  state = place(state, id.frog, id.herbivore, frogDeck);
  const onlyFrog = toggle(state);
  expect(score(boardOf(onlyFrog), frogDeck)).toEqual({ correct: 0, judged: 0 });
  state = place(state, id.shark, id.carnivore, frogDeck);
  state = place(state, id.deer, id.carnivore, frogDeck);
  state = place(state, id.whale, id.carnivore, frogDeck);
  expect(score(boardOf(toggle(state)), frogDeck)).toEqual({
    correct: 2,
    judged: 3,
  });
});

test("score is null while Check is off and while no card lies in a zone", () => {
  const off = placedOneRight();
  expect(score(boardOf(off), deck)).toBeNull();
  expect(score(boardOf(toggle(habitat())), deck)).toBeNull();
  expect(score(boardOf(toggle(loaded())), deck)).toBeNull();
  expect(score(boardOf(toggle(off)), deck)).toEqual({ correct: 1, judged: 4 });
});

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}

test("no function changes the state, the action, the board or the deck it is given", () => {
  // Every input is frozen, so a write to any of them throws in a module's strict mode.
  const decks = [deck, frogDeck, deckWithoutWolf].map((of) =>
    deepFreeze(structuredClone(of)),
  );
  const [animals, withFrog, withoutWolf] = decks;
  const actions: BoardAction[] = [
    { type: "load", deck: animals, random: zeros() },
    {
      type: "chooseDimension",
      deck: animals,
      dimension: id.habitat,
      random: zeros(),
    },
    { type: "place", deck: animals, card: id.shark, place: zone(id.ocean) },
    { type: "place", deck: animals, card: id.whale, place: zone(id.forest) },
    { type: "toggleCheck", deckId: deck.id },
    { type: "retry", deck: animals, random: fixedRandom([]) },
    { type: "place", deck: withFrog, card: id.frog, place: zone(id.forest) },
    { type: "place", deck: withoutWolf, card: id.deer, place: zone(id.ocean) },
    { type: "retry", deck: withoutWolf, random: fixedRandom([]) },
    { type: "reset", deck: withFrog, random: zeros(4) },
    {
      type: "chooseDimension",
      deck: withFrog,
      dimension: id.diet,
      random: zeros(4),
    },
    { type: "load", deck: otherDeck, random: zeros(1) },
  ];
  let state: BoardsState = deepFreeze({});
  for (const action of actions) {
    state = deepFreeze(reduce(state, deepFreeze(action)));
    for (const of of decks) {
      const board = boardOf(state);
      const fitted = fitBoard(board, of);
      score(fitted, of);
      for (const card of of.cards) markOf(fitted, of, card.id);
    }
  }
  expect(boardOf(state).dimension).toBe(id.diet);
});
