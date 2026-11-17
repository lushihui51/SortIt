import type { ReactElement } from "react";
import { Link } from "react-router";
import "./BackToList.css";

/** The arrow back to the list of decks: a link to /decks. It must be rendered inside a router. */
export default function BackToList(): ReactElement {
  return (
    <Link
      to="/decks"
      className="back-to-list"
      aria-label="Back to the list of decks"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </Link>
  );
}
