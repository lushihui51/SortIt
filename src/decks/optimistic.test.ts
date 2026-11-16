import type { OptimisticLocalStore } from "convex/browser";
import { getFunctionName } from "convex/server";
import type { FunctionReference } from "convex/server";
import { expect, test } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Deck } from "../../convex/model/deck";
import * as acts from "../../convex/model/deckActs";
import {
  actLocally,
  createDeckLocally,
  deleteDeckLocally,
  type ThingAct,
} from "./optimistic";

/**
 * A store of the client's queries, as Convex hands an optimistic update one,
 * keeping each query's value by its function's name and its arguments. A
 * query read with no arguments and one set with `{}` share one key, as in
 * Convex. `sets` counts the calls of `setQuery`.
 */
function storeOf(entries: [FunctionReference<"query">, object, unknown][]) {
  const values = new Map<string, unknown>();
  const key = (query: FunctionReference<"query">, args: object = {}) =>
    `${getFunctionName(query)} ${JSON.stringify(args)}`;
  for (const [query, args, value] of entries)
    values.set(key(query, args), value);
  const store = {
    sets: 0,
    getQuery: (query: FunctionReference<"query">, args?: object) =>
      values.get(key(query, args)),
    getAllQueries: () => {
      throw new Error("No function under test reads every query of a name.");
    },
    setQuery: (
      query: FunctionReference<"query">,
      args: object,
      value: unknown,
    ) => {
      store.sets += 1;
      values.set(key(query, args), value);
    },
  };
  return store as typeof store & OptimisticLocalStore;
}

function deckOf(id: string, name: string): Deck {
  return {
    id,
    name,
    dimensions: [
      { id: "d1", name: "Habitat", categories: [{ id: "c1", name: "Sea" }] },
    ],
    cards: [{ id: "k1", name: "Orca", answers: { d1: "c1" } }],
  };
}

/** Freezes the value and everything it holds, so that a change to any of it throws. */
function frozen<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const held of Object.values(value)) frozen(held);
    Object.freeze(value);
  }
  return value;
}

test("createDeckLocally adds the deck to the end of the list and sets the deck's own query to it", () => {
  const biology = deckOf("id-a", "Biology");
  const history: Deck = {
    id: "id-b",
    name: "History",
    dimensions: [],
    cards: [],
  };

  const store = storeOf([[api.decks.list, {}, [biology]]]);
  createDeckLocally(store, { id: "id-b", name: "  History " });
  expect(store.getQuery(api.decks.list)).toEqual([biology, history]);
  expect(store.getQuery(api.decks.get, { id: "id-b" })).toEqual(history);

  // The deck's own query is set as well when the store already holds a value for it.
  const held = storeOf([
    [api.decks.list, {}, [biology]],
    [api.decks.get, { id: "id-b" }, null],
  ]);
  createDeckLocally(held, { id: "id-b", name: "History" });
  expect(held.getQuery(api.decks.get, { id: "id-b" })).toEqual(history);
});

test("createDeckLocally changes nothing when the act refuses or the list has not loaded", () => {
  const biology = deckOf("id-a", "Biology");
  for (const name of ["", "   ", "Biology", " Biology "]) {
    const store = storeOf([[api.decks.list, {}, [biology]]]);
    createDeckLocally(store, { id: "id-b", name });
    expect(store.sets).toBe(0);
    expect(store.getQuery(api.decks.list)).toEqual([biology]);
    expect(store.getQuery(api.decks.get, { id: "id-b" })).toBeUndefined();
  }

  const unloaded = storeOf([]);
  createDeckLocally(unloaded, { id: "id-b", name: "History" });
  expect(unloaded.sets).toBe(0);
  expect(unloaded.getQuery(api.decks.get, { id: "id-b" })).toBeUndefined();
});

test("deleteDeckLocally takes the deck out of the list and sets the deck's own query to null", () => {
  const biology = deckOf("id-a", "Biology");
  const history = deckOf("id-b", "History");
  const store = storeOf([
    [api.decks.list, {}, [biology, history]],
    [api.decks.get, { id: "id-a" }, biology],
  ]);
  deleteDeckLocally(store, { deck: "id-a" });
  expect(store.getQuery(api.decks.list)).toEqual([history]);
  expect(store.getQuery(api.decks.get, { id: "id-a" })).toBeNull();
});

test("deleteDeckLocally changes nothing while the list has not loaded", () => {
  const biology = deckOf("id-a", "Biology");
  const store = storeOf([[api.decks.get, { id: "id-a" }, biology]]);
  deleteDeckLocally(store, { deck: "id-a" });
  expect(store.sets).toBe(0);
  expect(store.getQuery(api.decks.get, { id: "id-a" })).toEqual(biology);
});

test("neither function changes a value the store gave it", () => {
  const list = frozen([deckOf("id-a", "Biology"), deckOf("id-b", "History")]);
  const own = frozen(deckOf("id-a", "Biology"));
  const before = structuredClone({ list, own });
  const store = storeOf([
    [api.decks.list, {}, list],
    [api.decks.get, { id: "id-a" }, own],
  ]);

  createDeckLocally(store, { id: "id-c", name: "Chemistry" });
  deleteDeckLocally(store, { deck: "id-a" });

  expect({ list, own }).toEqual(before);
  const decks = store.getQuery(api.decks.list) as Deck[];
  expect(decks.map((deck) => deck.name)).toEqual(["History", "Chemistry"]);
});

/** A deck with two categories, a card with an answer and a card with none. */
const animals: Deck = {
  id: "id-a",
  name: "Animals",
  dimensions: [
    {
      id: "d1",
      name: "Habitat",
      categories: [
        { id: "c1", name: "Sea" },
        { id: "c2", name: "Land" },
      ],
    },
  ],
  cards: [
    { id: "k1", name: "Orca", answers: { d1: "c1" } },
    { id: "k2", name: "Deer", answers: {} },
  ],
};

/** Each act on a deck's things with arguments that change `animals`, without the deck's id. */
const changes: [ThingAct, Record<string, unknown>][] = [
  ["addCard", { id: "k3", name: "Crab" }],
  ["deleteCard", { card: "k1" }],
  ["addDimension", { id: "d2", name: "Diet" }],
  ["deleteDimension", { dimension: "d1" }],
  ["addCategory", { dimension: "d1", id: "c3", name: "Air" }],
  ["deleteCategory", { dimension: "d1", category: "c1" }],
  [
    "saveAnswers",
    {
      dimension: "d1",
      answers: [
        { card: "k1", category: "c2" },
        { card: "k2", category: "c2" },
      ],
    },
  ],
];

/** The deck the act of that name returns for `deck` and `args`. */
function resultOf(deck: Deck, act: ThingAct, args: object): Deck {
  const result = (acts[act] as (deck: Deck, args: object) => acts.ActResult)(
    deck,
    args,
  );
  if (!result.ok)
    throw new Error(`${act} refused in a test that changes the deck.`);
  return result.deck;
}

test("actLocally sets the deck's own query and its place in the list to the deck its act returns, for each of the seven acts", () => {
  const biology = deckOf("id-b", "Biology");
  const history = deckOf("id-c", "History");
  for (const [act, args] of changes) {
    const changed = resultOf(animals, act, args);
    expect(changed).not.toEqual(animals);
    const store = storeOf([
      [api.decks.list, {}, [biology, animals, history]],
      [api.decks.get, { id: "id-a" }, animals],
    ]);
    actLocally(store, act, { deck: "id-a", ...args });
    expect(store.getQuery(api.decks.get, { id: "id-a" })).toEqual(changed);
    expect(store.getQuery(api.decks.list)).toEqual([biology, changed, history]);
  }

  // The list is left as it is while it has not loaded or does not hold the deck.
  const [act, args] = changes[0];
  const changed = resultOf(animals, act, args);
  const unlisted = storeOf([[api.decks.get, { id: "id-a" }, animals]]);
  actLocally(unlisted, act, { deck: "id-a", ...args });
  expect(unlisted.getQuery(api.decks.get, { id: "id-a" })).toEqual(changed);
  expect(unlisted.getQuery(api.decks.list)).toBeUndefined();
  const others = [biology];
  const elsewhere = storeOf([
    [api.decks.list, {}, others],
    [api.decks.get, { id: "id-a" }, animals],
  ]);
  actLocally(elsewhere, act, { deck: "id-a", ...args });
  expect(elsewhere.getQuery(api.decks.get, { id: "id-a" })).toEqual(changed);
  expect(elsewhere.getQuery(api.decks.list)).toBe(others);
});

test("actLocally takes the deck from the list while the deck's own query holds no value, and sets both", () => {
  const biology = deckOf("id-b", "Biology");
  for (const [act, args] of changes) {
    const changed = resultOf(animals, act, args);
    const store = storeOf([[api.decks.list, {}, [animals, biology]]]);
    actLocally(store, act, { deck: "id-a", ...args });
    expect(store.getQuery(api.decks.get, { id: "id-a" })).toEqual(changed);
    expect(store.getQuery(api.decks.list)).toEqual([changed, biology]);
  }
});

test("actLocally changes nothing when the act refuses, when the deck's own query holds null, or when neither that query nor the list holds the deck", () => {
  const refused: [ThingAct, Record<string, unknown>][] = [
    ["addCard", { id: "k3", name: "Orca" }],
    ["addCard", { id: "k3", name: "  " }],
    ["deleteCard", { card: "k9" }],
    ["addDimension", { id: "d2", name: " Habitat" }],
    ["deleteDimension", { dimension: "d9" }],
    ["addCategory", { dimension: "d1", id: "c3", name: "Sea" }],
    ["addCategory", { dimension: "d9", id: "c3", name: "Air" }],
    ["deleteCategory", { dimension: "d1", category: "c9" }],
    ["saveAnswers", { dimension: "d9", answers: [] }],
  ];
  for (const [act, args] of refused) {
    const store = storeOf([
      [api.decks.list, {}, [animals]],
      [api.decks.get, { id: "id-a" }, animals],
    ]);
    actLocally(store, act, { deck: "id-a", ...args });
    expect(store.sets).toBe(0);
  }

  for (const [act, args] of changes) {
    const deleted = storeOf([
      [api.decks.list, {}, [animals]],
      [api.decks.get, { id: "id-a" }, null],
    ]);
    actLocally(deleted, act, { deck: "id-a", ...args });
    expect(deleted.sets).toBe(0);

    const absent = storeOf([[api.decks.list, {}, [deckOf("id-b", "Biology")]]]);
    actLocally(absent, act, { deck: "id-a", ...args });
    expect(absent.sets).toBe(0);

    const empty = storeOf([]);
    actLocally(empty, act, { deck: "id-a", ...args });
    expect(empty.sets).toBe(0);
  }
});

test("actLocally changes no value the store gave it", () => {
  for (const [act, args] of changes) {
    const list = frozen([deckOf("id-b", "Biology"), structuredClone(animals)]);
    const own = frozen(structuredClone(animals));
    const given = frozen(structuredClone(args));
    const before = structuredClone({ list, own, given });
    const store = storeOf([
      [api.decks.list, {}, list],
      [api.decks.get, { id: "id-a" }, own],
    ]);

    actLocally(store, act, { deck: "id-a", ...given });

    expect({ list, own, given }).toEqual(before);
    expect(store.getQuery(api.decks.get, { id: "id-a" })).toEqual(
      resultOf(animals, act, args),
    );
  }
});
