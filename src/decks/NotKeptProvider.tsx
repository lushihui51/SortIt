import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useLocation, useNavigationType } from "react-router";
import type { LeftOut, Refusal } from "../../convex/model/deckActs";
import { linesFor, type SentAct } from "./notKept";

type Settle = { settle(returned: Refusal | LeftOut | null): void };

type NotKeptSender = { send(sent: SentAct): Settle };

type Line = {
  /** Tells apart two lines of the same words. */
  key: number;
  text: string;
  /** Whether a screen calling `useNotKeptLines` has drawn the line. */
  shown: boolean;
};

type NotKeptLines = {
  lines: readonly Line[];
  /** Marks each of `lines` as shown. */
  markShown(lines: readonly Line[]): void;
};

const settleNothing: Settle = { settle: () => {} };

const SenderContext = createContext<NotKeptSender>({
  send: () => settleNothing,
});

const LinesContext = createContext<NotKeptLines>({
  lines: [],
  markShown: () => {},
});

/** Whether `act` names the thing of id `id` as its subject, among its others or in its answers. */
function touches(act: SentAct, id: string): boolean {
  return (
    act.subject.id === id ||
    act.others.some((thing) => thing.id === id) ||
    (act.answers ?? []).some(
      (pair) => pair.card.id === id || pair.category.id === id,
    )
  );
}

/** Holds, in memory alone, every act sent in order, the ids of the things never made, and the lines for changes not kept. It must be rendered inside the router. */
export function NotKeptProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const sent = useRef<SentAct[]>([]);
  const notMade = useRef(new Set<string>());
  const nextKey = useRef(0);
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const [state, setState] = useState<{ path: string; lines: Line[] }>({
    path: pathname,
    lines: [],
  });
  // A line the learner has read goes once they move to another path, and a
  // replacement of the address by the app is no move of theirs (PDR 014).
  if (state.path !== pathname) {
    setState({
      path: pathname,
      lines:
        navigationType === "REPLACE"
          ? state.lines
          : state.lines.filter((line) => !line.shown),
    });
  }

  const sender = useMemo<NotKeptSender>(
    () => ({
      send(act) {
        const index = sent.current.push(act) - 1;
        return {
          settle(returned) {
            if (returned === null) return;
            const laterChanged = sent.current
              .slice(index + 1)
              .some((later) => touches(later, act.subject.id));
            const notKept = linesFor(
              act,
              returned,
              notMade.current,
              laterChanged,
            );
            for (const id of notKept.notMade) notMade.current.add(id);
            if (notKept.lines.length === 0) return;
            const added = notKept.lines.map((text) => ({
              key: nextKey.current++,
              text,
              shown: false,
            }));
            setState((current) => ({
              ...current,
              lines: [...current.lines, ...added],
            }));
          },
        };
      },
    }),
    [],
  );

  const markShown = useCallback((lines: readonly Line[]) => {
    const keys = new Set(lines.map((line) => line.key));
    setState((current) =>
      current.lines.some((line) => keys.has(line.key) && !line.shown)
        ? {
            ...current,
            lines: current.lines.map((line) =>
              keys.has(line.key) ? { ...line, shown: true } : line,
            ),
          }
        : current,
    );
  }, []);
  const lines = useMemo(
    () => ({ lines: state.lines, markShown }),
    [state.lines, markShown],
  );

  return (
    <SenderContext value={sender}>
      <LinesContext value={lines}>{children}</LinesContext>
    </SenderContext>
  );
}

/**
 * The lines the screen that calls it shows, oldest first. Only the board's
 * screens and the list of decks call it, and only where they draw the lines:
 * a call counts as showing them, and a line shown goes with the learner's next
 * move to another path. Outside a `NotKeptProvider` it gives no line.
 */
export function useNotKeptLines(): string[] {
  const { lines, markShown } = useContext(LinesContext);
  // A line counts as shown once a screen has drawn it, and from then on goes
  // with the learner's next move to another path.
  useEffect(() => {
    markShown(lines);
  }, [lines, markShown]);
  return useMemo(() => lines.map((line) => line.text), [lines]);
}

/**
 * For the hook alone. `send` records an act as sent; the `settle` it returns
 * takes what the act's mutation returned, or null when it returned null or
 * threw, and is called once. Outside a `NotKeptProvider`, `settle` does
 * nothing.
 */
export function useNotKept(): {
  send(sent: SentAct): { settle(returned: Refusal | LeftOut | null): void };
} {
  return useContext(SenderContext);
}
