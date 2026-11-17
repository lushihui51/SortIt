import type { Deck } from "../../convex/model/deck";

/** Returns a number in [0, 1), as Math.random does. */
export type RandomSource = () => number;

export type Place =
  | { kind: "pool" }
  | {
      kind: "zone";
      /** The id of a category of the chosen dimension. */
      category: string;
    };

/**
 * A card's mark under the chosen dimension: `"correct"` or `"incorrect"` by
 * whether the zone it lies in is its answer, and `"noAnswer"` when the card
 * has no answer under that dimension.
 */
export type Mark = "correct" | "incorrect" | "noAnswer";

export type BoardState = {
  /** The chosen dimension's id; null while none is chosen. */
  dimension: string | null;
  /** Where each card lies, keyed by card id. */
  places: Record<string, Place>;
  /** Every card id exactly once; the pool and every zone show their cards in this order. */
  order: string[];
  /** Whether Check is on. */
  checking: boolean;
};

/** Every board, keyed by deck id. */
export type BoardsState = Record<string, BoardState>;

/**
 * An act on the board of one deck: `action.deck.id`, or `action.deckId` for
 * `toggleCheck`. Every act that carries a deck applies to the board fitted to
 * that deck, as `fitBoard` fits it. `place` into a zone takes a category of
 * the chosen dimension, and `retry` returns the cards marked `"incorrect"`.
 */
export type BoardAction =
  | { type: "load"; deck: Deck; random: RandomSource }
  | {
      type: "chooseDimension";
      deck: Deck;
      dimension: string;
      random: RandomSource;
    }
  | { type: "place"; deck: Deck; card: string; place: Place }
  | { type: "toggleCheck"; deckId: string }
  | { type: "retry"; deck: Deck; random: RandomSource }
  | { type: "reset"; deck: Deck; random: RandomSource };

/** The state before any deck's board is loaded. */
export const noBoards: BoardsState = {};

const pool: Place = { kind: "pool" };

function allInPool(ids: readonly string[]): Record<string, Place> {
  return Object.fromEntries(ids.map((id) => [id, pool]));
}

function samePlace(a: Place, b: Place): boolean {
  return a.kind === "pool"
    ? b.kind === "pool"
    : b.kind === "zone" && a.category === b.category;
}

function sameBoard(a: BoardState, b: BoardState): boolean {
  const ids = Object.keys(a.places);
  return (
    a.dimension === b.dimension &&
    a.checking === b.checking &&
    a.order.length === b.order.length &&
    a.order.every((id, index) => id === b.order[index]) &&
    ids.length === Object.keys(b.places).length &&
    ids.every(
      (id) =>
        Object.hasOwn(b.places, id) && samePlace(a.places[id], b.places[id]),
    )
  );
}

function boardOf(state: BoardsState, deckId: string): BoardState | undefined {
  return Object.hasOwn(state, deckId) ? state[deckId] : undefined;
}

/**
 * Returns `board` fitted to `deck`: a card the deck no longer holds leaves the
 * board; a card of the deck the board lacks joins the end of the order, in the
 * pool; a card in a zone whose category the chosen dimension no longer holds
 * returns to the pool; and when the deck no longer holds the chosen dimension,
 * no dimension is chosen and every card lies in the pool. Check and the order
 * of the cards that stay are kept. A board that already fits comes back as the
 * same object.
 */
export function fitBoard(board: BoardState, deck: Deck): BoardState {
  const deckIds = deck.cards.map((card) => card.id);
  const held = new Set(deckIds);
  const kept = board.order.filter((id) => held.has(id));
  const keptSet = new Set(kept);
  const order = [...kept, ...deckIds.filter((id) => !keptSet.has(id))];
  const dimension =
    board.dimension === null
      ? undefined
      : deck.dimensions.find((d) => d.id === board.dimension);
  const categories = new Set(dimension?.categories.map((c) => c.id) ?? []);
  const places: Record<string, Place> = {};
  for (const id of order) {
    const place = Object.hasOwn(board.places, id) ? board.places[id] : pool;
    places[id] =
      place.kind === "zone" && categories.has(place.category) ? place : pool;
  }
  const fitted: BoardState = {
    dimension: dimension === undefined ? null : dimension.id,
    places,
    order,
    checking: board.checking,
  };
  return sameBoard(fitted, board) ? board : fitted;
}

/** Applies `action` to `board`, which fits `action.deck`. */
function apply(
  board: BoardState,
  action: Exclude<BoardAction, { type: "load" | "toggleCheck" }>,
): BoardState {
  const { deck } = action;
  switch (action.type) {
    case "chooseDimension": {
      if (
        action.dimension === board.dimension ||
        !deck.dimensions.some((dimension) => dimension.id === action.dimension)
      ) {
        return board;
      }
      return {
        dimension: action.dimension,
        places: allInPool(board.order),
        order: shuffle(board.order, action.random),
        checking: board.checking,
      };
    }
    case "place": {
      const { place } = action;
      const dimension = deck.dimensions.find((d) => d.id === board.dimension);
      if (
        dimension === undefined ||
        !Object.hasOwn(board.places, action.card) ||
        (place.kind === "zone" &&
          !dimension.categories.some(
            (category) => category.id === place.category,
          ))
      ) {
        return board;
      }
      return {
        ...board,
        places: {
          ...board.places,
          [action.card]:
            place.kind === "pool"
              ? pool
              : { kind: "zone", category: place.category },
        },
      };
    }
    case "retry": {
      if (!board.checking) return board;
      const positions = board.order.flatMap((id, index) =>
        markOf(board, deck, id) === "incorrect" ? [index] : [],
      );
      if (positions.length === 0) return board;
      const returned = positions.map((index) => board.order[index]);
      const permuted = shuffle(returned, action.random);
      const order = [...board.order];
      const places = { ...board.places };
      positions.forEach((position, k) => {
        order[position] = permuted[k];
      });
      for (const id of returned) places[id] = pool;
      return { ...board, places, order };
    }
    case "reset":
      return {
        ...board,
        places: allInPool(board.order),
        order: shuffle(board.order, action.random),
      };
  }
}

/**
 * The pure reducer of every board. It applies `action` to the board of one
 * deck and keeps every other board the same object. `load` gives a deck with
 * no board its board: no dimension chosen, Check off, and every card in the
 * pool in an order shuffled by `action.random`; on a deck that has a board it
 * does nothing. Every other action on a deck with no board does nothing. The
 * state it was given comes back, the same object, exactly when the board it
 * would store equals the stored one.
 */
export function boardsReducer(
  state: BoardsState,
  action: BoardAction,
): BoardsState {
  const deckId = action.type === "toggleCheck" ? action.deckId : action.deck.id;
  const stored = boardOf(state, deckId);
  if (action.type === "load") {
    if (stored !== undefined) return state;
    const ids = action.deck.cards.map((card) => card.id);
    return {
      ...state,
      [deckId]: {
        dimension: null,
        places: allInPool(ids),
        order: shuffle(ids, action.random),
        checking: false,
      },
    };
  }
  if (stored === undefined) return state;
  const next =
    action.type === "toggleCheck"
      ? { ...stored, checking: !stored.checking }
      : apply(fitBoard(stored, action.deck), action);
  // React skips a re-render only when the reducer hands back the same object.
  return sameBoard(next, stored) ? state : { ...state, [deckId]: next };
}

/**
 * The mark `card` shows on `board`, which must fit `deck`. It is null before a
 * dimension is chosen and for a card the board lacks; `"noAnswer"` for a card
 * with no answer under the chosen dimension, wherever it lies and whether
 * Check is on or off; and otherwise null unless Check is on and the card lies
 * in a zone.
 */
export function markOf(
  board: BoardState,
  deck: Deck,
  card: string,
): Mark | null {
  const dimension = board.dimension;
  if (dimension === null || !Object.hasOwn(board.places, card)) return null;
  const answers = deck.cards.find((c) => c.id === card)?.answers;
  if (answers === undefined || !Object.hasOwn(answers, dimension)) {
    return "noAnswer";
  }
  const place = board.places[card];
  if (!board.checking || place.kind === "pool") return null;
  return place.category === answers[dimension] ? "correct" : "incorrect";
}

/**
 * The score of `board`, which must fit `deck`: of the cards in a zone that
 * have an answer under the chosen dimension, how many are correct. It is null
 * unless Check is on and at least one card lies in a zone.
 */
export function score(
  board: BoardState,
  deck: Deck,
): { correct: number; judged: number } | null {
  if (!board.checking) return null;
  const inZone = board.order.filter((id) => board.places[id].kind === "zone");
  if (inZone.length === 0) return null;
  const marks = inZone.map((id) => markOf(board, deck, id));
  return {
    correct: marks.filter((mark) => mark === "correct").length,
    judged: marks.filter((mark) => mark === "correct" || mark === "incorrect")
      .length,
  };
}

/** The answer each card in a zone would get: its card id and its zone's category id, in the board's order. */
export function answersOnBoard(
  board: BoardState,
): { card: string; category: string }[] {
  return board.order.flatMap((card) => {
    const place = board.places[card];
    return place.kind === "zone" ? [{ card, category: place.category }] : [];
  });
}

/** How many cards in a zone have an answer under the chosen dimension that is not their zone's category. */
export function answersChanged(board: BoardState, deck: Deck): number {
  const dimension = board.dimension;
  if (dimension === null) return 0;
  const cardsById = new Map(deck.cards.map((card) => [card.id, card]));
  return answersOnBoard(board).filter(({ card, category }) => {
    const answers = cardsById.get(card)?.answers;
    return (
      answers !== undefined &&
      Object.hasOwn(answers, dimension) &&
      answers[dimension] !== category
    );
  }).length;
}

/**
 * Returns a new array holding the elements of `list` in an order drawn from
 * `random`, which it calls `list.length - 1` times. `list` is left unchanged.
 */
export function shuffle<T>(list: readonly T[], random: RandomSource): T[] {
  const result = [...list];
  for (let i = result.length - 1; i >= 1; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
