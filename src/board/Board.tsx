import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Card, Deck } from "../../convex/model/deck";
import type { ActResult, SaveAnswersResult } from "../../convex/model/deckActs";
import {
  markOf,
  score,
  type BoardState,
  type Mark,
  type Place,
  type RandomSource,
} from "./board";
import type { DeckBoardAction } from "./BoardsProvider";
import DimensionPicker from "./DimensionPicker";
import Pool from "./Pool";
import Zone from "./Zone";
import Panel from "../ui/Panel";
import "./Board.css";

// dnd-kit announces drags and describes draggables in words of its own; the
// board speaks only the app's words, so every announcement is silent.
const silence: Announcements = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

/**
 * The acts that change the deck a board shows. Each takes ids and names as
 * the act of its name in convex/model/deckActs.ts does, and returns that
 * act's result on the deck.
 */
export type BoardActs = {
  addCard(name: string): ActResult;
  addDimension(name: string): ActResult;
  addCategory(dimension: string, name: string): ActResult;
  deleteCard(card: string): ActResult;
  deleteDimension(dimension: string): ActResult;
  deleteCategory(dimension: string, category: string): ActResult;
  saveAnswers(
    dimension: string,
    answers: { card: string; category: string }[],
  ): SaveAnswersResult;
};

export type BoardProps = {
  deck: Deck;
  /** The deck's board, fitted to `deck`. */
  board: BoardState;
  /** Sends an action to the deck's board; a deck handed with it must be one an act of the deck returned, and the action applies to that deck. */
  dispatch: (action: DeckBoardAction, deck?: Deck) => void;
  /** Draws the shuffle of Reset, of Retry and of a change of dimension. */
  random?: RandomSource;
  /** Shown at the end of the bar, after the score. */
  account?: ReactNode;
  /** Shown at the start of the bar, before "Sort by". */
  back?: ReactNode;
};

/**
 * The board over `deck`: the picker, Reset, the Check switch, Retry, the
 * score, the pool and the zones of the chosen dimension, showing `board` and
 * sending every act on it to `dispatch`, and the panel of the card whose ⓘ was
 * pressed. It must be given `board` fitted to `deck`.
 */
export default function Board({
  deck,
  board,
  dispatch,
  random = Math.random,
  account,
  back,
}: BoardProps): ReactElement {
  const cardsById = useMemo(
    () => new Map(deck.cards.map((card) => [card.id, card])),
    [deck],
  );
  const [open, setOpen] = useState<string | null>(null);
  // The ⓘ that opened the panel, which takes the focus back when it closes.
  const opener = useRef<HTMLElement | null>(null);
  const openCard = open === null ? undefined : cardsById.get(open);
  const marks: Record<string, Mark> = {};
  for (const card of board.order) {
    const mark = markOf(board, deck, card);
    if (mark !== null) marks[card] = mark;
  }
  const disabled = board.dimension === null;
  const canRetry = Object.values(marks).includes("incorrect");
  const verdict = score(board, deck);
  const categories =
    deck.dimensions.find((dimension) => dimension.id === board.dimension)
      ?.categories ?? [];

  function cardsIn(place: Place): Card[] {
    return board.order
      .filter((card) => {
        const at = board.places[card];
        return place.kind === "pool"
          ? at.kind === "pool"
          : at.kind === "zone" && at.category === place.category;
      })
      .map((card) => cardsById.get(card)!);
  }

  // A press that moves less than this is a click or tap, not a drag (ADR 014).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function openPanel(card: string, from: HTMLElement) {
    opener.current = from;
    setOpen(card);
  }

  function closePanel() {
    setOpen(null);
    opener.current?.focus();
  }

  function dragEnd(event: DragEndEvent) {
    const place = (event.over?.data.current as { place: Place } | undefined)
      ?.place;
    if (place !== undefined) {
      dispatch({ type: "place", card: String(event.active.id), place });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements: silence,
        screenReaderInstructions: { draggable: "" },
      }}
      onDragEnd={dragEnd}
    >
      <div className="board">
        <div className="board-bar">
          {back}
          <DimensionPicker
            dimensions={deck.dimensions}
            chosen={board.dimension}
            onChoose={(dimension) =>
              dispatch({ type: "chooseDimension", dimension, random })
            }
          />
          <button
            type="button"
            className="board-reset"
            onClick={() => dispatch({ type: "reset", random })}
          >
            Reset
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={board.checking}
            className="board-action board-switch"
            onClick={() => dispatch({ type: "toggleCheck" })}
          >
            <span className="board-switch-track" aria-hidden="true" />
            Check
          </button>
          {canRetry && (
            <button
              type="button"
              className="board-action"
              onClick={() => dispatch({ type: "retry", random })}
            >
              Retry
            </button>
          )}
          {/* Always present, so assistive technology reads the score as it
              appears. */}
          <div aria-live="polite">
            {verdict && (
              <p className="board-score">
                {verdict.correct} of {verdict.judged} correct
              </p>
            )}
          </div>
          {account}
        </div>
        <Pool
          cards={cardsIn({ kind: "pool" })}
          marks={marks}
          disabled={disabled}
          onOpen={openPanel}
        />
        <div className="board-zones">
          {disabled ? (
            <p className="board-prompt">Choose how to sort to begin</p>
          ) : (
            categories.map((category) => (
              <Zone
                key={category.id}
                category={category}
                cards={cardsIn({ kind: "zone", category: category.id })}
                marks={marks}
                disabled={disabled}
                onOpen={openPanel}
              />
            ))
          )}
        </div>
      </div>
      {openCard && <Panel heading={openCard.name} onClose={closePanel} />}
    </DndContext>
  );
}
