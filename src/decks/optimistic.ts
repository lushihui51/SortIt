/**
 * The optimistic updates of the mutations on the learner's decks: each changes
 * the queries the client holds as the mutation will change them on the server.
 */
import type { OptimisticLocalStore } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Deck } from "../../convex/model/deck";
import {
  addCard,
  addCategory,
  addDimension,
  createDeck,
  deleteCard,
  deleteCategory,
  deleteDimension,
  saveAnswers,
  type ActResult,
  type SaveAnswersResult,
} from "../../convex/model/deckActs";

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

/** The name of an act on a deck's things, which is also the name of its mutation in convex/decks.ts. */
export type ThingAct =
  | "addCard"
  | "deleteCard"
  | "addDimension"
  | "deleteDimension"
  | "addCategory"
  | "deleteCategory"
  | "saveAnswers";

const thingActs: Record<
  ThingAct,
  (deck: Deck, args: never) => ActResult | SaveAnswersResult
> = {
  addCard,
  deleteCard,
  addDimension,
  deleteDimension,
  addCategory,
  deleteCategory,
  saveAnswers,
};

/**
 * Applies the act to the deck the store holds under `args.deck`, and sets the
 * deck's own query and its place in the list of decks to the result. `args`
 * is the act's mutation's arguments. The deck is read from its own query, or
 * from the list while its own query holds no value; nothing changes when its
 * own query holds null, when neither holds the deck or when the act refuses.
 */
export function actLocally(
  store: OptimisticLocalStore,
  act: ThingAct,
  args: { deck: string } & Record<string, unknown>,
): void {
  const { deck: id, ...actArgs } = args;
  const own = store.getQuery(api.decks.get, { id });
  if (own === null) return;
  const decks = store.getQuery(api.decks.list);
  const deck = own ?? decks?.find((each) => each.id === id);
  if (deck === undefined) return;
  const result = (
    thingActs[act] as (
      deck: Deck,
      args: typeof actArgs,
    ) => ActResult | SaveAnswersResult
  )(deck, actArgs);
  if (!result.ok) return;
  store.setQuery(api.decks.get, { id }, result.deck);
  if (decks?.some((each) => each.id === id))
    store.setQuery(
      api.decks.list,
      {},
      decks.map((each) => (each.id === id ? result.deck : each)),
    );
}
