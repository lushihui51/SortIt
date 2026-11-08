import Board from './board/Board'
import { shippedSet } from './set/shippedSet'

export default function App() {
  return <Board set={shippedSet} />
}
