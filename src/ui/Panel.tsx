import {
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import "./Panel.css";

export type PanelProps = {
  /** The name of the thing the panel opens: its heading and the dialog's accessible name. */
  heading: string;
  onClose: () => void;
  /** What the panel holds under its heading. */
  children?: ReactNode;
};

// Every element the keyboard can focus, for keeping the focus inside the panel.
const focusable =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal panel over the whole page, headed by `heading`, with a Close button.
 * While it is rendered it takes the focus, moving it to Close when it mounts
 * and keeping Tab and Shift+Tab inside the panel, and Close or the Escape key
 * calls `onClose`; the caller removes the panel and returns the focus where it
 * belongs. A press outside the panel does nothing.
 */
export default function Panel({
  heading,
  onClose,
  children,
}: PanelProps): ReactElement {
  const headingId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || dialog.current === null) return;
      const inside = [
        ...dialog.current.querySelectorAll<HTMLElement>(focusable),
      ];
      const first = inside[0];
      const last = inside[inside.length - 1];
      const at = document.activeElement;
      // Tab past the last control, Shift+Tab before the first, or either from
      // outside the panel, wraps around to the panel's other end.
      const leaving =
        !dialog.current.contains(at) ||
        (event.shiftKey ? at === first : at === last);
      if (leaving) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* A press here is kept from taking the focus out of the panel. */}
      <div
        className="panel-scrim"
        onMouseDown={(event) => event.preventDefault()}
      />
      <div
        ref={dialog}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <div className="panel-head">
          <h2 id={headingId} className="panel-heading">
            {heading}
          </h2>
          <button
            ref={close}
            type="button"
            className="panel-close"
            aria-label="Close"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
