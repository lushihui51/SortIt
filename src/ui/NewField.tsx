import {
  useId,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import "./NewField.css";

export type NewFieldProps = {
  /** The field's words: its placeholder and its accessible name, as "New deck". */
  label: string;
  /** Called with the text as typed when the learner presses Enter. Returns null when the name was taken up, or the words of its refusal. */
  onEnter: (name: string) => string | null;
  /** A class for the `<input>`. */
  className?: string;
};

/**
 * A dashed text field that makes a thing of the name typed into it when the
 * learner presses Enter. A name taken up empties the field; a refusal shows
 * its words in a line under the field, which keeps what was typed, until the
 * text changes or an Enter is taken up. The caller's class may change only
 * the field's border width and colour, radius, padding, width and font size.
 */
export default function NewField({
  label,
  onEnter,
  className,
}: NewFieldProps): ReactElement {
  const [text, setText] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const lineId = useId();

  function change(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
    setRefusal(null);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    // An Enter that ends the composing of a character, as in Japanese or
    // Chinese input, is the learner still typing.
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const words = onEnter(text);
    if (words === null) setText("");
    setRefusal(words);
  }

  return (
    <div>
      <input
        type="text"
        className={
          className === undefined ? "new-field" : `new-field ${className}`
        }
        placeholder={label}
        aria-label={label}
        aria-describedby={refusal === null ? undefined : lineId}
        value={text}
        onChange={change}
        onKeyDown={keyDown}
      />
      {refusal !== null && (
        <p id={lineId} role="alert" className="new-field-refusal">
          {refusal}
        </p>
      )}
    </div>
  );
}
