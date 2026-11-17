import { expect, test } from "vitest";
import type { Deck } from "./deck";
import {
  addCard,
  addCategory,
  addDimension,
  createDeck,
  deleteCard,
  deleteCategory,
  deleteDimension,
  renameCard,
  renameCategory,
  renameDeck,
  renameDimension,
  saveAnswers,
} from "./deckActs";

// Every id differs from its name, so an act that keys by a name fails the tests.
const id = {
  habitat: "dimension-1",
  diet: "dimension-2",
  ocean: "category-1",
  land: "category-2",
  plants: "category-3",
  meat: "category-4",
  shark: "card-1",
  deer: "card-2",
  frog: "card-3",
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
        { id: id.land, name: "Land" },
      ],
    },
    {
      id: id.diet,
      name: "Diet",
      categories: [
        { id: id.plants, name: "Plants" },
        { id: id.meat, name: "Meat" },
      ],
    },
  ],
  cards: [
    {
      id: id.shark,
      name: "Shark",
      answers: { [id.habitat]: id.ocean, [id.diet]: id.meat },
    },
    {
      id: id.deer,
      name: "Deer",
      answers: { [id.habitat]: id.land, [id.diet]: id.plants },
    },
    { id: id.frog, name: "Frog", answers: { [id.habitat]: id.land } },
  ],
};

const plants: Deck = {
  id: "deck-2",
  name: "Plants",
  dimensions: [],
  cards: [],
};

const decks: readonly Deck[] = [deck, plants];

const [habitat, diet] = deck.dimensions;
const [shark, deer, frog] = deck.cards;

test("createDeck returns a deck of the id and the trimmed name with no dimension and no card", () => {
  expect(createDeck(decks, { id: "deck-3", name: "  Rocks " })).toEqual({
    ok: true,
    deck: { id: "deck-3", name: "Rocks", dimensions: [], cards: [] },
  });
});

test("createDeck refuses an empty name and a name another deck of the learner bears", () => {
  expect(createDeck(decks, { id: "deck-3", name: "" })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "deck" },
  });
  expect(createDeck(decks, { id: "deck-3", name: "Plants" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "deck", name: "Plants" },
  });
});

test("renameDeck returns the deck under its new name, and unchanged under its own name", () => {
  expect(renameDeck(decks, { deck: deck.id, name: "Beasts" })).toEqual({
    ok: true,
    deck: { ...deck, name: "Beasts" },
  });
  const unchanged = renameDeck(decks, { deck: deck.id, name: "Animals" });
  expect(unchanged).toEqual({ ok: true, deck });
  expect(unchanged.ok && unchanged.deck).toBe(deck);
});

test("renameDeck refuses an empty name and a name another deck of the learner bears", () => {
  expect(renameDeck(decks, { deck: deck.id, name: " " })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "deck" },
  });
  expect(renameDeck(decks, { deck: deck.id, name: "Plants" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "deck", name: "Plants" },
  });
});

test("addCard adds the card at the end with no answer", () => {
  expect(addCard(deck, { id: "card-4", name: "Owl" })).toEqual({
    ok: true,
    deck: {
      ...deck,
      cards: [...deck.cards, { id: "card-4", name: "Owl", answers: {} }],
    },
  });
});

test("addCard refuses an empty name and a name another card bears", () => {
  expect(addCard(deck, { id: "card-4", name: "" })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "card" },
  });
  expect(addCard(deck, { id: "card-4", name: "Deer" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "card", name: "Deer" },
  });
});

test("renameCard renames the card and leaves its id and answers", () => {
  expect(renameCard(deck, { card: id.shark, name: "Ray" })).toEqual({
    ok: true,
    deck: { ...deck, cards: [{ ...shark, name: "Ray" }, deer, frog] },
  });
});

test("renameCard refuses a card the deck lacks, an empty name and a name another card bears, in that order", () => {
  expect(renameCard(deck, { card: "card-9", name: "" })).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "card", id: "card-9" },
  });
  // A card already bearing the empty name shows the empty name is refused before a taken one.
  const unnamed: Deck = {
    ...deck,
    cards: [...deck.cards, { id: "card-4", name: "", answers: {} }],
  };
  expect(renameCard(unnamed, { card: id.shark, name: " " })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "card" },
  });
  expect(renameCard(deck, { card: id.shark, name: "Deer" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "card", name: "Deer" },
  });
});

test("deleteCard removes the card, and refuses a card the deck lacks", () => {
  expect(deleteCard(deck, { card: id.deer })).toEqual({
    ok: true,
    deck: { ...deck, cards: [shark, frog] },
  });
  expect(deleteCard(deck, { card: "card-9" })).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "card", id: "card-9" },
  });
});

test("addDimension adds the dimension at the end with no category", () => {
  expect(addDimension(deck, { id: "dimension-3", name: "Size" })).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [
        ...deck.dimensions,
        { id: "dimension-3", name: "Size", categories: [] },
      ],
    },
  });
});

test("addDimension refuses an empty name and a name another dimension bears", () => {
  expect(addDimension(deck, { id: "dimension-3", name: "" })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "dimension" },
  });
  expect(addDimension(deck, { id: "dimension-3", name: "Diet" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "dimension", name: "Diet" },
  });
});

test("renameDimension renames the dimension and leaves every answer under it", () => {
  expect(
    renameDimension(deck, { dimension: id.habitat, name: "Home" }),
  ).toEqual({
    ok: true,
    deck: { ...deck, dimensions: [{ ...habitat, name: "Home" }, diet] },
  });
});

test("renameDimension refuses a dimension the deck lacks, an empty name and a name another dimension bears, in that order", () => {
  expect(renameDimension(deck, { dimension: "dimension-9", name: "" })).toEqual(
    {
      ok: false,
      refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
    },
  );
  // A dimension already bearing the empty name shows the empty name is refused before a taken one.
  const unnamed: Deck = {
    ...deck,
    dimensions: [
      ...deck.dimensions,
      { id: "dimension-3", name: "", categories: [] },
    ],
  };
  expect(renameDimension(unnamed, { dimension: id.habitat, name: "" })).toEqual(
    {
      ok: false,
      refusal: { refused: "noName", kind: "dimension" },
    },
  );
  expect(
    renameDimension(deck, { dimension: id.habitat, name: "Diet" }),
  ).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "dimension", name: "Diet" },
  });
});

test("deleteDimension removes the dimension and every card's answer under it, and refuses a dimension the deck lacks", () => {
  expect(deleteDimension(deck, { dimension: id.diet })).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [habitat],
      cards: [
        { ...shark, answers: { [id.habitat]: id.ocean } },
        { ...deer, answers: { [id.habitat]: id.land } },
        frog,
      ],
    },
  });
  expect(deleteDimension(deck, { dimension: "dimension-9" })).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
  });
});

test("addCategory adds the category at the end of its dimension", () => {
  expect(
    addCategory(deck, { dimension: id.habitat, id: "category-5", name: "Air" }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [
        {
          ...habitat,
          categories: [
            ...habitat.categories,
            { id: "category-5", name: "Air" },
          ],
        },
        diet,
      ],
    },
  });
});

test("addCategory refuses a dimension the deck lacks, an empty name and a name another category of the dimension bears, in that order", () => {
  expect(
    addCategory(deck, { dimension: "dimension-9", id: "category-5", name: "" }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
  });
  // A category already bearing the empty name shows the empty name is refused before a taken one.
  const unnamed: Deck = {
    ...deck,
    dimensions: [
      {
        ...habitat,
        categories: [...habitat.categories, { id: "category-5", name: "" }],
      },
      diet,
    ],
  };
  expect(
    addCategory(unnamed, { dimension: id.habitat, id: "category-6", name: "" }),
  ).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "category" },
  });
  expect(
    addCategory(deck, {
      dimension: id.habitat,
      id: "category-5",
      name: "Land",
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "category", name: "Land" },
  });
});

test("addCategory keeps a name a category of another dimension bears", () => {
  expect(
    addCategory(deck, { dimension: id.diet, id: "category-5", name: "Ocean" }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [
        habitat,
        {
          ...diet,
          categories: [...diet.categories, { id: "category-5", name: "Ocean" }],
        },
      ],
    },
  });
});

test("renameCategory renames the category and leaves every answer that is it", () => {
  expect(
    renameCategory(deck, {
      dimension: id.habitat,
      category: id.land,
      name: "Earth",
    }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [
        {
          ...habitat,
          categories: [
            { id: id.ocean, name: "Ocean" },
            { id: id.land, name: "Earth" },
          ],
        },
        diet,
      ],
    },
  });
});

test("renameCategory refuses a dimension the deck lacks, a category the dimension lacks, an empty name and a name another category of the dimension bears, in that order", () => {
  expect(
    renameCategory(deck, {
      dimension: "dimension-9",
      category: "category-9",
      name: "",
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
  });
  // A category of another dimension is a category this dimension lacks.
  expect(
    renameCategory(deck, {
      dimension: id.habitat,
      category: id.meat,
      name: "",
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "category", id: id.meat },
  });
  // A category already bearing the empty name shows the empty name is refused before a taken one.
  const unnamed: Deck = {
    ...deck,
    dimensions: [
      {
        ...habitat,
        categories: [...habitat.categories, { id: "category-5", name: "" }],
      },
      diet,
    ],
  };
  expect(
    renameCategory(unnamed, {
      dimension: id.habitat,
      category: id.land,
      name: "",
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "category" },
  });
  expect(
    renameCategory(deck, {
      dimension: id.habitat,
      category: id.land,
      name: "Ocean",
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "category", name: "Ocean" },
  });
});

test("deleteCategory removes the category and the answer of every card that had it, and refuses a dimension or a category the deck lacks", () => {
  expect(
    deleteCategory(deck, { dimension: id.habitat, category: id.land }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      dimensions: [
        { ...habitat, categories: [{ id: id.ocean, name: "Ocean" }] },
        diet,
      ],
      cards: [
        shark,
        { ...deer, answers: { [id.diet]: id.plants } },
        { ...frog, answers: {} },
      ],
    },
  });
  expect(
    deleteCategory(deck, { dimension: "dimension-9", category: id.land }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
  });
  expect(
    deleteCategory(deck, { dimension: id.habitat, category: id.meat }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "category", id: id.meat },
  });
});

test("saveAnswers sets the answer of each card it is given and leaves every other answer", () => {
  expect(
    saveAnswers(deck, {
      dimension: id.diet,
      answers: [
        { card: id.frog, category: id.plants },
        { card: id.shark, category: id.plants },
        // Among a card's entries, the last one stands.
        { card: id.shark, category: id.meat },
        { card: id.deer, category: id.meat },
      ],
    }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      cards: [
        shark,
        { ...deer, answers: { [id.habitat]: id.land, [id.diet]: id.meat } },
        { ...frog, answers: { [id.habitat]: id.land, [id.diet]: id.plants } },
      ],
    },
    leftOut: { cards: [], categories: [] },
  });
});

test("saveAnswers leaves out a card the deck lacks and a category the dimension lacks, sets the rest and returns each id left out once", () => {
  expect(
    saveAnswers(deck, {
      dimension: id.diet,
      answers: [
        { card: "card-9", category: id.plants },
        // A category of another dimension is a category this dimension lacks.
        { card: id.frog, category: id.ocean },
        { card: id.deer, category: id.meat },
        { card: "card-8", category: "category-9" },
        { card: "card-9", category: id.meat },
        { card: id.shark, category: id.ocean },
      ],
    }),
  ).toEqual({
    ok: true,
    deck: {
      ...deck,
      cards: [
        shark,
        { ...deer, answers: { [id.habitat]: id.land, [id.diet]: id.meat } },
        frog,
      ],
    },
    leftOut: {
      cards: ["card-9", "card-8"],
      categories: [id.ocean, "category-9"],
    },
  });
});

test("saveAnswers refuses only a dimension the deck lacks", () => {
  expect(
    saveAnswers(deck, {
      dimension: "dimension-9",
      answers: [{ card: id.shark, category: id.ocean }],
    }),
  ).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "dimension-9" },
  });
  const allLeftOut = saveAnswers(deck, {
    dimension: id.habitat,
    answers: [{ card: "card-9", category: "category-9" }],
  });
  expect(allLeftOut).toEqual({
    ok: true,
    deck,
    leftOut: { cards: ["card-9"], categories: ["category-9"] },
  });
  expect(allLeftOut.ok && allLeftOut.deck).toBe(deck);
});

test("a name is trimmed before it is checked and kept", () => {
  expect(addCard(deck, { id: "card-4", name: "\t Owl \n" })).toEqual({
    ok: true,
    deck: {
      ...deck,
      cards: [...deck.cards, { id: "card-4", name: "Owl", answers: {} }],
    },
  });
  expect(addCard(deck, { id: "card-4", name: " \n " })).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "card" },
  });
  expect(addCard(deck, { id: "card-4", name: "  Deer " })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "card", name: "Deer" },
  });
  expect(
    renameDimension(deck, { dimension: id.habitat, name: " Diet " }),
  ).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "dimension", name: "Diet" },
  });
  expect(createDeck(decks, { id: "deck-3", name: " Plants" })).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "deck", name: "Plants" },
  });
  // Names are compared character for character once trimmed.
  expect(addCard(deck, { id: "card-4", name: "deer" })).toEqual({
    ok: true,
    deck: {
      ...deck,
      cards: [...deck.cards, { id: "card-4", name: "deer", answers: {} }],
    },
  });
});

test("an act that changes nothing returns the deck it was given, the same object", () => {
  const results = [
    renameDeck(decks, { deck: deck.id, name: " Animals " }),
    renameCard(deck, { card: id.shark, name: "Shark " }),
    renameDimension(deck, { dimension: id.habitat, name: "Habitat" }),
    renameCategory(deck, {
      dimension: id.habitat,
      category: id.ocean,
      name: " Ocean",
    }),
    saveAnswers(deck, {
      dimension: id.habitat,
      answers: [
        { card: id.shark, category: id.ocean },
        { card: id.frog, category: id.land },
      ],
    }),
  ];
  for (const result of results) {
    expect(result.ok && result.deck).toBe(deck);
  }
});

/** Freezes `value` and everything it holds, so that a write to any of it throws. */
function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const held of Object.values(value)) deepFreeze(held);
    Object.freeze(value);
  }
  return value;
}

test("no act changes the deck, the decks or the arguments it is given", () => {
  const given = deepFreeze({
    deck: JSON.parse(JSON.stringify(deck)) as Deck,
    decks: JSON.parse(JSON.stringify(decks)) as Deck[],
    args: {
      createDeck: { id: "deck-3", name: " Rocks " },
      renameDeck: { deck: deck.id, name: " Beasts " },
      addCard: { id: "card-4", name: " Owl " },
      renameCard: { card: id.shark, name: " Ray " },
      deleteCard: { card: id.shark },
      addDimension: { id: "dimension-3", name: " Size " },
      renameDimension: { dimension: id.habitat, name: " Home " },
      deleteDimension: { dimension: id.habitat },
      addCategory: { dimension: id.habitat, id: "category-5", name: " Air " },
      renameCategory: {
        dimension: id.habitat,
        category: id.land,
        name: " Earth ",
      },
      deleteCategory: { dimension: id.habitat, category: id.land },
      saveAnswers: {
        dimension: id.diet,
        answers: [
          { card: id.frog, category: id.meat },
          { card: id.deer, category: id.meat },
          { card: "card-9", category: "category-9" },
        ],
      },
    },
  });
  const before = JSON.stringify(given);

  // A frozen value throws on any write, so each call proves its act writes nothing.
  createDeck(given.decks, given.args.createDeck);
  renameDeck(given.decks, given.args.renameDeck);
  addCard(given.deck, given.args.addCard);
  renameCard(given.deck, given.args.renameCard);
  deleteCard(given.deck, given.args.deleteCard);
  addDimension(given.deck, given.args.addDimension);
  renameDimension(given.deck, given.args.renameDimension);
  deleteDimension(given.deck, given.args.deleteDimension);
  addCategory(given.deck, given.args.addCategory);
  renameCategory(given.deck, given.args.renameCategory);
  deleteCategory(given.deck, given.args.deleteCategory);
  saveAnswers(given.deck, given.args.saveAnswers);

  expect(JSON.stringify(given)).toBe(before);
});
