import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { Deck } from "./model/deck";
import * as acts from "./model/deckActs";
import type { Refusal } from "./model/deckActs";
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
