import { useDraggable } from "@dnd-kit/core";
import type { Card as CardModel } from "../../convex/model/deck";
import type { Mark } from "./board";
import "./Card.css";

export type CardProps = {
  card: CardModel;
  selected: boolean;
  /** The card's verdict from Check; null while the card bears no mark. */
  mark: Mark | null;
  disabled: boolean;
  /** Called with the card's id. */
  onPress: (card: string) => void;
};

const icons: Record<Mark, string> = { correct: "✓", incorrect: "✕" };
const words: Record<Mark, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
};

/**
 * One card of the deck as a button showing the card's name; pressing it calls
 * `onPress` with the card's id. It is also a draggable whose id is the card's
 * id, so it must be rendered inside the board's `DndContext`.
 */
export default function Card({
  card,
  selected,
  mark,
  disabled,
  onPress,
}: CardProps) {
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
        (selected ? " card-selected" : "") +
        (isDragging ? " card-dragging" : "")
      }
      data-mark={mark ?? undefined}
      disabled={disabled}
      onClick={() => onPress(card.id)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...listeners}
    >
      {card.name}
      {/* The icon shows the mark beside its colour; the hidden word speaks it,
          so the spoken name reads "<card> Correct" or "<card> Incorrect". */}
      {mark && " "}
      {mark && <span aria-hidden="true">{icons[mark]}</span>}
      {mark && <span className="visually-hidden">{words[mark]}</span>}
      {/* The space keeps the spoken name "<card> Selected" two words. */}
      {selected && " "}
      {selected && <span className="visually-hidden">Selected</span>}
    </button>
  );
}
