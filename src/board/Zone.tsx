import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Category } from "../../convex/model/deck";
import Card from "./Card";
import "./Zone.css";
import type { PoolProps } from "./Pool";

export type ZoneProps = PoolProps & { category: Category };

/**
 * One zone: a region named by its label, the category's name, holding its
 * cards. A card dropped on it is placed in the zone, so it must be rendered
 * inside the board's `DndContext`.
 */
export default function Zone({
  category,
  cards,
  selected,
  marks,
  disabled,
  onPressCard,
  onPressLabel,
}: ZoneProps) {
  const labelId = useId();
  const { setNodeRef, isOver } = useDroppable({
    id: `zone:${category.id}`,
    data: { place: { kind: "zone", category: category.id } },
  });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={labelId}
      className={isOver ? "zone zone-over" : "zone"}
    >
      <button
        type="button"
        id={labelId}
        className="zone-label"
        onClick={onPressLabel}
      >
        {category.name}
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
