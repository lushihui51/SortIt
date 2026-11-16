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

function firstDeck(id: string): Deck {
  return {
    id,
    name: "Animals",
    dimensions: [
      {
        id: `${id}-dimension`,
        name: "Habitat",
        categories: [{ id: `${id}-category`, name: "Ocean" }],
      },
    ],
    cards: [
      {
        id: `${id}-card`,
        name: "Shark",
        answers: { [`${id}-dimension`]: `${id}-category` },
      },
    ],
  };
}

test("startLearner adds the learner's row and the deck on the first call", async () => {
  const t = setup();

  expect(
    await t
      .withIdentity(a)
      .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") }),
  ).toBeNull();
  expect(await tables(t)).toEqual({
    decks: [{ ...firstDeck("deck-1"), owner: "user_a" }],
    learners: [{ learner: "user_a" }],
  });
});

test("a second startLearner adds nothing", async () => {
  const t = setup();
  await t
    .withIdentity(a)
    .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") });
  const before = await tables(t);

  expect(
    await t
      .withIdentity(a)
      .mutation(api.learners.startLearner, { deck: firstDeck("deck-2") }),
  ).toBeNull();
  expect(
    await t
      .withIdentity(a)
      .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") }),
  ).toBeNull();
  expect(await tables(t)).toEqual(before);
});

test("startLearner adds nothing for a learner who has deleted every deck", async () => {
  const t = setup();
  await t
    .withIdentity(a)
    .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") });
  await t.withIdentity(a).mutation(api.decks.deleteDeck, { deck: "deck-1" });

  expect(
    await t
      .withIdentity(a)
      .mutation(api.learners.startLearner, { deck: firstDeck("deck-2") }),
  ).toBeNull();
  expect(await tables(t)).toEqual({
    decks: [],
    learners: [{ learner: "user_a" }],
  });
});

test("startLearner throws for a caller who is not signed in", async () => {
  const t = setup();

  await expect(
    t.mutation(api.learners.startLearner, { deck: firstDeck("deck-1") }),
  ).rejects.toThrow();
  expect(await tables(t)).toEqual({ decks: [], learners: [] });
});

test("startLearner throws and writes nothing on a first call whose deck's id a deck already holds", async () => {
  const t = setup();
  await t
    .withIdentity(b)
    .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") });
  const before = await tables(t);

  await expect(
    t
      .withIdentity(a)
      .mutation(api.learners.startLearner, { deck: firstDeck("deck-1") }),
  ).rejects.toThrow();
  expect(await tables(t)).toEqual(before);
});
