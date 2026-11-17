import { useDroppable } from "@dnd-kit/core";
import { useId } from "react";
import type { Category } from "../../convex/model/deck";
import InfoButton from "../ui/InfoButton";
import Card from "./Card";
import "./Zone.css";
import type { PoolProps } from "./Pool";

export type ZoneProps = PoolProps & {
  category: Category;
  /** Called with the category's id and its ⓘ when that ⓘ is pressed; while absent the label holds no ⓘ. */
  onOpenCategory?: (category: string, opener: HTMLElement) => void;
};

/**
 * One zone: a region named by the category's name, holding its cards. Its
 * label shows the name and, given `onOpenCategory`, the category's ⓘ after
 * it. A card dropped on it is placed in the zone, so it must be rendered
 * inside the board's `DndContext`.
 */
export default function Zone({
  category,
  cards,
  marks,
  disabled,
  onOpen,
  onOpenCategory,
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
      <div className="zone-label">
        <span id={labelId}>{category.name}</span>
        {onOpenCategory && (
          <InfoButton
            className="zone-info"
            onPress={(button) => onOpenCategory(category.id, button)}
          />
        )}
      </div>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          mark={marks[card.id] ?? null}
          disabled={disabled}
          onOpen={onOpen}
        />
      ))}
    </section>
  );
}
