import { useQuery } from "convex/react";
import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import Account from "../account/Account";
import { useDeckActs } from "../decks/useDeckActs";
import { deckAddress } from "../routes/deckAddress";
import NewField from "../ui/NewField";
import { refusalWords } from "../words/refusalWords";
import { useDeckNotOpened } from "./DeckNotOpened";
import "./DeckListScreen.css";

/**
 * The list of the learner's decks, under the line that a deck cannot be
 * opened while `useDeckNotOpened` shows it, and ended by the "New deck" field,
 * which opens the board of the deck it makes.
 */
export default function DeckListScreen(): ReactElement | null {
  const decks = useQuery(api.decks.list);
  const { shown } = useDeckNotOpened();
  const { createDeck } = useDeckActs();
  const navigate = useNavigate();
  if (decks === undefined) return null;

  function makeDeck(name: string): string | null {
    const made = createDeck(name);
    if (made.ok) {
      navigate(deckAddress(made.deck));
      return null;
    }
    const { refusal } = made;
    return refusal.refused === "gone" ? null : refusalWords(refusal);
  }

  return (
    <div className="deck-list-screen">
      <div className="deck-list-bar">
        <Account />
      </div>
      <div className="deck-list-column">
        {shown && (
          <p role="status" className="deck-list-line">
            This deck cannot be opened. It may have been deleted, or belong to
            another account.
          </p>
        )}
        <ul className="deck-list">
          {decks.map((deck) => (
            <li key={deck.id} className="deck-list-deck">
              <Link className="deck-list-link" to={deckAddress(deck)}>
                {deck.name}
              </Link>
            </li>
          ))}
        </ul>
        <NewField
          label="New deck"
          onEnter={makeDeck}
          className="deck-list-new"
        />
      </div>
    </div>
  );
}
