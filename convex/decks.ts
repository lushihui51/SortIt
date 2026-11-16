import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Deck } from "./model/deck";
import * as acts from "./model/deckActs";
import type {
  ActResult,
  LeftOut,
  Refusal,
  SaveAnswersResult,
} from "./model/deckActs";
import { deckIdTaken, learnerOf, ownedDeck, ownedDecks } from "./owned";

function deckOf(document: Doc<"decks">): Deck {
  return {
    id: document.id,
    name: document.name,
    dimensions: document.dimensions,
    cards: document.cards,
  };
}

/** The caller's decks, in the order they were made; none when the caller is not signed in. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<Deck[]> => (await ownedDecks(ctx)).map(deckOf),
});

/** The caller's deck of this id; null when the caller is not signed in, no deck holds the id or another learner owns it. */
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args): Promise<Deck | null> => {
    const document = await ownedDeck(ctx, args.id);
    return document === null ? null : deckOf(document);
  },
});

/**
 * Makes a deck owned by the caller, returning null, or returns the refusal
 * and makes nothing. Throws when the caller is not signed in or a deck of any
 * learner already holds the id.
 */
export const createDeck = mutation({
  args: { id: v.string(), name: v.string() },
  handler: async (ctx, args): Promise<Refusal | null> => {
    const learner = await learnerOf(ctx);
    if (learner === null) throw new Error("The caller is not signed in.");
    if (await deckIdTaken(ctx, args.id))
      throw new Error(`A deck already holds the id ${args.id}.`);
    const result = acts.createDeck((await ownedDecks(ctx)).map(deckOf), args);
    if (!result.ok) return result.refusal;
    await ctx.db.insert("decks", { ...result.deck, owner: learner });
    return null;
  },
});

/**
 * Renames the caller's deck, returning null, or returns the refusal and
 * changes nothing. Throws unless the caller owns the deck.
 */
export const renameDeck = mutation({
  args: { deck: v.string(), name: v.string() },
  handler: async (ctx, args): Promise<Refusal | null> => {
    const document = await ownedDeck(ctx, args.deck);
    if (document === null)
      throw new Error(`No deck ${args.deck} of the caller.`);
    const decks = (await ownedDecks(ctx)).map(deckOf);
    const result = acts.renameDeck(decks, args);
    if (!result.ok) return result.refusal;
    // The act returns the deck it was given, the same object, when the name is
    // the one the deck already bears, and then there is nothing to write.
    if (result.deck !== decks.find((deck) => deck.id === args.deck))
      await ctx.db.replace("decks", document._id, {
        ...result.deck,
        owner: document.owner,
      });
    return null;
  },
});

/** Deletes the caller's deck. Throws unless the caller owns the deck. */
export const deleteDeck = mutation({
  args: { deck: v.string() },
  handler: async (ctx, args): Promise<null> => {
    const document = await ownedDeck(ctx, args.deck);
    if (document === null)
      throw new Error(`No deck ${args.deck} of the caller.`);
    await ctx.db.delete("decks", document._id);
    return null;
  },
});

/**
 * Applies `act` to the caller's deck of id `args.deck` with `args`, writes the
 * deck it returns back under the same owner, and returns the act's result.
 * Writes nothing when the act refuses. Throws unless the caller owns the deck.
 */
async function applyAct<A, R extends ActResult | SaveAnswersResult>(
  ctx: MutationCtx,
  args: A & { deck: string },
  act: (deck: Deck, args: A) => R,
): Promise<R> {
  const document = await ownedDeck(ctx, args.deck);
  if (document === null)
    throw new Error(`No deck ${args.deck} of the caller.`);
  const deck = deckOf(document);
  const result = act(deck, args);
  // The act returns the deck it was given, the same object, when it changes
  // nothing, and then there is nothing to write.
  if (result.ok && result.deck !== deck)
    await ctx.db.replace("decks", document._id, {
      ...result.deck,
      owner: document.owner,
    });
  return result;
}

/** The handler of the mutation of `act`, an act on the things of one deck. */
function handlerOf<A>(act: (deck: Deck, args: A) => ActResult) {
  return async (
    ctx: MutationCtx,
    args: A & { deck: string },
  ): Promise<Refusal | null> => {
    const result = await applyAct(ctx, args, act);
    return result.ok ? null : result.refusal;
  };
}

/**
 * Adds a card to the caller's deck, returning null, or returns the refusal and
 * changes nothing. Throws unless the caller owns the deck.
 */
export const addCard = mutation({
  args: { deck: v.string(), id: v.string(), name: v.string() },
  handler: handlerOf(acts.addCard),
});

/**
 * Renames a card of the caller's deck, returning null, or returns the refusal
 * and changes nothing. Throws unless the caller owns the deck.
 */
export const renameCard = mutation({
  args: { deck: v.string(), card: v.string(), name: v.string() },
  handler: handlerOf(acts.renameCard),
});

/**
 * Deletes a card of the caller's deck, returning null, or returns the refusal
 * and changes nothing. Throws unless the caller owns the deck.
 */
export const deleteCard = mutation({
  args: { deck: v.string(), card: v.string() },
  handler: handlerOf(acts.deleteCard),
});

/**
 * Adds a dimension to the caller's deck, returning null, or returns the
 * refusal and changes nothing. Throws unless the caller owns the deck.
 */
export const addDimension = mutation({
  args: { deck: v.string(), id: v.string(), name: v.string() },
  handler: handlerOf(acts.addDimension),
});

/**
 * Renames a dimension of the caller's deck, returning null, or returns the
 * refusal and changes nothing. Throws unless the caller owns the deck.
 */
export const renameDimension = mutation({
  args: { deck: v.string(), dimension: v.string(), name: v.string() },
  handler: handlerOf(acts.renameDimension),
});

/**
 * Deletes a dimension of the caller's deck with every answer under it,
 * returning null, or returns the refusal and changes nothing. Throws unless
 * the caller owns the deck.
 */
export const deleteDimension = mutation({
  args: { deck: v.string(), dimension: v.string() },
  handler: handlerOf(acts.deleteDimension),
});

/**
 * Adds a category to a dimension of the caller's deck, returning null, or
 * returns the refusal and changes nothing. Throws unless the caller owns the
 * deck.
 */
export const addCategory = mutation({
  args: {
    deck: v.string(),
    dimension: v.string(),
    id: v.string(),
    name: v.string(),
  },
  handler: handlerOf(acts.addCategory),
});

/**
 * Renames a category of the caller's deck, returning null, or returns the
 * refusal and changes nothing. Throws unless the caller owns the deck.
 */
export const renameCategory = mutation({
  args: {
    deck: v.string(),
    dimension: v.string(),
    category: v.string(),
    name: v.string(),
  },
  handler: handlerOf(acts.renameCategory),
});

/**
 * Deletes a category of the caller's deck with every answer that is it,
 * returning null, or returns the refusal and changes nothing. Throws unless
 * the caller owns the deck.
 */
export const deleteCategory = mutation({
  args: { deck: v.string(), dimension: v.string(), category: v.string() },
  handler: handlerOf(acts.deleteCategory),
});

/**
 * Sets, under a dimension of the caller's deck, the answer of each card that
 * `answers` gives, where the deck holds the card and the dimension holds the
 * category, and returns the ids of the cards and categories it left out.
 * Returns the refusal and changes nothing when the deck lacks the dimension.
 * Throws unless the caller owns the deck.
 */
export const saveAnswers = mutation({
  args: {
    deck: v.string(),
    dimension: v.string(),
    answers: v.array(v.object({ card: v.string(), category: v.string() })),
  },
  handler: async (ctx, args): Promise<Refusal | LeftOut> => {
    const result = await applyAct(ctx, args, acts.saveAnswers);
    return result.ok ? result.leftOut : result.refusal;
  },
});
