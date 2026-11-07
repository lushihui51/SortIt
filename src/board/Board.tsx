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
  type Place,
  type RandomSource,
} from "./board";
import DimensionPicker from "./DimensionPicker";
import Pool from "./Pool";
import Zone from "./Zone";

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
 * The board over `set`: the picker, Reset, the pool and the zones of the
 * chosen dimension. It loads with every card in the pool and no dimension
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
        onKeyDown={(event) => {
          if (event.key === "Escape" && state.selected !== null) {
            select(state.selected);
          }
        }}
      >
        <DimensionPicker
          dimensions={set.dimensions.map((dimension) => dimension.name)}
          chosen={state.dimension}
          onChoose={(dimension) =>
            dispatch({ type: "chooseDimension", dimension, random })
          }
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "reset", random })}
        >
          Reset
        </button>
        <Pool
          items={itemsIn({ kind: "pool" })}
          selected={state.selected}
          disabled={disabled}
          onPressCard={select}
          onPressLabel={() => send({ kind: "pool" })}
        />
        {disabled ? (
          <p>Choose how to sort to begin</p>
        ) : (
          categories.map((category) => (
            <Zone
              key={category}
              category={category}
              items={itemsIn({ kind: "zone", category })}
              selected={state.selected}
              disabled={disabled}
              onPressCard={select}
              onPressLabel={() => send({ kind: "zone", category })}
            />
          ))
        )}
      </div>
    </DndContext>
  );
}
