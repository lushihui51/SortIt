/**
 * The optimistic updates of the mutations on the learner's decks: each changes
 * the queries the client holds as the mutation will change them on the server.
 */
import type { OptimisticLocalStore } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { createDeck } from "../../convex/model/deckActs";

/** Applies `createDeck` to the list of decks the store holds, adds the deck to it, and sets the deck's own query to the deck. */
export function createDeckLocally(
  store: OptimisticLocalStore,
  args: { id: string; name: string },
): void {
  const decks = store.getQuery(api.decks.list);
  if (decks === undefined) return;
  const result = createDeck(decks, args);
  if (!result.ok) return;
  store.setQuery(api.decks.list, {}, [...decks, result.deck]);
  store.setQuery(api.decks.get, { id: args.id }, result.deck);
}

/** Takes the deck out of the list of decks the store holds and sets the deck's own query to null. */
export function deleteDeckLocally(
  store: OptimisticLocalStore,
  args: { deck: string },
): void {
  const decks = store.getQuery(api.decks.list);
  if (decks === undefined) return;
  store.setQuery(
    api.decks.list,
    {},
    decks.filter((deck) => deck.id !== args.deck),
  );
  store.setQuery(api.decks.get, { id: args.deck }, null);
}
