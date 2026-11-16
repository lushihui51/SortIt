import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Card as CardModel } from "../../convex/model/deck";
import type { Mark } from "./board";
import Card from "./Card";
import "./Pool.css";

export type PoolProps = {
  /** The cards shown here, in the order shown. */
  cards: readonly CardModel[];
  /** The selected card's id; null while no card is selected. */
  selected: string | null;
  /** The mark of each card that bears one, keyed by card id; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** Disables every card shown here. */
  disabled: boolean;
  /** Called with the pressed card's id. */
  onPressCard: (card: string) => void;
  onPressLabel: () => void;
};

/**
 * The pool: a region named by its label "Unsorted", holding its cards. A card
 * dropped on it is placed in the pool, so it must be rendered inside the
 * board's `DndContext`.
 */
export default function Pool({
  cards,
  selected,
  marks,
  disabled,
  onPressCard,
  onPressLabel,
}: PoolProps) {
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
      <button
        type="button"
        id={labelId}
        className="pool-label"
        onClick={onPressLabel}
      >
        Unsorted
      </button>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          selected={card.id === selected}
          mark={marks[card.id] ?? null}
          disabled={disabled}
          onPress={onPressCard}
        />
      ))}
    </section>
  );
}
