/**
 * The acts on a learner's deck. Each returns the changed deck or a refusal,
 * and never changes the deck, the decks or the arguments it is given. An act
 * whose result would equal the deck it was given returns that deck, the same
 * object.
 *
 * An act that gives a name trims it first, refuses it when it is empty, and
 * refuses it when another thing of its kind bears it where it is held: another
 * of the learner's decks, another card of the deck, another dimension of the
 * deck, or another category of the same dimension. Names are compared
 * character for character.
 *
 * An act refuses before it changes anything, and checks in this order: the
 * card, dimension or category it changes is held, a category's dimension
 * before the category; the name is not empty; the name is not taken.
 */
import type { Card, Deck, Dimension } from "./deck";

export type Kind = "deck" | "card" | "dimension" | "category";

export type Refusal =
  /** Another thing of the kind, where it is held, bears `name`: the name the act was given, trimmed. */
  | { refused: "nameTaken"; kind: Kind; name: string }
  /** The name the act was given is empty once trimmed. */
  | { refused: "noName"; kind: Kind }
  /** The deck holds no card or dimension of the id, or the dimension holds no category of it. */
  | { refused: "gone"; kind: "card" | "dimension" | "category"; id: string };

export type ActResult =
  { ok: true; deck: Deck } | { ok: false; refusal: Refusal };

/** The ids a Save answers set no answer for: cards the deck does not hold, categories the dimension does not hold. */
export type LeftOut = { cards: string[]; categories: string[] };

export type SaveAnswersResult =
  { ok: true; deck: Deck; leftOut: LeftOut } | { ok: false; refusal: Refusal };

type Named = { id: string; name: string };

function refuse(refusal: Refusal): { ok: false; refusal: Refusal } {
  return { ok: false, refusal };
}

function gone(kind: "card" | "dimension" | "category", id: string): Refusal {
  return { refused: "gone", kind, id };
}

/**
 * Returns `name` trimmed, or its refusal when it is empty once trimmed or a
 * thing of `held` other than the one of id `self` bears it.
 */
function checkName(
  kind: Kind,
  name: string,
  held: readonly Named[],
  self?: string,
): string | Refusal {
  const trimmed = name.trim();
  if (trimmed === "") return { refused: "noName", kind };
  if (held.some((thing) => thing.id !== self && thing.name === trimmed))
    return { refused: "nameTaken", kind, name: trimmed };
  return trimmed;
}

/** Returns `things` with the one of id `id` under `name`. */
function renamed<T extends Named>(
  things: readonly T[],
  id: string,
  name: string,
): T[] {
  return things.map((thing) => (thing.id === id ? { ...thing, name } : thing));
}

/** Returns the card's answer under the dimension of id `dimension`, or undefined when it has none. */
function answerOf(card: Card, dimension: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(card.answers, dimension)
    ? card.answers[dimension]
    : undefined;
}

/** Returns the card without its answer under the dimension of id `dimension`. */
function withoutAnswer(card: Card, dimension: string): Card {
  return {
    ...card,
    answers: Object.fromEntries(
      Object.entries(card.answers).filter(([key]) => key !== dimension),
    ),
  };
}

/** Returns the deck with the dimension of id `id` replaced by `change` of it. */
function withDimension(
  deck: Deck,
  id: string,
  change: (dimension: Dimension) => Dimension,
): Deck {
  return {
    ...deck,
    dimensions: deck.dimensions.map((dimension) =>
      dimension.id === id ? change(dimension) : dimension,
    ),
  };
}

/**
 * Makes a deck of `args.id` and `args.name` with no dimension and no card.
 * `decks` is every deck the learner has; the act takes `args.id` as given.
 */
export function createDeck(
  decks: readonly Deck[],
  args: { id: string; name: string },
): ActResult {
  const name = checkName("deck", args.name, decks);
  if (typeof name !== "string") return refuse(name);
  return {
    ok: true,
    deck: { id: args.id, name, dimensions: [], cards: [] },
  };
}

/**
 * Returns the deck of `decks` whose id is `args.deck` under the name
 * `args.name`. `decks` is every deck the learner has, and must hold a deck of
 * id `args.deck`; the act throws when it does not.
 */
export function renameDeck(
  decks: readonly Deck[],
  args: { deck: string; name: string },
): ActResult {
  const deck = decks.find((each) => each.id === args.deck);
  if (deck === undefined)
    throw new Error(`renameDeck: no deck of the decks has the id ${args.deck}`);
  const name = checkName("deck", args.name, decks, args.deck);
  if (typeof name !== "string") return refuse(name);
  if (name === deck.name) return { ok: true, deck };
  return { ok: true, deck: { ...deck, name } };
}

/** Adds a card of `args.id`, an id the deck must not hold, at the end of the deck's cards, with no answer. */
export function addCard(
  deck: Deck,
  args: { id: string; name: string },
): ActResult {
  const name = checkName("card", args.name, deck.cards);
  if (typeof name !== "string") return refuse(name);
  return {
    ok: true,
    deck: {
      ...deck,
      cards: [...deck.cards, { id: args.id, name, answers: {} }],
    },
  };
}

export function renameCard(
  deck: Deck,
  args: { card: string; name: string },
): ActResult {
  const card = deck.cards.find((each) => each.id === args.card);
  if (card === undefined) return refuse(gone("card", args.card));
  const name = checkName("card", args.name, deck.cards, args.card);
  if (typeof name !== "string") return refuse(name);
  if (name === card.name) return { ok: true, deck };
  return {
    ok: true,
    deck: { ...deck, cards: renamed(deck.cards, card.id, name) },
  };
}

export function deleteCard(deck: Deck, args: { card: string }): ActResult {
  if (!deck.cards.some((card) => card.id === args.card))
    return refuse(gone("card", args.card));
  return {
    ok: true,
    deck: {
      ...deck,
      cards: deck.cards.filter((card) => card.id !== args.card),
    },
  };
}

/** Adds a dimension of `args.id`, an id the deck must not hold, at the end of the deck's dimensions, with no category. */
export function addDimension(
  deck: Deck,
  args: { id: string; name: string },
): ActResult {
  const name = checkName("dimension", args.name, deck.dimensions);
  if (typeof name !== "string") return refuse(name);
  return {
    ok: true,
    deck: {
      ...deck,
      dimensions: [...deck.dimensions, { id: args.id, name, categories: [] }],
    },
  };
}

export function renameDimension(
  deck: Deck,
  args: { dimension: string; name: string },
): ActResult {
  const dimension = deck.dimensions.find((each) => each.id === args.dimension);
  if (dimension === undefined) return refuse(gone("dimension", args.dimension));
  const name = checkName("dimension", args.name, deck.dimensions, dimension.id);
  if (typeof name !== "string") return refuse(name);
  if (name === dimension.name) return { ok: true, deck };
  return {
    ok: true,
    deck: { ...deck, dimensions: renamed(deck.dimensions, dimension.id, name) },
  };
}

/** Removes the dimension, its categories and every card's answer under it. */
export function deleteDimension(
  deck: Deck,
  args: { dimension: string },
): ActResult {
  if (!deck.dimensions.some((dimension) => dimension.id === args.dimension))
    return refuse(gone("dimension", args.dimension));
  return {
    ok: true,
    deck: {
      ...deck,
      dimensions: deck.dimensions.filter(
        (dimension) => dimension.id !== args.dimension,
      ),
      cards: deck.cards.map((card) =>
        answerOf(card, args.dimension) === undefined
          ? card
          : withoutAnswer(card, args.dimension),
      ),
    },
  };
}

/** Adds a category of `args.id`, an id the dimension must not hold, at the end of the dimension's categories. */
export function addCategory(
  deck: Deck,
  args: { dimension: string; id: string; name: string },
): ActResult {
  const dimension = deck.dimensions.find((each) => each.id === args.dimension);
  if (dimension === undefined) return refuse(gone("dimension", args.dimension));
  const name = checkName("category", args.name, dimension.categories);
  if (typeof name !== "string") return refuse(name);
  return {
    ok: true,
    deck: withDimension(deck, dimension.id, (held) => ({
      ...held,
      categories: [...held.categories, { id: args.id, name }],
    })),
  };
}

export function renameCategory(
  deck: Deck,
  args: { dimension: string; category: string; name: string },
): ActResult {
  const dimension = deck.dimensions.find((each) => each.id === args.dimension);
  if (dimension === undefined) return refuse(gone("dimension", args.dimension));
  const category = dimension.categories.find(
    (each) => each.id === args.category,
  );
  if (category === undefined) return refuse(gone("category", args.category));
  const name = checkName(
    "category",
    args.name,
    dimension.categories,
    category.id,
  );
  if (typeof name !== "string") return refuse(name);
  if (name === category.name) return { ok: true, deck };
  return {
    ok: true,
    deck: withDimension(deck, dimension.id, (held) => ({
      ...held,
      categories: renamed(held.categories, category.id, name),
    })),
  };
}

/** Removes the category from its dimension, and the answer of every card whose answer under that dimension it is. */
export function deleteCategory(
  deck: Deck,
  args: { dimension: string; category: string },
): ActResult {
  const dimension = deck.dimensions.find((each) => each.id === args.dimension);
  if (dimension === undefined) return refuse(gone("dimension", args.dimension));
  if (!dimension.categories.some((category) => category.id === args.category))
    return refuse(gone("category", args.category));
  return {
    ok: true,
    deck: {
      ...withDimension(deck, dimension.id, (held) => ({
        ...held,
        categories: held.categories.filter(
          (category) => category.id !== args.category,
        ),
      })),
      cards: deck.cards.map((card) =>
        answerOf(card, dimension.id) === args.category
          ? withoutAnswer(card, dimension.id)
          : card,
      ),
    },
  };
}

/**
 * Sets, under the dimension of id `args.dimension`, the answer of each card of
 * `args.answers` to the category given with it, the last entry of a card
 * standing, and leaves every other answer as it was. An entry whose card the
 * deck does not hold, or whose category the dimension does not hold, sets
 * nothing, and its ids are returned in `leftOut`, each once, in the order
 * `args.answers` first gives them. Refuses only a dimension the deck lacks.
 */
export function saveAnswers(
  deck: Deck,
  args: { dimension: string; answers: { card: string; category: string }[] },
): SaveAnswersResult {
  const dimension = deck.dimensions.find((each) => each.id === args.dimension);
  if (dimension === undefined) return refuse(gone("dimension", args.dimension));
  const cardIds = new Set(deck.cards.map((card) => card.id));
  const categoryIds = new Set(
    dimension.categories.map((category) => category.id),
  );
  const leftOutCards = new Set<string>();
  const leftOutCategories = new Set<string>();
  const fitting = new Map<string, string>();
  for (const { card, category } of args.answers) {
    const cardHeld = cardIds.has(card);
    const categoryHeld = categoryIds.has(category);
    if (!cardHeld) leftOutCards.add(card);
    if (!categoryHeld) leftOutCategories.add(category);
    if (cardHeld && categoryHeld) fitting.set(card, category);
  }
  const leftOut: LeftOut = {
    cards: [...leftOutCards],
    categories: [...leftOutCategories],
  };

  let changed = false;
  const cards = deck.cards.map((card) => {
    const category = fitting.get(card.id);
    if (category === undefined || answerOf(card, dimension.id) === category)
      return card;
    changed = true;
    return { ...card, answers: { ...card.answers, [dimension.id]: category } };
  });
  return { ok: true, deck: changed ? { ...deck, cards } : deck, leftOut };
}
