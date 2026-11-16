import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { createDeck } from "../../convex/model/deckActs";
import type { ActResult } from "../../convex/model/deckActs";
import { createDeckLocally, deleteDeckLocally } from "./optimistic";

export type DeckActs = {
  /**
   * Makes a deck of the name under an id made by `crypto.randomUUID()`.
   * Returns the act's refusal and sends nothing when the act refuses;
   * otherwise sends the mutation and returns the new deck.
   */
  createDeck(name: string): ActResult;
  /** Deletes the deck of the id. */
  deleteDeck(deck: string): void;
};

/** Every act the app sends goes through this hook. */
export function useDeckActs(): DeckActs {
  const decks = useQuery(api.decks.list);
  const sendCreateDeck = useMutation(api.decks.createDeck).withOptimisticUpdate(
    createDeckLocally,
  );
  const sendDeleteDeck = useMutation(api.decks.deleteDeck).withOptimisticUpdate(
    deleteDeckLocally,
  );

  return {
    createDeck(name) {
      // Until the list loads the learner is taken to have no deck; the
      // server's own act still refuses a name the learner already uses.
      const result = createDeck(decks ?? [], {
        id: crypto.randomUUID(),
        name,
      });
      if (result.ok) report(sendCreateDeck({ id: result.deck.id, name }));
      return result;
    },
    deleteDeck(deck) {
      report(sendDeleteDeck({ deck }));
    },
  };
}

/** Writes the error of a mutation that throws to the console, and shows the learner nothing of it. */
function report(sent: Promise<unknown>): void {
  sent.catch((error: unknown) => {
    console.error(error);
  });
}
