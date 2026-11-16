import { useDraggable } from "@dnd-kit/core";
import type { Card as CardModel } from "../../convex/model/deck";
import InfoButton from "../ui/InfoButton";
import type { Mark } from "./board";
import "./Card.css";

export type CardProps = {
  card: CardModel;
  /** The card's mark; null while the card bears none. */
  mark: Mark | null;
  /** Keeps the card from being dragged. */
  disabled: boolean;
  /** Called with the card's id and its ⓘ when the ⓘ is pressed. */
  onOpen: (card: string, opener: HTMLElement) => void;
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
 * One card of the deck, showing its name, its mark and its ⓘ, moved only by
 * dragging it. A press on the ⓘ calls `onOpen` and never starts a drag, even
 * while `disabled`. It is a draggable whose id is the card's id, so it must be
 * rendered inside the board's `DndContext`.
 */
export default function Card({ card, mark, disabled, onOpen }: CardProps) {
  // The draggable's `attributes` are left off the card: they would make it
  // focusable and add a role, a role description and a description in words
  // the app never shows, and the ⓘ is the card's one focusable part.
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({
    id: card.id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
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
      <span>{card.name}</span>
      {/* The icon shows the mark beside its colour; the hidden word speaks it,
          so a screen reader reads "<card> Correct", "<card> Incorrect" or
          "<card> No answer". */}
      {mark && " "}
      {mark && <span aria-hidden="true">{icons[mark]}</span>}
      {mark && <span className="visually-hidden">{words[mark]}</span>}
      <InfoButton onPress={(button) => onOpen(card.id, button)} />
    </div>
  );
}
