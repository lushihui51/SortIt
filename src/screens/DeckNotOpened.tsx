import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { matchPath, useLocation } from "react-router";

type DeckNotOpened = { shown: boolean; show: () => void };

const DeckNotOpenedContext = createContext<DeckNotOpened>({
  shown: false,
  show: () => {},
});

/** Holds whether the list of decks shows that a deck cannot be opened, for `useDeckNotOpened` inside it. It must be rendered inside a router. */
export function DeckNotOpenedProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { pathname } = useLocation();
  const [state, setState] = useState({ shown: false, path: pathname });
  // The line stays through the move from a deck's address to the list, and
  // goes once the learner leaves the list.
  if (state.path !== pathname) {
    const leftList = matchPath("/decks", state.path) !== null;
    setState({ shown: state.shown && !leftList, path: pathname });
  }
  const show = useCallback(
    () => setState((current) => ({ ...current, shown: true })),
    [],
  );
  const value = useMemo(
    () => ({ shown: state.shown, show }),
    [state.shown, show],
  );
  return <DeckNotOpenedContext value={value}>{children}</DeckNotOpenedContext>;
}

/** `shown` turns true at `show()` and false the next time the address's path changes from /decks to another path. It lives in memory alone. Outside the provider it gives `shown` false and a `show` that does nothing. */
export function useDeckNotOpened(): DeckNotOpened {
  return useContext(DeckNotOpenedContext);
}
