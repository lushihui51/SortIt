import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Deck } from "../../convex/model/deck";
import {
  boardsReducer,
  fitBoard,
  noBoards,
  type BoardAction,
  type BoardState,
  type BoardsState,
  type Place,
  type RandomSource,
} from "./board";

/** An act on one deck's board, without the deck it applies to. */
export type DeckBoardAction =
  | { type: "chooseDimension"; dimension: string; random: RandomSource }
  | { type: "place"; card: string; place: Place }
  | { type: "toggleCheck" }
  | { type: "retry"; random: RandomSource }
  | { type: "reset"; random: RandomSource };

const BoardsContext = createContext<{
  boards: BoardsState;
  dispatch: Dispatch<BoardAction>;
} | null>(null);

/**
 * Holds the board of every deck for each `useDeckBoard` called inside it, in
 * memory alone: a board outlives the screen that shows it, and a reload starts
 * every board over.
 */
export function BoardsProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [boards, dispatch] = useReducer(boardsReducer, noBoards);
  const value = useMemo(() => ({ boards, dispatch }), [boards]);
  return <BoardsContext value={value}>{children}</BoardsContext>;
}

/**
 * The board of `deck` and a dispatch bound to it, which must be called inside
 * `BoardsProvider` and throws outside it. `board` is null only on the render
 * before the deck's board is loaded, and is otherwise fitted to `deck`;
 * `random` draws the shuffle of that load. Every board is kept by deck id, so
 * two decks with one id share a board.
 *
 * The dispatch applies an action to the deck last given to the hook or, when
 * it is handed a deck, to that deck for that action alone. A handed deck must
 * bear the id of the hook's deck: an action sent in the same press as an act
 * on the deck hands it the deck the act returned, which the hook is given
 * only at its next render.
 */
export function useDeckBoard(
  deck: Deck,
  random: RandomSource = Math.random,
): {
  board: BoardState | null;
  dispatch: (action: DeckBoardAction, deck?: Deck) => void;
} {
  const context = useContext(BoardsContext);
  if (context === null) {
    throw new Error("useDeckBoard must be called inside BoardsProvider");
  }
  const { boards, dispatch } = context;
  const stored = Object.hasOwn(boards, deck.id) ? boards[deck.id] : undefined;
  const loaded = stored !== undefined;

  // Loaded before the first paint, so the learner never sees the deck's own
  // order, unshuffled (ADR 015).
  useLayoutEffect(() => {
    if (!loaded) dispatch({ type: "load", deck, random });
  }, [loaded, deck, random, dispatch]);

  // An act sent from a handler of an earlier render still applies to the deck
  // as it stands now.
  const latestDeck = useRef(deck);
  useLayoutEffect(() => {
    latestDeck.current = deck;
  }, [deck]);

  const dispatchDeck = useCallback(
    (action: DeckBoardAction, handed?: Deck) => {
      const current = handed ?? latestDeck.current;
      dispatch(
        action.type === "toggleCheck"
          ? { type: "toggleCheck", deckId: current.id }
          : { ...action, deck: current },
      );
    },
    [dispatch],
  );

  return {
    board: stored === undefined ? null : fitBoard(stored, deck),
    dispatch: dispatchDeck,
  };
}
