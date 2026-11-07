import { useDraggable } from "@dnd-kit/core";
import type { Mark } from "./board";
import "./Card.css";

export type CardProps = {
  item: string;
  selected: boolean;
  /** The card's verdict from Check; null while the card bears no mark. */
  mark: Mark | null;
  disabled: boolean;
  onPress: (item: string) => void;
};

const icons: Record<Mark, string> = { correct: "✓", incorrect: "✕" };
const words: Record<Mark, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
};

/**
 * One item of the set as a button; pressing it calls `onPress` with `item`.
 * It is also a draggable whose id is `item`, so it must be rendered inside the
 * board's `DndContext`.
 */
export default function Card({
  item,
  selected,
  mark,
  disabled,
  onPress,
}: CardProps) {
  // The draggable's `attributes` are left off the button: they add a role
  // description and a description in words the app never shows.
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({
    id: item,
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
      onClick={() => onPress(item)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...listeners}
    >
      {item}
      {/* The icon shows the mark beside its colour; the hidden word speaks it,
          so the spoken name reads "<item> Correct" or "<item> Incorrect". */}
      {mark && " "}
      {mark && <span aria-hidden="true">{icons[mark]}</span>}
      {mark && <span className="visually-hidden">{words[mark]}</span>}
      {/* The space keeps the spoken name "<item> Selected" two words. */}
      {selected && " "}
      {selected && <span className="visually-hidden">Selected</span>}
    </button>
  );
}
