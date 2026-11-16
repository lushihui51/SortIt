import { useConvexAuth } from "convex/react";
import type { ReactElement } from "react";
import Account, { type AccountProps } from "../account/Account";
import Board from "../board/Board";
import { useDeckBoard } from "../board/BoardsProvider";
import { appDeck } from "../deck/appDeck";
import BackToList from "./BackToList";

/** The screen of the app's own deck, with the arrow back to the list of decks while the learner is signed in; its props go to its `Account`. It must be rendered inside a router and inside `BoardsProvider`. */
export default function AppDeckScreen(
  props: AccountProps,
): ReactElement | null {
  const { isAuthenticated } = useConvexAuth();
  const { board, dispatch } = useDeckBoard(appDeck);
  if (board === null) return null;
  return (
    <Board
      deck={appDeck}
      board={board}
      dispatch={dispatch}
      account={<Account {...props} />}
      back={isAuthenticated ? <BackToList /> : undefined}
    />
  );
}
