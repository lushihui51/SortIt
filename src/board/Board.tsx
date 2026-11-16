import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useReducer, type ReactElement } from "react";
import type { Card, Deck } from "../../convex/model/deck";
import {
  createBoardReducer,
  emptyBoard,
  score,
  type Place,
  type RandomSource,
} from "./legacyBoard";
import DimensionPicker from "./DimensionPicker";
import Pool from "./Pool";
import Zone from "./Zone";
import "./Board.css";

// dnd-kit announces drags and describes draggables in words of its own; the
// board speaks only the app's words, so every announcement is silent.
const silence: Announcements = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

export type BoardProps = {
  deck: Deck;
  /** Draws every shuffle of the cards. */
  random?: RandomSource;
};

/**
 * The board over `deck`: the picker, Reset, Check, Retry, the score, the pool
 * and the zones of the chosen dimension. It loads with every card in the pool and no dimension
 * chosen, and reads `deck` only when it first renders.
 */
export default function Board({
  deck,
  random = Math.random,
}: BoardProps): ReactElement {
  const reducer = useMemo(() => createBoardReducer(deck), [deck]);
  const cardsById = useMemo(
    () => new Map(deck.cards.map((card) => [card.id, card])),
    [deck],
  );
  const [state, dispatch] = useReducer(reducer, emptyBoard, (board) =>
    reducer(board, { type: "load", random }),
  );
  const disabled = state.dimension === null;
  const canCheck =
    !disabled &&
    state.order.every((card) => state.places[card].kind !== "pool");
  const canRetry = Object.values(state.marks).includes("incorrect");
  const verdict = score(state);
  const categories =
    deck.dimensions.find((dimension) => dimension.id === state.dimension)
      ?.categories ?? [];

  function cardsIn(place: Place): Card[] {
    return state.order
      .filter((card) => {
        const at = state.places[card];
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

  function dragStart(event: DragStartEvent) {
    dispatch({ type: "dragStart", card: String(event.active.id) });
  }

  function dragEnd(event: DragEndEvent) {
    const place = (event.over?.data.current as { place: Place } | undefined)
      ?.place;
    if (place !== undefined) {
      dispatch({ type: "place", card: String(event.active.id), place });
    }
  }

  function select(card: string) {
    dispatch({ type: "select", card });
  }

  function send(place: Place) {
    if (state.selected !== null) {
      dispatch({ type: "place", card: state.selected, place });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements: silence,
        screenReaderInstructions: { draggable: "" },
      }}
      onDragStart={dragStart}
      onDragEnd={dragEnd}
      onDragCancel={() => {}}
    >
      <div
        className="board"
        onKeyDown={(event) => {
          if (event.key === "Escape" && state.selected !== null) {
            select(state.selected);
          }
        }}
      >
        <div className="board-bar">
          <DimensionPicker
            dimensions={deck.dimensions}
            chosen={state.dimension}
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
            className="board-action"
            disabled={!canCheck}
            onClick={() => dispatch({ type: "check" })}
          >
            Check
          </button>
          {!canCheck && (
            <span className="board-hint">Place every card to check</span>
          )}
          <button
            type="button"
            className="board-action"
            disabled={!canRetry}
            onClick={() => dispatch({ type: "retry", random })}
          >
            Retry
          </button>
          {/* Always present, so assistive technology reads the score as it
              appears. */}
          <div aria-live="polite">
            {verdict && (
              <p className="board-score">
                {verdict.correct} of {verdict.total} correct
              </p>
            )}
          </div>
        </div>
        <Pool
          cards={cardsIn({ kind: "pool" })}
          selected={state.selected}
          marks={state.marks}
          disabled={disabled}
          onPressCard={select}
          onPressLabel={() => send({ kind: "pool" })}
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
                selected={state.selected}
                marks={state.marks}
                disabled={disabled}
                onPressCard={select}
                onPressLabel={() =>
                  send({ kind: "zone", category: category.id })
                }
              />
            ))
          )}
        </div>
      </div>
    </DndContext>
  );
}
