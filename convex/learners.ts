import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { deckIdTaken, learnerOf } from "./owned";
import { deckFields } from "./schema";

/**
 * Gives the caller `deck` as their first deck, owned by them, the first time
 * it is called for them; every later call writes nothing, whatever `deck` it
 * is given, even once the caller has deleted every deck. Throws, writing
 * nothing, when the caller is not signed in, or on a first call when a deck of
 * any learner already holds the id of `deck`.
 */
export const startLearner = mutation({
  args: { deck: v.object(deckFields) },
  handler: async (ctx, args): Promise<null> => {
    const learner = await learnerOf(ctx);
    if (learner === null) throw new Error("The caller is not signed in.");
    const started = await ctx.db
      .query("learners")
      .withIndex("by_learner", (q) => q.eq("learner", learner))
      .unique();
    if (started !== null) return null;
    if (await deckIdTaken(ctx, args.deck.id))
      throw new Error(`A deck already holds the id ${args.deck.id}.`);
    await ctx.db.insert("learners", { learner });
    await ctx.db.insert("decks", { ...args.deck, owner: learner });
    return null;
  },
});
