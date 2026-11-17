import { useEffect, useId, useRef, type ReactElement } from "react";
import "./Question.css";

export type QuestionProps = {
  /** The question, as 'Delete the deck "History"?'. */
  question: string;
  /** The word of the button that agrees, as "Delete". */
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A modal question over the whole page, a panel included, with a button that
 * agrees and Cancel. While it is rendered the focus and the keyboard are its
 * alone: it moves the focus to Cancel when it mounts, keeps Tab and Shift+Tab
 * on its two buttons, and the Escape key calls `onCancel`, so that a panel
 * under it neither closes nor takes the focus. A press outside it does
 * nothing. When it unmounts it returns the focus to the element that had it
 * when it mounted, if that element still stands.
 */
export default function Question({
  question,
  confirm,
  onConfirm,
  onCancel,
}: QuestionProps): ReactElement {
  const questionId = useId();
  const box = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const had = document.activeElement;
    cancel.current?.focus();
    return () => {
      // A focus on an element no longer in the page does nothing.
      if (had instanceof HTMLElement) had.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || box.current === null) return;
      // Every Tab is the question's own, the one between its buttons
      // included, so that a panel under it never sees one to act on.
      event.preventDefault();
      const buttons = [...box.current.querySelectorAll("button")];
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.shiftKey ? -1 : 1;
      const next =
        at === -1
          ? buttons[0]
          : buttons[(at + step + buttons.length) % buttons.length];
      next.focus();
    }
    // Listened for in the capture phase, so that the question takes each key
    // before a panel's listener on the document sees it.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  return (
    <>
      {/* A press here does nothing and is kept from taking the focus out of
          the question. */}
      <div
        className="question-scrim"
        onMouseDown={(event) => event.preventDefault()}
      />
      <div
        ref={box}
        className="question"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={questionId}
      >
        <p id={questionId} className="question-text">
          {question}
        </p>
        <div className="question-buttons">
          <button type="button" className="question-button" onClick={onConfirm}>
            {confirm}
          </button>
          <button
            ref={cancel}
            type="button"
            className="question-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
