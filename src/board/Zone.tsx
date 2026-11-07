import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import Card from "./Card";
import "./Zone.css";
import type { PoolProps } from "./Pool";

export type ZoneProps = PoolProps & { category: string };

/**
 * One zone: a region named by its label, the category's name, holding its
 * cards. A card dropped on it is placed in the zone, so it must be rendered
 * inside the board's `DndContext`.
 */
export default function Zone({
  category,
  items,
  selected,
  disabled,
  onPressCard,
  onPressLabel,
}: ZoneProps) {
  const labelId = useId();
  const { setNodeRef, isOver } = useDroppable({
    id: `zone:${category}`,
    data: { place: { kind: "zone", category } },
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
        {category}
      </button>
      {items.map((item) => (
        <Card
          key={item}
          item={item}
          selected={item === selected}
          disabled={disabled}
          onPress={onPressCard}
        />
      ))}
    </section>
  );
}
