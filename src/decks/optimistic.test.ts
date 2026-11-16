import type { OptimisticLocalStore } from "convex/browser";
import { getFunctionName } from "convex/server";
import type { FunctionReference } from "convex/server";
import { expect, test } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Deck } from "../../convex/model/deck";
import { createDeckLocally, deleteDeckLocally } from "./optimistic";

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
