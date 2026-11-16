import type { ReactElement } from "react";
import Board from "../board/Board";
import { useDeckBoard } from "../board/BoardsProvider";
import { appDeck } from "../deck/appDeck";

/** The screen of the app's own deck; it must be rendered inside `BoardsProvider`. */
export default function AppDeckScreen(): ReactElement | null {
  const { board, dispatch } = useDeckBoard(appDeck);
  if (board === null) return null;
  return <Board deck={appDeck} board={board} dispatch={dispatch} />;
}
