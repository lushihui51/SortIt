import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Deck } from "./model/deck";
import schema from "./schema";
import { modules } from "./test.setup";

const a = { subject: "user_a" };
const b = { subject: "user_b" };

function setup() {
  return convexTest(schema, modules);
}

type Backend = ReturnType<typeof setup>;

/** Every document of both tables, without the fields Convex adds. */
async function tables(t: Backend) {
  return await t.run(async (ctx) => ({
    decks: (await ctx.db.query("decks").collect()).map(
      ({ _id, _creationTime, ...deck }) => deck,
    ),
    learners: (await ctx.db.query("learners").collect()).map(
      ({ _id, _creationTime, ...row }) => row,
    ),
  }));
}

/** A deck holding a dimension, a category and a card with an answer, written straight into the table. */
async function insertFullDeck(t: Backend, owner: string, id: string) {
  const deck: Deck = {
    id,
    name: "Animals",
    dimensions: [
      {
        id: "dimension-1",
        name: "Habitat",
        categories: [{ id: "category-1", name: "Ocean" }],
      },
    ],
    cards: [
      { id: "card-1", name: "Shark", answers: { "dimension-1": "category-1" } },
    ],
  };
  await t.run(async (ctx) => {
    await ctx.db.insert("decks", { ...deck, owner });
  });
  return deck;
}

test("list returns the caller's decks in the order they were made and none of another learner's", async () => {
  const t = setup();
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-1", name: "Zoo" });
  await t
    .withIdentity(b)
    .mutation(api.decks.createDeck, { id: "deck-2", name: "Farm" });
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-3", name: "Animals" });

  expect(await t.withIdentity(a).query(api.decks.list, {})).toEqual([
    { id: "deck-1", name: "Zoo", dimensions: [], cards: [] },
    { id: "deck-3", name: "Animals", dimensions: [], cards: [] },
  ]);
  expect(await t.withIdentity(b).query(api.decks.list, {})).toEqual([
    { id: "deck-2", name: "Farm", dimensions: [], cards: [] },
  ]);
});

test("list returns no deck and get returns null to a caller who is not signed in", async () => {
  const t = setup();
  await insertFullDeck(t, a.subject, "deck-1");

  expect(await t.query(api.decks.list, {})).toEqual([]);
  expect(await t.query(api.decks.get, { id: "deck-1" })).toBeNull();
});

test("get returns the caller's deck by its id as a Deck with no owner, and null for another learner's deck and for an id no deck holds", async () => {
  const t = setup();
  const deck = await insertFullDeck(t, a.subject, "deck-1");
  await insertFullDeck(t, b.subject, "deck-2");

  const got = await t.withIdentity(a).query(api.decks.get, { id: "deck-1" });
  expect(got).toEqual(deck);
  expect(Object.keys(got ?? {}).sort()).toEqual([
    "cards",
    "dimensions",
    "id",
    "name",
  ]);
  expect(
    await t.withIdentity(a).query(api.decks.get, { id: "deck-2" }),
  ).toBeNull();
  expect(
    await t.withIdentity(a).query(api.decks.get, { id: "deck-9" }),
  ).toBeNull();
});

test("createDeck adds a deck owned by the caller and returns null", async () => {
  const t = setup();

  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-1", name: "  Zoo " }),
  ).toBeNull();
  expect(await tables(t)).toEqual({
    decks: [
      { id: "deck-1", owner: "user_a", name: "Zoo", dimensions: [], cards: [] },
    ],
    learners: [],
  });
});

test("createDeck returns the refusal and writes nothing for an empty name and for a name the caller already uses", async () => {
  const t = setup();
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-1", name: "Zoo" });
  const before = await tables(t);

  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-2", name: "  " }),
  ).toEqual({ refused: "noName", kind: "deck" });
  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-3", name: " Zoo" }),
  ).toEqual({ refused: "nameTaken", kind: "deck", name: "Zoo" });
  expect(await tables(t)).toEqual(before);
});

test("createDeck keeps a name another learner uses", async () => {
  const t = setup();
  await t
    .withIdentity(b)
    .mutation(api.decks.createDeck, { id: "deck-1", name: "Zoo" });

  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-2", name: "Zoo" }),
  ).toBeNull();
  expect(await t.withIdentity(a).query(api.decks.list, {})).toEqual([
    { id: "deck-2", name: "Zoo", dimensions: [], cards: [] },
  ]);
});

test("createDeck throws when a deck already holds the id", async () => {
  const t = setup();
  await t
    .withIdentity(b)
    .mutation(api.decks.createDeck, { id: "deck-1", name: "Zoo" });
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-2", name: "Farm" });
  const before = await tables(t);

  await expect(
    t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-1", name: "Animals" }),
  ).rejects.toThrow();
  await expect(
    t
      .withIdentity(a)
      .mutation(api.decks.createDeck, { id: "deck-2", name: "Animals" }),
  ).rejects.toThrow();
  expect(await tables(t)).toEqual(before);
});

test("renameDeck renames the caller's deck, and returns the refusal and writes nothing for a name the caller already uses", async () => {
  const t = setup();
  const deck = await insertFullDeck(t, a.subject, "deck-1");
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-2", name: "Farm" });

  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.renameDeck, { deck: "deck-1", name: " Zoo " }),
  ).toBeNull();
  expect(
    await t.withIdentity(a).query(api.decks.get, { id: "deck-1" }),
  ).toEqual({
    ...deck,
    name: "Zoo",
  });

  const before = await tables(t);
  expect(
    await t
      .withIdentity(a)
      .mutation(api.decks.renameDeck, { deck: "deck-1", name: "Farm" }),
  ).toEqual({ refused: "nameTaken", kind: "deck", name: "Farm" });
  expect(await tables(t)).toEqual(before);
});

test("deleteDeck deletes the caller's deck", async () => {
  const t = setup();
  await insertFullDeck(t, a.subject, "deck-1");
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-2", name: "Farm" });

  expect(
    await t.withIdentity(a).mutation(api.decks.deleteDeck, { deck: "deck-1" }),
  ).toBeNull();
  expect(await tables(t)).toEqual({
    decks: [
      {
        id: "deck-2",
        owner: "user_a",
        name: "Farm",
        dimensions: [],
        cards: [],
      },
    ],
    learners: [],
  });
});

test("renameDeck and deleteDeck throw for another learner's deck and write nothing", async () => {
  const t = setup();
  await insertFullDeck(t, b.subject, "deck-1");
  await t
    .withIdentity(a)
    .mutation(api.decks.createDeck, { id: "deck-2", name: "Farm" });
  const before = await tables(t);

  await expect(
    t
      .withIdentity(a)
      .mutation(api.decks.renameDeck, { deck: "deck-1", name: "Zoo" }),
  ).rejects.toThrow();
  await expect(
    t.withIdentity(a).mutation(api.decks.deleteDeck, { deck: "deck-1" }),
  ).rejects.toThrow();
  expect(await tables(t)).toEqual(before);
});

test("createDeck, renameDeck and deleteDeck throw for a caller who is not signed in", async () => {
  const t = setup();
  await insertFullDeck(t, a.subject, "deck-1");
  const before = await tables(t);

  await expect(
    t.mutation(api.decks.createDeck, { id: "deck-2", name: "Zoo" }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.decks.renameDeck, { deck: "deck-1", name: "Zoo" }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.decks.deleteDeck, { deck: "deck-1" }),
  ).rejects.toThrow();
  expect(await tables(t)).toEqual(before);
});
