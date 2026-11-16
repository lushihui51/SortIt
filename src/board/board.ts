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

/** A card's verdict at Check: whether its zone is the card's answer. */
export type Mark = "correct" | "incorrect";

export type BoardState = {
  /** The chosen dimension's id; null while none is chosen. */
  dimension: string | null;
  /** Where each card lies, keyed by card id; holds every card of the deck once the board is loaded. */
  places: Record<string, Place>;
  /** Every card id exactly once; the pool and every zone show their cards in this order. */
  order: string[];
  /** The mark of each card that bears one, keyed by card id; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** The selected card's id; null while no card is selected. */
  selected: string | null;
};

/**
 * An act on the board. `select` on the selected card clears the selection.
 * `select` and `dragStart` remove the card's mark. `place` into a zone takes
 * a category of the chosen dimension. `check` applies only once a dimension
 * is chosen and the pool is empty, and `retry` only while a card is marked
 * incorrect.
 */
export type BoardAction =
  | { type: "load"; random: RandomSource }
  | { type: "chooseDimension"; dimension: string; random: RandomSource }
  | { type: "select"; card: string }
  | { type: "dragStart"; card: string }
  | { type: "place"; card: string; place: Place }
  | { type: "check" }
  | { type: "retry"; random: RandomSource }
  | { type: "reset"; random: RandomSource };

/** The board before `load`, which fills it with the deck's cards. */
export const emptyBoard: BoardState = {
  dimension: null,
  places: {},
  order: [],
  marks: {},
  selected: null,
};

/** The score, or null unless every card bears a mark. */
export function score(
  state: BoardState,
): { correct: number; total: number } | null {
  const ids = Object.keys(state.places);
  if (!ids.every((id) => Object.hasOwn(state.marks, id))) return null;
  return {
    correct: ids.filter((id) => state.marks[id] === "correct").length,
    total: ids.length,
  };
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

const pool: Place = { kind: "pool" };

function allInPool(ids: readonly string[]): Record<string, Place> {
  return Object.fromEntries(ids.map((id) => [id, pool]));
}

function samePlace(a: Place, b: Place): boolean {
  return a.kind === "pool"
    ? b.kind === "pool"
    : b.kind === "zone" && a.category === b.category;
}

function withoutMark(
  marks: Record<string, Mark>,
  card: string,
): Record<string, Mark> {
  const { [card]: _removed, ...rest } = marks;
  return rest;
}

function sameBoard(a: BoardState, b: BoardState): boolean {
  const ids = Object.keys(a.places);
  const marked = Object.keys(a.marks);
  return (
    a.dimension === b.dimension &&
    a.selected === b.selected &&
    a.order.length === b.order.length &&
    a.order.every((id, index) => id === b.order[index]) &&
    ids.length === Object.keys(b.places).length &&
    ids.every(
      (id) =>
        Object.hasOwn(b.places, id) && samePlace(a.places[id], b.places[id]),
    ) &&
    marked.length === Object.keys(b.marks).length &&
    marked.every(
      (id) => Object.hasOwn(b.marks, id) && a.marks[id] === b.marks[id],
    )
  );
}

/**
 * Returns the pure reducer of a board over `deck`, which never changes `deck`.
 * An action that cannot apply, or that would change nothing, returns the
 * state it was given, the same object.
 */
export function createBoardReducer(
  deck: Deck,
): (state: BoardState, action: BoardAction) => BoardState {
  function next(state: BoardState, action: BoardAction): BoardState {
    switch (action.type) {
      case "load": {
        const ids = deck.cards.map((card) => card.id);
        return {
          dimension: null,
          places: allInPool(ids),
          order: shuffle(ids, action.random),
          marks: {},
          selected: null,
        };
      }
      case "chooseDimension": {
        if (
          action.dimension === state.dimension ||
          !deck.dimensions.some(
            (dimension) => dimension.id === action.dimension,
          )
        ) {
          return state;
        }
        return {
          dimension: action.dimension,
          places: allInPool(state.order),
          order: shuffle(state.order, action.random),
          marks: {},
          selected: null,
        };
      }
      case "select": {
        if (
          state.dimension === null ||
          !Object.hasOwn(state.places, action.card)
        ) {
          return state;
        }
        return {
          ...state,
          marks: withoutMark(state.marks, action.card),
          selected: state.selected === action.card ? null : action.card,
        };
      }
      case "dragStart":
        return {
          ...state,
          marks: withoutMark(state.marks, action.card),
          selected: null,
        };
      case "place": {
        const { place } = action;
        const dimension = deck.dimensions.find((d) => d.id === state.dimension);
        if (
          dimension === undefined ||
          !Object.hasOwn(state.places, action.card) ||
          (place.kind === "zone" &&
            !dimension.categories.some(
              (category) => category.id === place.category,
            ))
        ) {
          return state;
        }
        return {
          ...state,
          places: { ...state.places, [action.card]: action.place },
          selected: null,
        };
      }
      case "check": {
        const dimension = state.dimension;
        if (
          dimension === null ||
          state.order.some((id) => state.places[id].kind === "pool")
        ) {
          return state;
        }
        const marks: Record<string, Mark> = {};
        for (const card of deck.cards) {
          const place = state.places[card.id];
          marks[card.id] =
            place.kind === "zone" && place.category === card.answers[dimension]
              ? "correct"
              : "incorrect";
        }
        return { ...state, marks, selected: null };
      }
      case "retry": {
        const positions = state.order.flatMap((id, index) =>
          state.marks[id] === "incorrect" ? [index] : [],
        );
        if (positions.length === 0) return state;
        const returned = positions.map((index) => state.order[index]);
        const permuted = shuffle(returned, action.random);
        const order = [...state.order];
        const places = { ...state.places };
        const marks = { ...state.marks };
        positions.forEach((position, k) => {
          order[position] = permuted[k];
        });
        for (const id of returned) {
          places[id] = pool;
          delete marks[id];
        }
        return { ...state, places, order, marks, selected: null };
      }
      case "reset":
        return {
          ...state,
          places: allInPool(state.order),
          order: shuffle(state.order, action.random),
          marks: {},
          selected: null,
        };
    }
  }

  return (state, action) => {
    const result = next(state, action);
    // React skips a re-render only when the reducer hands back the same object.
    return result !== state && sameBoard(result, state) ? state : result;
  };
}
