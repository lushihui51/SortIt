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
import type { ItemSet } from "../set/itemSet";
import {
  createBoardReducer,
  emptyBoard,
  score,
  type Place,
  type RandomSource,
} from "./board";
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
  set: ItemSet;
  /** Draws every shuffle of the cards. */
  random?: RandomSource;
};

/**
 * The board over `set`: the picker, Reset, Check, Retry, the score, the pool
 * and the zones of the chosen dimension. It loads with every card in the pool and no dimension
 * chosen, and reads `set` only when it first renders.
 */
export default function Board({
  set,
  random = Math.random,
}: BoardProps): ReactElement {
  const reducer = useMemo(() => createBoardReducer(set), [set]);
  const [state, dispatch] = useReducer(reducer, emptyBoard, (board) =>
    reducer(board, { type: "load", random }),
  );
  const disabled = state.dimension === null;
  const canCheck =
    !disabled &&
    state.order.every((item) => state.places[item].kind !== "pool");
  const canRetry = Object.values(state.marks).includes("incorrect");
  const verdict = score(state);
  const categories =
    set.dimensions.find((dimension) => dimension.name === state.dimension)
      ?.categories ?? [];

  function itemsIn(place: Place): string[] {
    return state.order.filter((item) => {
      const at = state.places[item];
      return place.kind === "pool"
        ? at.kind === "pool"
        : at.kind === "zone" && at.category === place.category;
    });
  }

  // A press that moves less than this is a click or tap and selects the card
  // instead of dragging it (ADR 002).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function dragStart(event: DragStartEvent) {
    dispatch({ type: "dragStart", item: String(event.active.id) });
  }

  function dragEnd(event: DragEndEvent) {
    const place = (event.over?.data.current as { place: Place } | undefined)
      ?.place;
    if (place !== undefined) {
      dispatch({ type: "place", item: String(event.active.id), place });
    }
  }

  function select(item: string) {
    dispatch({ type: "select", item });
  }

  function send(place: Place) {
    if (state.selected !== null) {
      dispatch({ type: "place", item: state.selected, place });
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
            dimensions={set.dimensions.map((dimension) => dimension.name)}
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
          items={itemsIn({ kind: "pool" })}
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
                key={category}
                category={category}
                items={itemsIn({ kind: "zone", category })}
                selected={state.selected}
                marks={state.marks}
                disabled={disabled}
                onPressCard={select}
                onPressLabel={() => send({ kind: "zone", category })}
              />
            ))
          )}
        </div>
      </div>
    </DndContext>
  );
}
