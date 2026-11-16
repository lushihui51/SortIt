import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Deck } from "../../convex/model/deck";
import * as acts from "../../convex/model/deckActs";
import type { ActResult, SaveAnswersResult } from "../../convex/model/deckActs";
import type { BoardActs } from "../board/Board";
import {
  actLocally,
  createDeckLocally,
  deleteDeckLocally,
  type ThingAct,
} from "./optimistic";

export type DeckActs = {
  /**
   * Makes a deck of the name under an id made by `crypto.randomUUID()`.
   * Returns the act's refusal and sends nothing when the act refuses;
   * otherwise sends the mutation and returns the new deck.
   */
  createDeck(name: string): ActResult;
  /** Deletes the deck of the id. */
  deleteDeck(deck: string): void;
  /**
   * The acts on the things of `deck`, each applied to `deck` before anything
   * is sent. Each returns its act's result, and sends its mutation only when
   * the act neither refuses nor leaves the deck as it was. The acts that make
   * a thing give it an id made by `crypto.randomUUID()`.
   */
  forDeck(deck: Deck): BoardActs;
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
  const sendAddCard = useThingMutation("addCard");
  const sendDeleteCard = useThingMutation("deleteCard");
  const sendAddDimension = useThingMutation("addDimension");
  const sendDeleteDimension = useThingMutation("deleteDimension");
  const sendAddCategory = useThingMutation("addCategory");
  const sendDeleteCategory = useThingMutation("deleteCategory");
  const sendSaveAnswers = useThingMutation("saveAnswers");

  return {
    createDeck(name) {
      // Until the list loads the learner is taken to have no deck; the
      // server's own act still refuses a name the learner already uses.
      const result = acts.createDeck(decks ?? [], {
        id: crypto.randomUUID(),
        name,
      });
      if (result.ok) report(sendCreateDeck({ id: result.deck.id, name }));
      return result;
    },
    deleteDeck(deck) {
      report(sendDeleteDeck({ deck }));
    },
    forDeck(deck) {
      /** Applies `act` to `deck` and sends `send` with the deck's id and `args` when the act changes the deck. */
      function apply<A, R extends ActResult | SaveAnswersResult>(
        act: (deck: Deck, args: A) => R,
        send: (args: A & { deck: string }) => Promise<unknown>,
        args: A,
      ): R {
        const result = act(deck, args);
        // An act that changes nothing returns the deck it was given, and
        // then there is nothing to send.
        if (result.ok && result.deck !== deck)
          report(send({ ...args, deck: deck.id }));
        return result;
      }
      return {
        addCard: (name) =>
          apply(acts.addCard, sendAddCard, { id: crypto.randomUUID(), name }),
        addDimension: (name) =>
          apply(acts.addDimension, sendAddDimension, {
            id: crypto.randomUUID(),
            name,
          }),
        addCategory: (dimension, name) =>
          apply(acts.addCategory, sendAddCategory, {
            dimension,
            id: crypto.randomUUID(),
            name,
          }),
        deleteCard: (card) => apply(acts.deleteCard, sendDeleteCard, { card }),
        deleteDimension: (dimension) =>
          apply(acts.deleteDimension, sendDeleteDimension, { dimension }),
        deleteCategory: (dimension, category) =>
          apply(acts.deleteCategory, sendDeleteCategory, {
            dimension,
            category,
          }),
        saveAnswers: (dimension, answers) =>
          apply(acts.saveAnswers, sendSaveAnswers, { dimension, answers }),
      };
    },
  };
}

/** The mutation of the act, whose optimistic update applies the same act. */
function useThingMutation<Act extends ThingAct>(act: Act) {
  return useMutation(api.decks[act]).withOptimisticUpdate((store, args) =>
    actLocally(store, act, args),
  );
}

/** Writes the error of a mutation that throws to the console, and shows the learner nothing of it. */
function report(sent: Promise<unknown>): void {
  sent.catch((error: unknown) => {
    console.error(error);
  });
}
