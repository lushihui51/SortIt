import type { ReactElement, ReactNode } from "react";
import "./Notice.css";

/** One line at the top of a screen, in a box with an icon, which assistive technology reads as it appears. */
export default function Notice({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div role="status" className="notice">
      <svg
        className="notice-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <p className="notice-text">{children}</p>
    </div>
  );
}
