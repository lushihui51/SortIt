import type { AppDeckFile } from "../deck/appDeckFile";

/** Returns a number in [0, 1), as Math.random does. */
export type RandomSource = () => number;

export type Place = { kind: "pool" } | { kind: "zone"; category: string };

/** A card's verdict at Check: whether its zone is the card's answer. */
export type Mark = "correct" | "incorrect";

export type BoardState = {
  /** The chosen dimension's name; null while none is chosen. */
  dimension: string | null;
  /** Where each card lies, keyed by card name; holds every card of the deck once the board is loaded. */
  places: Record<string, Place>;
  /** Every card name exactly once; the pool and every zone show their cards in this order. */
  order: string[];
  /** The mark of each card that bears one, keyed by card name; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** The selected card's name; null while no card is selected. */
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
  const names = Object.keys(state.places);
  if (!names.every((name) => Object.hasOwn(state.marks, name))) return null;
  return {
    correct: names.filter((name) => state.marks[name] === "correct").length,
    total: names.length,
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

function allInPool(names: readonly string[]): Record<string, Place> {
  return Object.fromEntries(names.map((name) => [name, pool]));
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
  const names = Object.keys(a.places);
  const marked = Object.keys(a.marks);
  return (
    a.dimension === b.dimension &&
    a.selected === b.selected &&
    a.order.length === b.order.length &&
    a.order.every((name, index) => name === b.order[index]) &&
    names.length === Object.keys(b.places).length &&
    names.every(
      (name) =>
        Object.hasOwn(b.places, name) &&
        samePlace(a.places[name], b.places[name]),
    ) &&
    marked.length === Object.keys(b.marks).length &&
    marked.every(
      (name) => Object.hasOwn(b.marks, name) && a.marks[name] === b.marks[name],
    )
  );
}

/**
 * Returns the pure reducer of a board over `deck`, which never changes `deck`.
 * An action that cannot apply, or that would change nothing, returns the
 * state it was given, the same object.
 */
export function createBoardReducer(
  deck: AppDeckFile,
): (state: BoardState, action: BoardAction) => BoardState {
  function next(state: BoardState, action: BoardAction): BoardState {
    switch (action.type) {
      case "load": {
        const names = deck.cards.map((card) => card.name);
        return {
          dimension: null,
          places: allInPool(names),
          order: shuffle(names, action.random),
          marks: {},
          selected: null,
        };
      }
      case "chooseDimension": {
        if (
          action.dimension === state.dimension ||
          !deck.dimensions.some(
            (dimension) => dimension.name === action.dimension,
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
        const dimension = deck.dimensions.find(
          (d) => d.name === state.dimension,
        );
        if (
          dimension === undefined ||
          !Object.hasOwn(state.places, action.card) ||
          (action.place.kind === "zone" &&
            !dimension.categories.includes(action.place.category))
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
          state.order.some((name) => state.places[name].kind === "pool")
        ) {
          return state;
        }
        const marks: Record<string, Mark> = {};
        for (const card of deck.cards) {
          const place = state.places[card.name];
          marks[card.name] =
            place.kind === "zone" && place.category === card.answers[dimension]
              ? "correct"
              : "incorrect";
        }
        return { ...state, marks, selected: null };
      }
      case "retry": {
        const positions = state.order.flatMap((name, index) =>
          state.marks[name] === "incorrect" ? [index] : [],
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
        for (const name of returned) {
          places[name] = pool;
          delete marks[name];
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
