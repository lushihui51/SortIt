import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Card as CardModel } from "../../convex/model/deck";
import type { Mark } from "./board";
import Card from "./Card";
import "./Pool.css";

export type PoolProps = {
  /** The cards shown here, in the order shown. */
  cards: readonly CardModel[];
  /** The mark of each card that bears one, keyed by card id; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** Keeps every card shown here from being dragged. */
  disabled: boolean;
};

/**
 * The pool: a region named by its label "Unsorted", holding its cards. A card
 * dropped on it is placed in the pool, so it must be rendered inside the
 * board's `DndContext`.
 */
export default function Pool({ cards, marks, disabled }: PoolProps) {
  const labelId = useId();
  const { setNodeRef, isOver } = useDroppable({
    id: "pool",
    data: { place: { kind: "pool" } },
  });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={labelId}
      className={isOver ? "pool pool-over" : "pool"}
    >
      <span id={labelId} className="pool-label">
        Unsorted
      </span>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          mark={marks[card.id] ?? null}
          disabled={disabled}
        />
      ))}
    </section>
  );
}
