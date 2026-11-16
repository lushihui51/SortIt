import { useDraggable } from "@dnd-kit/core";
import type { Card as CardModel } from "../../convex/model/deck";
import type { Mark } from "./board";
import "./Card.css";

export type CardProps = {
  card: CardModel;
  /** The card's mark; null while the card bears none. */
  mark: Mark | null;
  /** Keeps the card from being dragged. */
  disabled: boolean;
};

const icons: Record<Mark, string> = {
  correct: "✓",
  incorrect: "✕",
  noAnswer: "?",
};
const words: Record<Mark, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
  noAnswer: "No answer",
};

/**
 * One card of the deck, showing its name and its mark, moved only by
 * dragging it. It is a draggable whose id is the card's id, so it must be
 * rendered inside the board's `DndContext`.
 */
export default function Card({ card, mark, disabled }: CardProps) {
  // The draggable's `attributes` are left off the button: they add a role
  // description and a description in words the app never shows.
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({
    id: card.id,
    disabled,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={
        "card" +
        (disabled ? " card-locked" : "") +
        (isDragging ? " card-dragging" : "")
      }
      data-mark={mark ?? undefined}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...listeners}
    >
      {card.name}
      {/* The icon shows the mark beside its colour; the hidden word speaks it,
          so the spoken name reads "<card> Correct", "<card> Incorrect" or
          "<card> No answer". */}
      {mark && " "}
      {mark && <span aria-hidden="true">{icons[mark]}</span>}
      {mark && <span className="visually-hidden">{words[mark]}</span>}
    </button>
  );
}
