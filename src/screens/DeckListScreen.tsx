import { useQuery } from "convex/react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import Account from "../account/Account";
import { deckAddress } from "../routes/deckAddress";
import "./DeckListScreen.css";

/** The list of the learner's decks. */
export default function DeckListScreen(): ReactElement | null {
  const decks = useQuery(api.decks.list);
  if (decks === undefined) return null;
  return (
    <div className="deck-list-screen">
      <div className="deck-list-bar">
        <Account />
      </div>
      <ul className="deck-list">
        {decks.map((deck) => (
          <li key={deck.id} className="deck-list-deck">
            <Link className="deck-list-link" to={deckAddress(deck)}>
              {deck.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
