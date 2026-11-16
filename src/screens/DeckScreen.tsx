import { useQuery } from "convex/react";
import { useEffect, type ReactElement } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Deck } from "../../convex/model/deck";
import Account from "../account/Account";
import Board from "../board/Board";
import { useDeckBoard } from "../board/BoardsProvider";
import { deckAddress, deckIdOf } from "../routes/deckAddress";
import BackToList from "./BackToList";
import { useDeckNotOpened } from "./DeckNotOpened";

/**
 * The screen of a learner's deck, the one screen that reads a deck from
 * Convex: the board of the deck the address's code names. A deck the learner
 * cannot open brings the list of decks with the line saying so. It must be
 * rendered at the route `/decks/:segment` inside `BoardsProvider` and
 * `DeckNotOpenedProvider`, for a signed-in learner.
 */
export default function DeckScreen(): ReactElement | null {
  const { segment = "" } = useParams();
  const id = deckIdOf(segment);
  const navigate = useNavigate();
  const { show } = useDeckNotOpened();
  const own = useQuery(api.decks.get, id === null ? "skip" : { id });
  const decks = useQuery(api.decks.list);
  // A deck just made shows its board from the list while its own query
  // loads, whatever the connection (PDR 014).
  const deck = own === undefined ? decks?.find((each) => each.id === id) : own;
  const address = deck ? deckAddress(deck) : null;

  useEffect(() => {
    if (deck === null) {
      show();
      navigate("/decks", { replace: true });
    }
  }, [deck, show, navigate]);

  // The address follows the deck's name; the code alone finds the deck.
  useEffect(() => {
    if (address !== null && address.split("/").pop() !== segment) {
      navigate(address, { replace: true });
    }
  }, [address, segment, navigate]);

  if (!deck) return null;
  return <DeckBoard deck={deck} />;
}

function DeckBoard({ deck }: { deck: Deck }): ReactElement | null {
  const { board, dispatch } = useDeckBoard(deck);
  if (board === null) return null;
  return (
    <Board
      deck={deck}
      board={board}
      dispatch={dispatch}
      account={<Account />}
      back={<BackToList />}
    />
  );
}
