import { convexTest } from "convex-test";
import { getFunctionName } from "convex/server";
import type { FunctionReference } from "convex/server";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Deck } from "./model/deck";
import * as acts from "./model/deckActs";
import type { ActResult, SaveAnswersResult } from "./model/deckActs";
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

/** A deck of two cards, one with an answer, and one dimension of two categories, owned by `user_a` unless another owner is given. */
async function insertSortDeck(t: Backend, owner = a.subject) {
  const deck: Deck = {
    id: "deck-1",
    name: "Animals",
    dimensions: [
      {
        id: "dimension-1",
        name: "Habitat",
        categories: [
          { id: "category-1", name: "Ocean" },
          { id: "category-2", name: "Land" },
        ],
      },
    ],
    cards: [
      { id: "card-1", name: "Shark", answers: { "dimension-1": "category-1" } },
      { id: "card-2", name: "Lion", answers: {} },
    ],
  };
  await t.run(async (ctx) => {
    await ctx.db.insert("decks", { ...deck, owner });
  });
  return deck;
}

type Caller = Pick<Backend, "mutation">;

type Mutate = <Args extends Record<string, unknown>>(
  mutation: FunctionReference<"mutation", "public", Args>,
  args: Args,
) => Promise<unknown>;

/** One call of an act's mutation on deck-1, beside the act applied to the deck it is given. */
type ActCase = {
  name: string;
  call: (caller: Caller) => Promise<unknown>;
  act: (deck: Deck) => ActResult | SaveAnswersResult;
};

function actCase<A extends Record<string, unknown>>(
  mutation: FunctionReference<"mutation", "public", A & { deck: string }>,
  act: (deck: Deck, args: A) => ActResult | SaveAnswersResult,
  args: A,
): ActCase {
  return {
    name: getFunctionName(mutation),
    // `mutation` types its arguments by a conditional type that a reference
    // generic in its arguments cannot resolve, so it is called through a
    // signature that takes them as they are.
    call: (caller) =>
      (caller.mutation as Mutate)(mutation, { ...args, deck: "deck-1" }),
    act: (deck) => act(deck, args),
  };
}

// Each of the nine acts on the things of insertSortDeck's deck, with arguments it keeps.
const keptActs: ActCase[] = [
  actCase(api.decks.addCard, acts.addCard, { id: "card-3", name: "Eagle" }),
  actCase(api.decks.renameCard, acts.renameCard, {
    card: "card-1",
    name: "Whale",
  }),
  actCase(api.decks.deleteCard, acts.deleteCard, { card: "card-1" }),
  actCase(api.decks.addDimension, acts.addDimension, {
    id: "dimension-2",
    name: "Diet",
  }),
  actCase(api.decks.renameDimension, acts.renameDimension, {
    dimension: "dimension-1",
    name: "Home",
  }),
  actCase(api.decks.deleteDimension, acts.deleteDimension, {
    dimension: "dimension-1",
  }),
  actCase(api.decks.addCategory, acts.addCategory, {
    dimension: "dimension-1",
    id: "category-3",
    name: "Sky",
  }),
  actCase(api.decks.renameCategory, acts.renameCategory, {
    dimension: "dimension-1",
    category: "category-1",
    name: "Sea",
  }),
  actCase(api.decks.deleteCategory, acts.deleteCategory, {
    dimension: "dimension-1",
    category: "category-1",
  }),
];

// The ten mutations, with arguments their acts on insertSortDeck's deck keep.
const everyAct: ActCase[] = [
  ...keptActs,
  actCase(api.decks.saveAnswers, acts.saveAnswers, {
    dimension: "dimension-1",
    answers: [{ card: "card-2", category: "category-2" }],
  }),
];

// The ten mutations, with arguments their acts on insertSortDeck's deck refuse.
const refusedActs: ActCase[] = [
  actCase(api.decks.addCard, acts.addCard, { id: "card-3", name: " Lion" }),
  actCase(api.decks.renameCard, acts.renameCard, {
    card: "card-9",
    name: "Whale",
  }),
  actCase(api.decks.deleteCard, acts.deleteCard, { card: "card-9" }),
  actCase(api.decks.addDimension, acts.addDimension, {
    id: "dimension-2",
    name: "  ",
  }),
  actCase(api.decks.renameDimension, acts.renameDimension, {
    dimension: "dimension-9",
    name: "Home",
  }),
  actCase(api.decks.deleteDimension, acts.deleteDimension, {
    dimension: "dimension-9",
  }),
  actCase(api.decks.addCategory, acts.addCategory, {
    dimension: "dimension-1",
    id: "category-3",
    name: "Land",
  }),
  actCase(api.decks.renameCategory, acts.renameCategory, {
    dimension: "dimension-1",
    category: "category-9",
    name: "Sea",
  }),
  actCase(api.decks.deleteCategory, acts.deleteCategory, {
    dimension: "dimension-9",
    category: "category-1",
  }),
  actCase(api.decks.saveAnswers, acts.saveAnswers, {
    dimension: "dimension-9",
    answers: [{ card: "card-2", category: "category-2" }],
  }),
];

test("each of the nine acts' mutations writes the deck its act returns and returns null", async () => {
  for (const { name, call, act } of keptActs) {
    const t = setup();
    const deck = await insertSortDeck(t);
    const result = act(deck);
    if (!result.ok) throw new Error(`${name}: the act refuses`);
    expect(result.deck, name).not.toBe(deck);

    expect(await call(t.withIdentity(a)), name).toBeNull();
    expect(await tables(t), name).toEqual({
      decks: [{ ...result.deck, owner: "user_a" }],
      learners: [],
    });
  }
});

test("each of the ten mutations returns its act's refusal and writes nothing", async () => {
  for (const { name, call, act } of refusedActs) {
    const t = setup();
    const deck = await insertSortDeck(t);
    const result = act(deck);
    if (result.ok) throw new Error(`${name}: the act does not refuse`);
    const before = await tables(t);

    expect(await call(t.withIdentity(a)), name).toEqual(result.refusal);
    expect(await tables(t), name).toEqual(before);
  }
});

test("each of the ten mutations throws for another learner's deck and writes nothing", async () => {
  for (const { name, call } of everyAct) {
    const t = setup();
    await insertSortDeck(t, b.subject);
    const before = await tables(t);

    await expect(call(t.withIdentity(a)), name).rejects.toThrow();
    expect(await tables(t), name).toEqual(before);
  }
});

test("each of the ten mutations throws for a caller who is not signed in", async () => {
  for (const { name, call } of everyAct) {
    const t = setup();
    await insertSortDeck(t);
    const before = await tables(t);

    await expect(call(t), name).rejects.toThrow();
    expect(await tables(t), name).toEqual(before);
  }
});

test("saveAnswers writes the answers that fit and returns the ids it left out", async () => {
  const t = setup();
  const deck = await insertSortDeck(t);

  expect(
    await t.withIdentity(a).mutation(api.decks.saveAnswers, {
      deck: "deck-1",
      dimension: "dimension-1",
      answers: [
        { card: "card-2", category: "category-2" },
        { card: "card-9", category: "category-1" },
        { card: "card-1", category: "category-9" },
        { card: "card-9", category: "category-9" },
        { card: "card-1", category: "category-2" },
      ],
    }),
  ).toEqual({ cards: ["card-9"], categories: ["category-9"] });
  expect(await tables(t)).toEqual({
    decks: [
      {
        ...deck,
        owner: "user_a",
        cards: [
          {
            id: "card-1",
            name: "Shark",
            answers: { "dimension-1": "category-2" },
          },
          {
            id: "card-2",
            name: "Lion",
            answers: { "dimension-1": "category-2" },
          },
        ],
      },
    ],
    learners: [],
  });
});

test("saveAnswers whose every answer is left out leaves the deck's document as it was and returns the ids left out", async () => {
  const t = setup();
  await insertSortDeck(t);
  const documents = () =>
    t.run(async (ctx) => await ctx.db.query("decks").collect());
  const before = await documents();

  expect(
    await t.withIdentity(a).mutation(api.decks.saveAnswers, {
      deck: "deck-1",
      dimension: "dimension-1",
      answers: [
        { card: "card-9", category: "category-1" },
        { card: "card-2", category: "category-9" },
      ],
    }),
  ).toEqual({ cards: ["card-9"], categories: ["category-9"] });
  expect(await documents()).toEqual(before);
});

test("saveAnswers returns the refusal and writes nothing for a dimension the deck lacks", async () => {
  const t = setup();
  await insertSortDeck(t);
  const before = await tables(t);

  expect(
    await t.withIdentity(a).mutation(api.decks.saveAnswers, {
      deck: "deck-1",
      dimension: "dimension-9",
      answers: [{ card: "card-2", category: "category-2" }],
    }),
  ).toEqual({ refused: "gone", kind: "dimension", id: "dimension-9" });
  expect(await tables(t)).toEqual(before);
});
