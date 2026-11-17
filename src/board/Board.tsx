import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Card, Deck } from "../../convex/model/deck";
import type { ActResult, SaveAnswersResult } from "../../convex/model/deckActs";
import {
  answersChanged,
  answersOnBoard,
  markOf,
  score,
  type BoardState,
  type Mark,
  type Place,
  type RandomSource,
} from "./board";
import type { DeckBoardAction } from "./BoardsProvider";
import DimensionPicker from "./DimensionPicker";
import Pool from "./Pool";
import Zone from "./Zone";
import NewField from "../ui/NewField";
import Panel from "../ui/Panel";
import Question from "../ui/Question";
import {
  deleteCardQuestion,
  deleteCategoryQuestion,
  deleteDimensionQuestion,
} from "../words/deleteQuestion";
import { refusalWords } from "../words/refusalWords";
import { saveAnswersQuestion } from "../words/saveAnswersQuestion";
import "./Board.css";

// dnd-kit announces drags and describes draggables in words of its own; the
// board speaks only the app's words, so every announcement is silent.
const silence: Announcements = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

/**
 * The acts that change the deck a board shows. Each takes ids and names as
 * the act of its name in convex/model/deckActs.ts does, and returns that
 * act's result on the deck.
 */
export type BoardActs = {
  addCard(name: string): ActResult;
  addDimension(name: string): ActResult;
  addCategory(dimension: string, name: string): ActResult;
  deleteCard(card: string): ActResult;
  deleteDimension(dimension: string): ActResult;
  deleteCategory(dimension: string, category: string): ActResult;
  saveAnswers(
    dimension: string,
    answers: { card: string; category: string }[],
  ): SaveAnswersResult;
};

export type BoardProps = {
  deck: Deck;
  /** The deck's board, fitted to `deck`. */
  board: BoardState;
  /** Sends an action to the deck's board; a deck handed with it must be one an act of the deck returned, and the action applies to that deck. */
  dispatch: (action: DeckBoardAction, deck?: Deck) => void;
  /** Draws the shuffle of Reset, of Retry and of a change of dimension. */
  random?: RandomSource;
  /** Shown at the end of the bar, after the score. */
  account?: ReactNode;
  /** Shown at the start of the bar, before "Sort by". */
  back?: ReactNode;
  /** Shown between the bar and the pool. */
  notices?: ReactNode;
  /** The acts that change the deck; given only for a learner's own deck. */
  acts?: BoardActs;
};

/** The thing whose panel is open: a card, a dimension, or a category of the chosen dimension. */
type Opened = { kind: "card" | "dimension" | "category"; id: string };

/**
 * The board over `deck`: the picker, Reset, the Check switch, Retry, the
 * score, the pool and the zones of the chosen dimension, showing `board` and
 * sending every act on it to `dispatch`, and the panel of the card whose ⓘ was
 * pressed. Given `acts`, it also shows the fields "New card", "New dimension"
 * and, while a dimension is chosen, "New category", each of which calls its
 * act; a new dimension is chosen at once. Given `acts`, each dimension and
 * each zone's label also holds an ⓘ opening the panel of that dimension or
 * category, and every panel holds Delete, which calls the act deleting its
 * thing once the learner agrees to a question. Given `acts`, the bar also
 * holds "Save answers", which calls `saveAnswers` with the chosen dimension
 * and the category of the zone each card lies in, after a question when an
 * existing answer would change. It must be given `board` fitted to `deck`.
 */
export default function Board({
  deck,
  board,
  dispatch,
  random = Math.random,
  account,
  back,
  notices,
  acts,
}: BoardProps): ReactElement {
  const cardsById = useMemo(
    () => new Map(deck.cards.map((card) => [card.id, card])),
    [deck],
  );
  const [open, setOpen] = useState<Opened | null>(null);
  // Whether the question before deleting the open thing shows.
  const [asking, setAsking] = useState(false);
  // The question before Save answers changes existing answers, while it
  // shows.
  const [saveQuestion, setSaveQuestion] = useState<string | null>(null);
  // The ⓘ that opened the panel, which takes the focus back when it closes.
  const opener = useRef<HTMLElement | null>(null);
  const marks: Record<string, Mark> = {};
  for (const card of board.order) {
    const mark = markOf(board, deck, card);
    if (mark !== null) marks[card] = mark;
  }
  const disabled = board.dimension === null;
  const canRetry = Object.values(marks).includes("incorrect");
  const verdict = score(board, deck);
  const chosen = deck.dimensions.find(
    (dimension) => dimension.id === board.dimension,
  );
  const categories = chosen?.categories ?? [];
  // A panel, and a question over it, shows only while the deck holds its
  // thing.
  const panel = open === null ? undefined : panelOf(open);

  function cardsIn(place: Place): Card[] {
    return board.order
      .filter((card) => {
        const at = board.places[card];
        return place.kind === "pool"
          ? at.kind === "pool"
          : at.kind === "zone" && at.category === place.category;
      })
      .map((card) => cardsById.get(card)!);
  }

  // A press that moves less than this is a click or tap, not a drag (ADR 014).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  /**
   * The open thing's name, the question before deleting it and the act that
   * deletes it, or undefined when the deck no longer holds it.
   */
  function panelOf(
    opened: Opened,
  ):
    | { heading: string; question: string; remove: (acts: BoardActs) => void }
    | undefined {
    if (opened.kind === "card") {
      const card = cardsById.get(opened.id);
      return (
        card && {
          heading: card.name,
          question: deleteCardQuestion(card),
          remove: (acts) => acts.deleteCard(card.id),
        }
      );
    }
    if (opened.kind === "dimension") {
      const dimension = deck.dimensions.find((each) => each.id === opened.id);
      return (
        dimension && {
          heading: dimension.name,
          question: deleteDimensionQuestion(dimension),
          remove: (acts) => acts.deleteDimension(dimension.id),
        }
      );
    }
    const category = categories.find((each) => each.id === opened.id);
    return (
      chosen &&
      category && {
        heading: category.name,
        question: deleteCategoryQuestion(deck, chosen, category),
        remove: (acts) => acts.deleteCategory(chosen.id, category.id),
      }
    );
  }

  function openPanel(kind: Opened["kind"], id: string, from: HTMLElement) {
    opener.current = from;
    setOpen({ kind, id });
    setAsking(false);
  }

  function closePanel() {
    setOpen(null);
    opener.current?.focus();
  }

  function confirmDelete(acts: BoardActs, remove: (acts: BoardActs) => void) {
    // Nothing is dispatched: `fitBoard` takes the deleted thing off the board
    // at the deck's next render (ADR 015).
    remove(acts);
    setAsking(false);
    setOpen(null);
  }

  /**
   * Sets the answers of the board as it is now by `acts` and closes the
   * question; sets none while no dimension is chosen or no card lies in a
   * zone.
   */
  function save(acts: BoardActs) {
    setSaveQuestion(null);
    const answers = answersOnBoard(board);
    if (chosen !== undefined && answers.length > 0)
      acts.saveAnswers(chosen.id, answers);
  }

  function pressSave(acts: BoardActs) {
    if (chosen === undefined || answersOnBoard(board).length === 0) return;
    const changed = answersChanged(board, deck);
    if (changed === 0) save(acts);
    else setSaveQuestion(saveAnswersQuestion(changed, chosen.name));
  }

  const openCard = (card: string, from: HTMLElement) =>
    openPanel("card", card, from);

  /** Makes a dimension of `name` by `acts` and chooses it; returns the words the field shows. */
  function makeDimension(acts: BoardActs, name: string): string | null {
    const result = acts.addDimension(name);
    if (result.ok) {
      const made = result.deck.dimensions.at(-1)!;
      // The deck the act returned reaches the board only at its next render,
      // so the choice carries it and clears the board in this same press.
      dispatch(
        { type: "chooseDimension", dimension: made.id, random },
        result.deck,
      );
    }
    return wordsOf(result, deck.name);
  }

  function dragEnd(event: DragEndEvent) {
    const place = (event.over?.data.current as { place: Place } | undefined)
      ?.place;
    if (place !== undefined) {
      dispatch({ type: "place", card: String(event.active.id), place });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements: silence,
        screenReaderInstructions: { draggable: "" },
      }}
      onDragEnd={dragEnd}
    >
      <div className="board">
        <div className="board-bar">
          {back}
          <DimensionPicker
            dimensions={deck.dimensions}
            chosen={board.dimension}
            onChoose={(dimension) =>
              dispatch({ type: "chooseDimension", dimension, random })
            }
            onOpen={
              acts &&
              ((dimension, from) => openPanel("dimension", dimension, from))
            }
          >
            {acts && (
              <NewField
                label="New dimension"
                onEnter={(name) => makeDimension(acts, name)}
              />
            )}
          </DimensionPicker>
          <button
            type="button"
            className="board-reset"
            onClick={() => dispatch({ type: "reset", random })}
          >
            Reset
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={board.checking}
            className="board-action board-switch"
            onClick={() => dispatch({ type: "toggleCheck" })}
          >
            <span className="board-switch-track" aria-hidden="true" />
            Check
          </button>
          {canRetry && (
            <button
              type="button"
              className="board-action"
              onClick={() => dispatch({ type: "retry", random })}
            >
              Retry
            </button>
          )}
          {/* Always present, so assistive technology reads the score as it
              appears. */}
          <div aria-live="polite">
            {verdict && (
              <p className="board-score">
                {verdict.correct} of {verdict.judged} correct
              </p>
            )}
          </div>
          {acts && (
            <button
              type="button"
              className="board-action board-save"
              onClick={() => pressSave(acts)}
            >
              Save answers
            </button>
          )}
          {account}
        </div>
        {notices}
        <Pool
          cards={cardsIn({ kind: "pool" })}
          marks={marks}
          disabled={disabled}
          onOpen={openCard}
        >
          {acts && (
            <NewField
              label="New card"
              className="board-new-card"
              onEnter={(name) => wordsOf(acts.addCard(name), deck.name)}
            />
          )}
        </Pool>
        <div className="board-zones">
          {chosen === undefined ? (
            <p className="board-prompt">
              {deck.dimensions.length === 0
                ? "Add cards and a dimension to begin"
                : "Choose how to sort to begin"}
            </p>
          ) : (
            <>
              {categories.map((category) => (
                <Zone
                  key={category.id}
                  category={category}
                  cards={cardsIn({ kind: "zone", category: category.id })}
                  marks={marks}
                  disabled={disabled}
                  onOpen={openCard}
                  onOpenCategory={
                    acts &&
                    ((category, from) => openPanel("category", category, from))
                  }
                />
              ))}
              {acts && (
                <div className="board-new-category">
                  {/* Keyed by the dimension, so a refusal naming one
                      dimension never stays once another is chosen. */}
                  <NewField
                    key={chosen.id}
                    label="New category"
                    onEnter={(name) =>
                      wordsOf(acts.addCategory(chosen.id, name), chosen.name)
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {panel && (
        <Panel heading={panel.heading} onClose={closePanel}>
          {acts && (
            <div className="panel-row">
              <button
                type="button"
                className="panel-delete"
                aria-label="Delete"
                onClick={() => setAsking(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          )}
        </Panel>
      )}
      {acts && panel && asking && (
        <Question
          question={panel.question}
          confirm="Delete"
          onConfirm={() => confirmDelete(acts, panel.remove)}
          onCancel={() => setAsking(false)}
        />
      )}
      {acts && saveQuestion !== null && (
        <Question
          question={saveQuestion}
          confirm="Save answers"
          onConfirm={() => save(acts)}
          onCancel={() => setSaveQuestion(null)}
        />
      )}
    </DndContext>
  );
}

/**
 * The words a field shows under it for `result`: those of a name refused,
 * where `held` names what holds the name, or null for any other result.
 */
function wordsOf(result: ActResult, held: string): string | null {
  if (result.ok) return null;
  const { refusal } = result;
  return refusal.refused === "gone" ? null : refusalWords(refusal, held);
}
