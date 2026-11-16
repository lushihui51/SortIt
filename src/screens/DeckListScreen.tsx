import { useQuery } from "convex/react";
import { useRef, useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import Account from "../account/Account";
import { useDeckActs } from "../decks/useDeckActs";
import { deckAddress } from "../routes/deckAddress";
import InfoButton from "../ui/InfoButton";
import NewField from "../ui/NewField";
import Panel from "../ui/Panel";
import Question from "../ui/Question";
import { deleteDeckQuestion } from "../words/deleteQuestion";
import { refusalWords } from "../words/refusalWords";
import { useDeckNotOpened } from "./DeckNotOpened";
import "./DeckListScreen.css";

/**
 * The list of the learner's decks, under the line that a deck cannot be
 * opened while `useDeckNotOpened` shows it, and ended by the "New deck" field,
 * which opens the board of the deck it makes. Each deck's ⓘ opens its panel,
 * whose Delete deletes the deck once the learner agrees to a question.
 */
export default function DeckListScreen(): ReactElement | null {
  const decks = useQuery(api.decks.list);
  const { shown } = useDeckNotOpened();
  const { createDeck, deleteDeck } = useDeckActs();
  const navigate = useNavigate();
  // The id of the deck whose panel is open, and whether its question is.
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  // The ⓘ that opened the panel, which takes the focus back when it closes.
  const opener = useRef<HTMLElement | null>(null);
  if (decks === undefined) return null;
  // A panel or a question shows only while the list holds its deck.
  const openDeck = decks.find((deck) => deck.id === open);

  function makeDeck(name: string): string | null {
    const made = createDeck(name);
    if (made.ok) {
      navigate(deckAddress(made.deck));
      return null;
    }
    const { refusal } = made;
    return refusal.refused === "gone" ? null : refusalWords(refusal);
  }

  function openPanel(deck: string, from: HTMLElement) {
    opener.current = from;
    setOpen(deck);
    setAsking(false);
  }

  function closePanel() {
    setOpen(null);
    opener.current?.focus();
  }

  function confirmDelete(deck: string) {
    deleteDeck(deck);
    setAsking(false);
    setOpen(null);
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
              <InfoButton
                className="deck-list-info"
                onPress={(button) => openPanel(deck.id, button)}
              />
            </li>
          ))}
        </ul>
        <NewField
          label="New deck"
          onEnter={makeDeck}
          className="deck-list-new"
        />
      </div>
      {openDeck && (
        <Panel heading={openDeck.name} onClose={closePanel}>
          <div className="panel-row">
            <button
              type="button"
              className="panel-delete"
              aria-label="Delete"
              onClick={() => setAsking(true)}
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
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </Panel>
      )}
      {openDeck && asking && (
        <Question
          question={deleteDeckQuestion(openDeck)}
          confirm="Delete"
          onConfirm={() => confirmDelete(openDeck.id)}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}
