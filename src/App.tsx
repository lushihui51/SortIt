import Board from "./board/Board";
import { appDeck } from "./deck/appDeck";

export default function App() {
  return <Board deck={appDeck} />;
}
