import type { ReactElement } from "react";
import Account, { type AccountProps } from "../account/Account";
import Board from "../board/Board";
import { useDeckBoard } from "../board/BoardsProvider";
import { appDeck } from "../deck/appDeck";

/** The screen of the app's own deck; its props go to its `Account`. It must be rendered inside `BoardsProvider`. */
export default function AppDeckScreen(
  props: AccountProps,
): ReactElement | null {
  const { board, dispatch } = useDeckBoard(appDeck);
  if (board === null) return null;
  return (
    <Board
      deck={appDeck}
      board={board}
      dispatch={dispatch}
      account={<Account {...props} />}
    />
  );
}
