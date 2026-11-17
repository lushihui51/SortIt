import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Category, Deck, Dimension } from "../../convex/model/deck";
import * as acts from "../../convex/model/deckActs";
import type {
  ActResult,
  Kind,
  LeftOut,
  Refusal,
  SaveAnswersResult,
} from "../../convex/model/deckActs";
import type { BoardActs } from "../board/Board";
import type { SentAct, Thing } from "./notKept";
import { useNotKept } from "./NotKeptProvider";
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
   * otherwise sends the mutation and returns the new deck. A refusal the
   * mutation returns gives the line for a change not kept.
   */
  createDeck(name: string): ActResult;
  /** Deletes the deck of the id. */
  deleteDeck(deck: string): void;
  /**
   * The acts on the things of `deck`, each applied to `deck` before anything
   * is sent. Each returns its act's result, and sends its mutation only when
   * the act neither refuses nor leaves the deck as it was. The acts that make
   * a thing give it an id made by `crypto.randomUUID()`. A refusal or the ids
   * left out that a mutation returns give the lines for changes not kept,
   * naming each thing as `deck` held it.
   */
  forDeck(deck: Deck): BoardActs;
};

/** Every act the app sends goes through this hook. */
export function useDeckActs(): DeckActs {
  const decks = useQuery(api.decks.list);
  const notKept = useNotKept();
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
      if (result.ok)
        sendAct(
          notKept.send({
            making: true,
            subject: thing("deck", result.deck),
            others: [],
            held: null,
          }),
          () => sendCreateDeck({ id: result.deck.id, name }),
        );
      return result;
    },
    deleteDeck(deck) {
      report(sendDeleteDeck({ deck }));
    },
    forDeck(deck) {
      const ofDeck = thing("deck", deck);

      /**
       * Applies `act` to `deck` and, when the act changes the deck, records
       * what `sent` gives of it and sends `send` with the deck's id and `args`.
       */
      function apply<A, R extends ActResult | SaveAnswersResult>(
        act: (deck: Deck, args: A) => R,
        send: (args: A & { deck: string }) => Promise<Refusal | LeftOut | null>,
        args: A,
        sent: (changed: Deck) => SentAct,
      ): R {
        const result = act(deck, args);
        // An act that changes nothing returns the deck it was given, and
        // then there is nothing to send.
        if (result.ok && result.deck !== deck)
          sendAct(notKept.send(sent(result.deck)), () =>
            send({ ...args, deck: deck.id }),
          );
        return result;
      }

      /** What a making of a card or a dimension of the deck touches. */
      function makingInDeck(subject: Thing): SentAct {
        return { making: true, subject, others: [ofDeck], held: deck.name };
      }

      /** What a change to a card or a dimension of the deck touches. */
      function changeInDeck(subject: Thing): SentAct {
        return { making: false, subject, others: [ofDeck], held: deck.name };
      }

      /** What an act on a category of the dimension touches. */
      function inDimension(
        making: boolean,
        dimension: Dimension,
        category: Category,
      ): SentAct {
        return {
          making,
          subject: thing("category", category),
          others: [ofDeck, thing("dimension", dimension)],
          held: dimension.name,
        };
      }

      return {
        addCard: (name) => {
          const id = crypto.randomUUID();
          return apply(acts.addCard, sendAddCard, { id, name }, (changed) =>
            makingInDeck(thing("card", byId(changed.cards, id))),
          );
        },
        addDimension: (name) => {
          const id = crypto.randomUUID();
          return apply(
            acts.addDimension,
            sendAddDimension,
            { id, name },
            (changed) =>
              makingInDeck(thing("dimension", byId(changed.dimensions, id))),
          );
        },
        addCategory: (dimension, name) => {
          const id = crypto.randomUUID();
          return apply(
            acts.addCategory,
            sendAddCategory,
            { dimension, id, name },
            (changed) => {
              const made = byId(changed.dimensions, dimension);
              return inDimension(true, made, byId(made.categories, id));
            },
          );
        },
        deleteCard: (card) =>
          apply(acts.deleteCard, sendDeleteCard, { card }, () =>
            changeInDeck(thing("card", byId(deck.cards, card))),
          ),
        deleteDimension: (dimension) =>
          apply(acts.deleteDimension, sendDeleteDimension, { dimension }, () =>
            changeInDeck(thing("dimension", byId(deck.dimensions, dimension))),
          ),
        deleteCategory: (dimension, category) =>
          apply(
            acts.deleteCategory,
            sendDeleteCategory,
            { dimension, category },
            () => {
              const holder = byId(deck.dimensions, dimension);
              return inDimension(
                false,
                holder,
                byId(holder.categories, category),
              );
            },
          ),
        saveAnswers: (dimension, answers) =>
          apply(
            acts.saveAnswers,
            sendSaveAnswers,
            { dimension, answers },
            () => {
              const saved = byId(deck.dimensions, dimension);
              return {
                ...changeInDeck(thing("dimension", saved)),
                answers: answers.flatMap(({ card, category }) => {
                  const sorted = deck.cards.find((each) => each.id === card);
                  const into = saved.categories.find(
                    (each) => each.id === category,
                  );
                  // A pair the deck cannot name is left out on the device
                  // too, and the line for it would have no name to give.
                  return sorted === undefined || into === undefined
                    ? []
                    : [
                        {
                          card: thing("card", sorted),
                          category: thing("category", into),
                        },
                      ];
                }),
              };
            },
          ),
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

/** The thing of the kind, as `named` bears it now. */
function thing(kind: Kind, named: { id: string; name: string }): Thing {
  return { kind, id: named.id, name: named.name };
}

/** The one of `things` of the id, which an act that did not refuse must hold. */
function byId<T extends { id: string }>(things: readonly T[], id: string): T {
  const found = things.find((each) => each.id === id);
  if (found === undefined) throw new Error(`No thing of the id ${id}.`);
  return found;
}

/**
 * Sends `mutate`'s mutation and settles `recorded` with what it returns, or
 * with null when it throws, whose error goes to the console alone.
 */
function sendAct(
  recorded: { settle(returned: Refusal | LeftOut | null): void },
  mutate: () => Promise<Refusal | LeftOut | null>,
): void {
  mutate().then(
    (returned) => recorded.settle(returned),
    (error: unknown) => {
      console.error(error);
      recorded.settle(null);
    },
  );
}

/** Writes the error of a mutation that throws to the console, and shows the learner nothing of it. */
function report(sent: Promise<unknown>): void {
  sent.catch((error: unknown) => {
    console.error(error);
  });
}
