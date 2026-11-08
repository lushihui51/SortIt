import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Mark } from "./board";
import Card from "./Card";
import "./Pool.css";

export type PoolProps = {
  /** The item names of the cards shown here, in the order shown. */
  items: readonly string[];
  /** The selected card's item name; null while no card is selected. */
  selected: string | null;
  /** The mark of each card that bears one, keyed by item name; a card with no entry is unmarked. */
  marks: Record<string, Mark>;
  /** Disables every card shown here. */
  disabled: boolean;
  onPressCard: (item: string) => void;
  onPressLabel: () => void;
};

/**
 * The pool: a region named by its label "Unsorted", holding its cards. A card
 * dropped on it is placed in the pool, so it must be rendered inside the
 * board's `DndContext`.
 */
export default function Pool({
  items,
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
      {items.map((item) => (
        <Card
          key={item}
          item={item}
          selected={item === selected}
          mark={marks[item] ?? null}
          disabled={disabled}
          onPress={onPressCard}
        />
      ))}
    </section>
  );
}
