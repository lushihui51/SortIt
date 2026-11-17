import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** The fields of a deck in the shape of `Deck` in convex/model/deck.ts, without its owner. */
export const deckFields = {
  /** The deck's own id, made on the device; never Convex's `_id`. */
  id: v.string(),
  name: v.string(),
  dimensions: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      categories: v.array(v.object({ id: v.string(), name: v.string() })),
    }),
  ),
  cards: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      answers: v.record(v.string(), v.string()),
    }),
  ),
};

export default defineSchema({
  // One document per deck of a learner.
  decks: defineTable({
    ...deckFields,
    // The owner's Clerk user id.
    owner: v.string(),
  })
    .index("by_owner", ["owner"])
    .index("by_deck_id", ["id"]),
  // One row for each learner given their first deck.
  learners: defineTable({
    // The learner's Clerk user id.
    learner: v.string(),
  }).index("by_learner", ["learner"]),
});
