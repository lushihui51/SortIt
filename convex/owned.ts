/**
 * Every read of the `decks` table. A function that reads a deck reads it
 * through these, so that no caller sees a deck it does not own.
 */
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** The caller's Clerk user id; null when the caller is not signed in. */
export async function learnerOf(
  ctx: QueryCtx | MutationCtx,
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity === null ? null : identity.subject;
}

/** The owner helper: the document of the deck of this id, or null unless the caller is signed in, a deck holds the id and the caller owns it. */
export async function ownedDeck(
  ctx: QueryCtx | MutationCtx,
  id: string,
): Promise<Doc<"decks"> | null> {
  const learner = await learnerOf(ctx);
  if (learner === null) return null;
  const deck = await ctx.db
    .query("decks")
    .withIndex("by_deck_id", (q) => q.eq("id", id))
    .unique();
  return deck !== null && deck.owner === learner ? deck : null;
}

/** Every document of the caller's decks, in the order they were made; none when the caller is not signed in. */
export async function ownedDecks(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"decks">[]> {
  const learner = await learnerOf(ctx);
  if (learner === null) return [];
  return await ctx.db
    .query("decks")
    .withIndex("by_owner", (q) => q.eq("owner", learner))
    .collect();
}

/** Whether a deck of any owner holds the id. */
export async function deckIdTaken(
  ctx: QueryCtx | MutationCtx,
  id: string,
): Promise<boolean> {
  const deck = await ctx.db
    .query("decks")
    .withIndex("by_deck_id", (q) => q.eq("id", id))
    .first();
  return deck !== null;
}
