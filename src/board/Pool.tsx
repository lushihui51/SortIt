import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Mark } from "./board";
import Card from "./Card";
import "./Pool.css";

export type PoolProps = {
  /** The names of the cards shown here, in the order shown. */
  cards: readonly string[];
  /** The selected card's name; null while no card is selected. */
  selected: string | null;
  /** The mark of each card that bears one, keyed by card name; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** Disables every card shown here. */
  disabled: boolean;
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
          key={card}
          card={card}
          selected={card === selected}
          mark={marks[card] ?? null}
          disabled={disabled}
          onPress={onPressCard}
        />
      ))}
    </section>
  );
}
