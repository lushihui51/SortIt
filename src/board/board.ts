import type { ItemSet } from "../set/itemSet";

/** Returns a number in [0, 1), as Math.random does. */
export type RandomSource = () => number;

export type Place = { kind: "pool" } | { kind: "zone"; category: string };

export type BoardState = {
  /** The chosen dimension's name; null while none is chosen. */
  dimension: string | null;
  /** Where each item lies, keyed by item name; holds every item of the set once the board is loaded. */
  places: Record<string, Place>;
  /** Every item name exactly once; the pool and every zone show their cards in this order. */
  order: string[];
  /** The selected card's item name; null while no card is selected. */
  selected: string | null;
};

/**
 * An act on the board. `select` on the selected card clears the selection.
 * `place` into a zone takes a category of the chosen dimension.
 */
export type BoardAction =
  | { type: "load"; random: RandomSource }
  | { type: "chooseDimension"; dimension: string; random: RandomSource }
  | { type: "select"; item: string }
  | { type: "dragStart"; item: string }
  | { type: "place"; item: string; place: Place }
  | { type: "reset"; random: RandomSource };

/** The board before `load`, which fills it with the set's cards. */
export const emptyBoard: BoardState = {
  dimension: null,
  places: {},
  order: [],
  selected: null,
};

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

function sameBoard(a: BoardState, b: BoardState): boolean {
  const names = Object.keys(a.places);
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
    )
  );
}

/**
 * Returns the pure reducer of a board over `set`, which never changes `set`.
 * An action that cannot apply, or that would change nothing, returns the
 * state it was given, the same object.
 */
export function createBoardReducer(
  set: ItemSet,
): (state: BoardState, action: BoardAction) => BoardState {
  function next(state: BoardState, action: BoardAction): BoardState {
    switch (action.type) {
      case "load": {
        const names = set.items.map((item) => item.name);
        return {
          dimension: null,
          places: allInPool(names),
          order: shuffle(names, action.random),
          selected: null,
        };
      }
      case "chooseDimension": {
        if (
          action.dimension === state.dimension ||
          !set.dimensions.some(
            (dimension) => dimension.name === action.dimension,
          )
        ) {
          return state;
        }
        return {
          dimension: action.dimension,
          places: allInPool(state.order),
          order: shuffle(state.order, action.random),
          selected: null,
        };
      }
      case "select": {
        if (
          state.dimension === null ||
          !Object.hasOwn(state.places, action.item)
        ) {
          return state;
        }
        return {
          ...state,
          selected: state.selected === action.item ? null : action.item,
        };
      }
      case "dragStart":
        return { ...state, selected: null };
      case "place": {
        const dimension = set.dimensions.find(
          (d) => d.name === state.dimension,
        );
        if (
          dimension === undefined ||
          !Object.hasOwn(state.places, action.item) ||
          (action.place.kind === "zone" &&
            !dimension.categories.includes(action.place.category))
        ) {
          return state;
        }
        return {
          ...state,
          places: { ...state.places, [action.item]: action.place },
          selected: null,
        };
      }
      case "reset":
        return {
          ...state,
          places: allInPool(state.order),
          order: shuffle(state.order, action.random),
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
