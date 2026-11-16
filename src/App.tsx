import Board from "./board/Board";
import { appDeckFile } from "./deck/appDeck";

export default function App() {
  return <Board deck={appDeckFile} />;
}
