import { useDraggable } from "@dnd-kit/core";
import "./Card.css";

export type CardProps = {
  item: string;
  selected: boolean;
  disabled: boolean;
  onPress: (item: string) => void;
};

/**
 * One item of the set as a button; pressing it calls `onPress` with `item`.
 * It is also a draggable whose id is `item`, so it must be rendered inside the
 * board's `DndContext`.
 */
export default function Card({ item, selected, disabled, onPress }: CardProps) {
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
      {/* The space keeps the spoken name "<item> Selected" two words. */}
      {selected && " "}
      {selected && <span className="visually-hidden">Selected</span>}
    </button>
  );
}
