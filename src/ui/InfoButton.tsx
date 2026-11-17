import type { ReactElement } from "react";
import "./InfoButton.css";

/** The ⓘ: one button whose text is the character ⓘ, which stops a pointer press from reaching what it sits on. */
export default function InfoButton({
  onPress,
  className,
}: {
  /** Called with the pressed ⓘ, which takes the focus back when what it opened closes. */
  onPress: (button: HTMLElement) => void;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      className={"info-button" + (className ? ` ${className}` : "")}
      // A press on the ⓘ never reaches what it sits on, so on a card it cannot
      // start a drag.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => onPress(event.currentTarget)}
    >
      ⓘ
    </button>
  );
}
