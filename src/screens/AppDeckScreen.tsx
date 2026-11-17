import { useConvexAuth } from "convex/react";
import type { ReactElement } from "react";
import Account, { type AccountProps } from "../account/Account";
import Board from "../board/Board";
import { useDeckBoard } from "../board/BoardsProvider";
import { appDeck } from "../deck/appDeck";
import { useNotKeptLines } from "../decks/NotKeptProvider";
import { useChangesWaiting } from "../decks/useChangesWaiting";
import Notice from "../ui/Notice";
import BackToList from "./BackToList";

/** The screen of the app's own deck, with the arrow back to the list of decks while the learner is signed in, the line while changes are not yet kept and the lines for changes not kept; its props go to its `Account`. It must be rendered inside a router and inside `BoardsProvider`. */
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
      notices={<SavingNotices />}
    />
  );
}

/**
 * The line while changes are not yet kept, then one notice for each line for a
 * change not kept, oldest first; rendering it counts as showing the latter.
 */
function SavingNotices(): ReactElement {
  const waiting = useChangesWaiting();
  const lines = useNotKeptLines();
  return (
    <>
      {waiting && (
        <Notice>Your changes are not saved yet. Keep this page open.</Notice>
      )}
      {lines.map((line, index) => (
        <Notice key={index}>{line}</Notice>
      ))}
    </>
  );
}
