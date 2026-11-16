import { BoardsProvider } from "./board/BoardsProvider";
import AppDeckScreen from "./screens/AppDeckScreen";

export default function App() {
  return (
    <BoardsProvider>
      <AppDeckScreen />
    </BoardsProvider>
  );
}
