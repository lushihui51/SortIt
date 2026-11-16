# 006 — Board, Check and card panel

Waits for: 005, `Deck`, `Dimension`, `Category` and `Card` in convex/model/deck.ts, `appDeck` in src/deck/appDeck.ts, src/board/board.ts keyed by ids with `createBoardReducer`, `BoardState`, `BoardAction`, `Place`, `Mark`, `RandomSource`, `emptyBoard`, `score` and `shuffle`, `fixedRandom` in src/board/board.test.ts, `Board`, `Card`, `Pool`, `Zone` and `DimensionPicker` reading a `Deck` by ids, and every test of src/board/Board.test.tsx, the test `shows each dimension, zone and card by its name for a deck whose ids differ from its names` among them

Canvas: https://claude.ai/artifact/PChhAdr9yUaTfxer8GGb3e

## Goal

Outcome: The learner moves a card only by dragging it, opens any card by its ⓘ in a panel, turns Check on and off at any time to read live marks, the score of the cards judged and Retry, and the board of each deck is held by the deck's id above the screen that shows it.

Scope: The cycle covers the board's state as one pure reducer of boards by deck id with its fitting function, the provider and the hook that hold and hand out the boards, the board as a view of a deck, its board and a dispatch, dragging as the one way a card moves, Check as a switch with marks and a score computed where they are read, Retry, the ⓘ on each card and the panel it opens with a heading and Close. It leaves out the router, sign-in, a learner's own decks, every field and act that changes a deck, and the ⓘ of a dimension, a zone or a deck.

Judgement: The engineer opens the app at `npm run dev` in the desktop versions of Chrome, Safari and Firefox, and at the size of a phone held in portrait in a browser's device emulation with touch. No card moves before a dimension is chosen. Once one is chosen, a card moves by drag from the pool to a zone, between zones and back, and a press without movement moves and selects nothing. The ⓘ of a card opens a panel headed by the card's name, before and after a dimension is chosen, and never starts a drag. Check is a switch with no hint beside it, never disabled; while it is on each card in a zone, every card of the app's own deck having an answer under each dimension, shows correct or incorrect the moment it lands, no card in the pool shows either, the score reads the correct cards over the cards judged, and Retry shows only while a card in a zone is incorrect and returns only those cards. Reset and a change of dimension leave Check as it was. The app shows one deck, so the engineer reads in T2's Debrief the tests of `useDeckBoard` that prove a board kept while its screen unmounts and mounts again and one board for each deck id.

## Records

- PDR 001: Current desktop browsers and portrait phones as the served devices
- PDR 004: Reset and a change of dimension clearing the board at once
- PDR 007: Check as a switch for live marks, with a score of the cards judged and Retry
- PDR 008: One board with cards dragged at any time, each opening in a panel
- PDR 013: Accounts keeping a learner's decks on every device, with the app's own deck open to all
- ADR 014: @dnd-kit/core for dragging alone, with each card a draggable holding one button
- ADR 015: One map of boards by deck id above the routes, each fitted to its deck by a pure reducer
- ADR 016: The board as a view of a deck, its board and its acts, with Convex and Clerk kept out of it
- ADR 018: Vitest in four kinds, unit, component in jsdom, Convex functions under convex-test and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Boards' state by deck id

**Status**

- [ ]

**Goal**

One pure reducer holds a board for each deck id and fits it to the deck its action carries, and one function each gives a card's mark and the score from a board and its deck, each rule proven by a unit test.

**Dependencies**

None.

**Files**

- src/board/board.ts
- src/board/board.test.ts
- src/board/legacyBoard.ts, new
- src/board/Board.tsx
- src/board/Card.tsx
- src/board/Pool.tsx

**Details**

- src/board/legacyBoard.ts must hold the content src/board/board.ts has before this task, unchanged, and `Board`, `Card` and `Pool` must import from it what they import from ./board today, so that the screen works as before until T2 removes the file. Nothing else in src/board/Board.tsx, src/board/Card.tsx and src/board/Pool.tsx changes.
- src/board/board.test.ts must be rewritten over the new reducer. src/board/legacyBoard.ts carries no unit test; src/board/Board.test.tsx, unchanged, keeps proving it.
- src/board/board.ts must export exactly this (ADR 015), keeping `shuffle` as it is today:

```ts
import type { Deck } from "../../convex/model/deck";

/** Returns a number in [0, 1), as Math.random does. */
export type RandomSource = () => number;

export type Place = { kind: "pool" } | { kind: "zone"; category: string };

export type Mark = "correct" | "incorrect" | "noAnswer";

export type BoardState = {
  /** The chosen dimension's id; null while none is chosen. */
  dimension: string | null;
  /** Where each card lies, keyed by card id; `category` of a zone is a category id. */
  places: Record<string, Place>;
  /** Every card id exactly once; the pool and every zone show their cards in this order. */
  order: string[];
  /** Whether Check is on. */
  checking: boolean;
};

/** Every board, keyed by deck id. */
export type BoardsState = Record<string, BoardState>;

export type BoardAction =
  | { type: "load"; deck: Deck; random: RandomSource }
  | {
      type: "chooseDimension";
      deck: Deck;
      dimension: string;
      random: RandomSource;
    }
  | { type: "place"; deck: Deck; card: string; place: Place }
  | { type: "toggleCheck"; deckId: string }
  | { type: "retry"; deck: Deck; random: RandomSource }
  | { type: "reset"; deck: Deck; random: RandomSource };

export const noBoards: BoardsState = {};

export function boardsReducer(
  state: BoardsState,
  action: BoardAction,
): BoardsState;

export function fitBoard(board: BoardState, deck: Deck): BoardState;

export function markOf(
  board: BoardState,
  deck: Deck,
  card: string,
): Mark | null;

export function score(
  board: BoardState,
  deck: Deck,
): { correct: number; judged: number } | null;

export function shuffle<T>(list: readonly T[], random: RandomSource): T[];
```

- `boardsReducer` must apply an action to the board under `action.deck.id`, or under `action.deckId`, and leave every other board the same object.
- `load` on a deck with no board must give it a board with no dimension chosen, every card of the deck in the pool, `order` the `shuffle` of the deck's card ids taken in the deck's order, and `checking` false. `load` on a deck that has a board must return the state it was given.
- Every action but `load` on a deck with no board must return the state it was given.
- `chooseDimension`, `place`, `retry` and `reset` must first fit the board to `action.deck` with `fitBoard`, and every rule below reads the fitted board: its chosen dimension, its places and its order. What the reducer stores is the fitted board, changed by the action where the action applies (ADR 015).
- `fitBoard` must apply these four rules and keep `checking` and the order of the cards that stay (ADR 015): a card the deck no longer holds leaves `places` and `order`; a card of the deck the board does not hold joins the end of `order`, in the deck's order, in the pool; a card in a zone whose category the chosen dimension no longer holds returns to the pool; and a chosen dimension the deck no longer holds leaves `dimension` null with every card in the pool. A board that already fits must come back as the same object.
- `chooseDimension` with the id of the chosen dimension, or with an id the deck holds no dimension of, must change nothing. Otherwise it must set `dimension`, return every card to the pool, set `order` to the `shuffle` of `order`, and leave `checking` as it was (PDR 007).
- `place` must apply only while a dimension is chosen, to a card the fitted board holds, into the pool or into the zone of a category of the chosen dimension.
- `toggleCheck` must turn `checking` from false to true or from true to false and change nothing else.
- `reset` must return every card to the pool, set `order` to the `shuffle` of `order`, and leave `dimension` and `checking` as they were (PDR 007).
- `retry` must apply only while `checking` is true and `markOf` gives `"incorrect"` for at least one card. It must return every such card to the pool and write the `shuffle` of those cards, taken in the order `order` holds them, into the positions of `order` they held, leaving every other card where it lies and at its position (ADR 015).
- The reducer must return the state it was given, the same object, exactly when the board it would store equals the stored board: the same `dimension` and `checking`, the same `order` and the same place for every card. An action that cannot apply therefore still stores the fitted board when fitting changed the stored board, and returns the state it was given when it did not.
- `boardsReducer` must draw every random number from `action.random`, and no function of the file changes the state, the action, the board or the deck it is given.
- `markOf` and `score` take a board that fits the deck.
- The names this interface gives are this task's to write. T2 gives docs/vocabulary.md the rows its Details list, and a name with no row there gets none. Until T2, the rows that name the old `selected`, `check`, marks and `score` of src/board/board.ts stay as they stand, though that code now lives in src/board/legacyBoard.ts; T2 rewrites or removes each.
- `markOf` must give null when no dimension is chosen or the board does not hold the card. It must give `"noAnswer"` when the card's `answers` holds no entry for the chosen dimension, wherever the card lies and whether `checking` is true or false. For a card with an answer it must give null unless `checking` is true and the card lies in a zone, and then `"correct"` when the zone's category is the card's answer and `"incorrect"` when it is not (PDR 007).
- `score` must give null unless `checking` is true and at least one card lies in a zone. Otherwise `judged` is the count of cards that lie in a zone and have an answer under the chosen dimension, and `correct` the count of those whose mark is `"correct"`; both are 0 when every card in a zone lacks an answer (PDR 007).
- Guidance: the fixed random source `fixedRandom` of today's src/board/board.test.ts gives every shuffle an exact order to assert.

**Out of scope**

- Any change to what the screen shows or does: T2.
- The provider and the hook that hold the boards: T2.
- docs/vocabulary.md: T2.
- A selected card, a stored mark or a `dragStart` action in the new state: never.

**Done when**

- These tests in src/board/board.test.ts pass:
  - `shuffle gives the Fisher-Yates order for a fixed sequence and leaves the list unchanged`
  - `load gives a deck with no board a board with every card in the pool in the shuffled order, no dimension and Check off`
  - `load on a deck that has a board returns the same state`
  - `every action but load on a deck with no board returns the same state`
  - `an action on one deck leaves every other deck's board the same object`
  - `chooseDimension sets the dimension, returns every card to the pool, reshuffles and leaves Check as it was`
  - `chooseDimension with the chosen dimension or an id the deck lacks returns the same state`
  - `place moves a card into a zone of the chosen dimension, to another zone and back to the pool`
  - `place before a dimension is chosen, of a card the deck lacks, or into a category the dimension lacks returns the same state`
  - `place where the card already lies returns the same state`
  - `toggleCheck turns Check on and off and changes nothing else`
  - `reset returns every card to the pool, reshuffles, and keeps the dimension and Check`
  - `retry returns only the incorrect cards to the pool and permutes them among the positions they held`
  - `retry while Check is off or no card is incorrect returns the same state`
  - `fitBoard removes a card the deck no longer holds`
  - `fitBoard adds a card the board does not hold to the end of the order, in the pool`
  - `fitBoard returns a card to the pool when the chosen dimension no longer holds its zone's category`
  - `fitBoard leaves no dimension chosen and every card in the pool when the deck no longer holds the chosen dimension`
  - `fitBoard returns the same board when it already fits`
  - `an action that reads the deck applies to the board fitted to the deck it carries`
  - `an action that cannot apply still stores the board fitted to the deck it carries`
  - `markOf gives correct or incorrect to a card in a zone while Check is on, and null in the pool or while Check is off`
  - `markOf gives noAnswer to a card with no answer under the chosen dimension, in the pool and in a zone, with Check on and off`
  - `markOf gives null before a dimension is chosen`
  - `score counts the correct cards over the cards judged, leaving out cards in the pool and cards with no answer`
  - `score is null while Check is off and while no card lies in a zone`
  - `no function changes the state, the action, the board or the deck it is given`
- Every test in src/board/Board.test.tsx passes, the file unchanged.

**Debrief**

None.

### T2 — Board as a view, with the Check switch

**Status**

- [ ]

**Goal**

The board renders from a deck, its fitted board and a dispatch, all held by deck id above the screen, a card moves by drag alone, and Check is a switch under which each card shows its mark, the score counts the cards judged and Retry shows only while a card in a zone is incorrect.

**Dependencies**

- T1: `BoardState`, `BoardsState`, `BoardAction`, `Place`, `Mark`, `RandomSource`, `noBoards`, `boardsReducer`, `fitBoard`, `markOf`, `score` and `shuffle` in src/board/board.ts; src/board/legacyBoard.ts, which this task removes.

**Files**

- src/board/BoardsProvider.tsx, new
- src/board/BoardsProvider.test.tsx, new
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/board/Card.tsx
- src/board/Card.css
- src/board/Pool.tsx
- src/board/Pool.css
- src/board/Zone.tsx
- src/board/Zone.css
- src/board/legacyBoard.ts, removed
- src/screens/AppDeckScreen.tsx, new
- src/App.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create these interfaces (ADR 015, ADR 016):

```tsx
// src/board/BoardsProvider.tsx
/** An act on one deck's board, without the deck it applies to. */
export type DeckBoardAction =
  | { type: "chooseDimension"; dimension: string; random: RandomSource }
  | { type: "place"; card: string; place: Place }
  | { type: "toggleCheck" }
  | { type: "retry"; random: RandomSource }
  | { type: "reset"; random: RandomSource };

/** Holds every board in one `useReducer` over `boardsReducer`, starting from `noBoards`, in memory alone. */
export function BoardsProvider(props: { children: ReactNode }): ReactElement;

/**
 * The board of `deck` and a dispatch bound to it. `board` is null only on the
 * render before the deck's `load`; `random` draws the shuffle of that `load`.
 */
export function useDeckBoard(
  deck: Deck,
  random?: RandomSource,
): {
  board: BoardState | null;
  dispatch: (action: DeckBoardAction) => void;
};

// src/board/Board.tsx
export type BoardProps = {
  deck: Deck;
  /** The deck's board, fitted to `deck`. */
  board: BoardState;
  dispatch: (action: DeckBoardAction) => void;
  /** Draws the shuffle of Reset, of Retry and of a change of dimension. */
  random?: RandomSource;
};

// src/screens/AppDeckScreen.tsx
/** The screen of the app's own deck. */
export default function AppDeckScreen(): ReactElement | null;
```

- `useDeckBoard` must give the deck its board by a `load` action carrying the deck, dispatched in a layout effect while the deck has no board, and must return the stored board passed through `fitBoard` with `deck` at every render (ADR 015). `random` defaults to `Math.random`, here and in `Board`.
- The dispatch `useDeckBoard` returns must send each `DeckBoardAction` to `boardsReducer` as the `BoardAction` of the same type, carrying the deck the hook was last given, or its id for `toggleCheck`.
- `App` must render `AppDeckScreen` inside `BoardsProvider`. `AppDeckScreen` must call `useDeckBoard(appDeck)`, render nothing while `board` is null, and otherwise render `Board` with `appDeck`, the board and the dispatch.
- `Board` must hold no reducer and no board of its own, read each card's mark through `markOf` and the score through `score`, and import nothing from src/board/BoardsProvider.tsx but the type `DeckBoardAction` (ADR 016).
- A card must move only by a drag, whose end dispatches `place`. The task must remove selecting a card, sending it by a label, the Escape key's handling and the hidden word "Selected" (PDR 008, ADR 014). Every style rule and custom property that no element uses once this task is done must go with them: those of the selection, of the hint, and of Check and Retry while disabled.
- The label of the pool and of each zone must be plain text, not a button, and must still name its region for assistive technology (ADR 014). Every style rule that only made a label a button must go: its pointer cursor, its stretched hit area, its focus outline and its smallest height on a phone. Every declaration that only served them must go with them: the position that anchored a label's hit area in the pool and in a zone, the button resets of a label, and the card's lift above its region's label, its `z-index: 1`. The card keeps `position: relative`. A comment in the task's Files that no longer holds must go or be rewritten.
- A card keeps its `<button>` element in this task, with no click handler and no `disabled` attribute; T3 replaces the element.
- No card can be dragged before a dimension is chosen: until then the card's draggable is disabled and the card shows the default cursor in place of the grab cursor, by a class or an attribute of the card in place of today's `.card:disabled` rule (PDR 008).
- Check must be a `<button type="button" role="switch">` whose `aria-checked` follows `board.checking`, whose accessible name is "Check", which is never disabled and whose press dispatches `toggleCheck`. It must look as drawing 7 shows it off and drawing 1 shows it on: a track with a knob before the word "Check". No hint stands beside it (PDR 007).
- Retry must be rendered only while Check is on and at least one card in a zone is incorrect, and its press dispatches `retry` (PDR 007).
- The score must read `{correct} of {judged} correct`, in the live region that is always present, and only while `score` gives a value.
- A card with a mark must show it by a colour, an icon and a hidden word together: `✓` and "Correct", `✕` and "Incorrect", `?` and "No answer". The colour of the no-answer mark is `#f3e2a9`, a custom property in src/index.css beside the other two. An incorrect card never shows the category it belongs to (PDR 007).
- The bar must keep the order drawing 1 shows for the parts this task builds: the picker, Reset, Check, Retry, the score.
- Every test in src/board/Board.test.tsx must render `Board` with a board built by `boardsReducer`'s own actions, cards placed included, and a `vi.fn()` as its dispatch, and must assert what shows and what is dispatched. The tests in src/board/BoardsProvider.test.tsx render the real provider and hook. No test simulates a drag (ADR 018).
- src/board/Board.test.tsx must be rewritten to hold the tests of the Done when and no other. A test it holds today whose rule `boardsReducer` now keeps, as choosing the chosen dimension again or Reset keeping the dimension, is proven in src/board/board.test.ts and is removed here.
- The task adds no row to docs/vocabulary.md but those below: a name of this cycle that no word on a screen goes with, as `boardsReducer`, `fitBoard`, `BoardsProvider` or `useDeckBoard`, gets none.
- docs/vocabulary.md must lose the rows of the concepts "Selected card, picked by tap, click or keyboard and waiting for a zone" and "Hint while Check is disabled because the pool is not empty", and must hold these six rows, each character for character. Five replace the rows of Check, the correct mark, the incorrect mark, the score and Retry, and the no-answer row is added after the incorrect mark's:

```
| Board | Check, a switch that shows whether each card in a zone is correct while it is on | "Check" | A switch beside Reset | the `toggleCheck` action of `BoardAction` and `checking` of `BoardState` in src/board/board.ts; the Check switch in `Board` in src/board/Board.tsx |
| Verdict | Correct mark on a card, a colour and an icon | "Correct", spoken | On a correct card in a zone while Check is on, as a colour, an icon and hidden text | `Mark` `'correct'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | Incorrect mark on a card, a colour and an icon | "Incorrect", spoken | On an incorrect card in a zone while Check is on, as a colour, an icon and hidden text | `Mark` `'incorrect'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | No-answer mark on a card with no answer under the chosen dimension, a colour and an icon | "No answer", spoken | On a card with no answer under the chosen dimension, wherever it lies and whether Check is on or off, as a colour, an icon and hidden text | `Mark` `'noAnswer'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | Score, correct cards over the cards judged | "N of N correct" | Beside the buttons while Check is on and a card lies in a zone | `score` in src/board/board.ts; the score in `Board` in src/board/Board.tsx |
| Verdict | Retry, which returns only the incorrect cards to the pool | "Retry" | A button beside Check while Check is on and a card in a zone is incorrect | the `retry` action of `BoardAction` in src/board/board.ts; the Retry button in `Board` in src/board/Board.tsx |
```

- Guidance: a small deck written in src/board/Board.test.tsx, with one card that has no answer under one dimension, shows all three marks; `appDeck` has an answer for every card.
- Guidance: the track is 32px by 18px with a 14px knob, `#c9c2b4` with the knob at the left while off and `#1f2328` with the knob at the right while on, each size and colour a custom property in src/index.css.

**Out of scope**

- The ⓘ on each card that drawings 1 and 7 show, and the scrim and the panel that drawing 1 shows: T3.
- The card's own layout that drawings 1 and 7 show, its inline flex row, its gap and its padding: T3.
- How drawings 1 and 7 are built underneath where the screen looks the same at 1440×900, as a bar that cannot wrap, zones with no smallest height and the prompt outside the zones' grid: never; the code's own layout stands.
- The "Back to the list of decks" button, the ⓘ on each dimension and on each zone's label, the "New dimension", "New card" and "New category" fields and the "Save answers" button that drawing 1 shows: a later cycle.
- The account button that drawing 1 shows, and "Sign in" and the sign-in form that drawing 7 shows: a later cycle.
- A router, or `BoardsProvider` placed inside any other provider: a later cycle.
- A test that fires dnd-kit's drag events: never.

**Done when**

- These tests in src/board/BoardsProvider.test.tsx pass:
  - `useDeckBoard loads a deck's board in the shuffled order`
  - `useDeckBoard keeps a deck's board while its screen unmounts and mounts again`
  - `useDeckBoard keeps one board for each deck id`
  - `useDeckBoard returns the board fitted to the deck it is given`
  - `the dispatch of useDeckBoard applies an action to its own deck's board`
- These tests in src/board/Board.test.tsx pass:
  - `shows every card in the pool, the prompt and no zone before a dimension is chosen`
  - `shows one zone per category of the chosen dimension, the pool and each zone labelled in plain text`
  - `shows each dimension, zone and card by its name for a deck whose ids differ from its names`
  - `no card's button is disabled, before or after a dimension is chosen`
  - `pressing a dimension dispatches chooseDimension with its id`
  - `Reset dispatches reset`
  - `a press on a card dispatches nothing and no card reads Selected`
  - `Check is a switch that shows whether it is on, is never disabled and dispatches toggleCheck`
  - `no hint stands beside Check`
  - `while Check is on, each card in a zone shows Correct or Incorrect and no card in the pool shows either`
  - `while Check is off, no card shows Correct or Incorrect`
  - `an incorrect card shows its name, the icon and Incorrect, and no category`
  - `a card with no answer under the chosen dimension shows No answer in the pool and in a zone, with Check on and off`
  - `the score reads the correct cards over the cards judged while Check is on and a card lies in a zone`
  - `no score shows while Check is off or no card lies in a zone`
  - `Retry shows only while Check is on and a card in a zone is incorrect, and dispatches retry`
- `git ls-files src/board/legacyBoard.ts` prints nothing.
- `git grep --untracked -n -E "Selected|Place every card to check|legacyBoard" -- src ':!src/**/*.test.ts' ':!src/**/*.test.tsx'` prints nothing.
- `git grep --untracked -c "useLayoutEffect" -- src/board/BoardsProvider.tsx` prints a count above 0.
- Each of the six rows of the Details is a line of docs/vocabulary.md, and `grep -c -E "Selected card|Hint while Check" docs/vocabulary.md` prints `0`.

**Debrief**

None.

### T3 — Card's ⓘ and its panel

**Status**

- [ ]

**Goal**

Each card is a draggable that is not a button and holds an ⓘ as its one button, and pressing the ⓘ opens the card in a panel over the board, headed by the card's name and closed by Close, without starting a drag.

**Dependencies**

- T2: `Board` and `BoardProps` in src/board/Board.tsx; `Card`, `Pool` and `Zone` as T2 leaves them; the custom properties of src/index.css.

**Files**

- src/ui/Panel.tsx, new
- src/ui/Panel.css, new
- src/ui/Panel.test.tsx, new
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Card.tsx
- src/board/Card.css
- src/board/Pool.tsx
- src/board/Zone.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create this component, which imports nothing from src/board/:

```tsx
// src/ui/Panel.tsx
export type PanelProps = {
  /** The name of the thing the panel opens: its heading and the dialog's accessible name. */
  heading: string;
  onClose: () => void;
  /** What the panel holds under its heading. */
  children?: ReactNode;
};

export default function Panel(props: PanelProps): ReactElement;
```

- `Panel` must render a scrim over the whole page and, above it, an element with `role="dialog"`, `aria-modal="true"` and `heading` as its accessible name, holding `heading` in an `<h2>`, one `<button type="button">` whose accessible name is "Close" and whose press calls `onClose`, and then `children`. It must look as drawing 1 shows the panel in every part but the name field and Delete: the scrim; the box with its width, padding, gap, border, radius, background and shadow; the heading and Close at the two ends of one row; Close as an icon button showing a cross; and the box's place, centred across the screen with its top edge 330px below the screen's top. The scrim and the dialog must be fixed to the viewport and lie above everything else the page shows, a card being dragged included, by a z-index above the dragged card's in src/board/Card.css that is a custom property in src/index.css; a press on the scrim does nothing, and on a screen at most 720px wide Close is 44px wide and high.
- `Card` must render an element that is not interactive, a `<div>`, which carries the draggable's ref and listeners and holds the card's name in a `<span>` of its own, its mark and exactly one `<button type="button">`, the ⓘ (ADR 014).
- The ⓘ must have the one character `ⓘ` as its text, must stop a pointer press from reaching the card's listeners by stopping the `pointerdown` event's propagation, and must work before a dimension is chosen as well as after (ADR 014, PDR 008).
- The ⓘ's button must be the box drawings 1 and 7 show: 13px wide and 13px high, placed by `top: 3px` and `right: 3px` inside the card's border, with no border of its own, a radius of 50%, the white background drawing 7 shows, its character in the drawn colour `#4a4f57` and in the page's own font, and the focus outline every other control shows when the keyboard focuses it, and the card's padding must make room for it as the drawings show. Guidance: the font size of its character is set so that the glyph fills the box.
- On a screen at most 720px wide the card must keep the 44px smallest width and height it has today, and the ⓘ keeps its drawn size.
- `Board` must keep which card is open in a state of its own, open the card whose ⓘ is pressed, render `Panel` with that card's name as `heading` and no children while the deck holds the card, and close it when `onClose` is called.
- The card must lay out its name and its mark as drawings 1 and 7 show the card: an inline flex row, its content centred across the row's height, with the drawn 4px gap as a custom property.
- The card must not let its text be selected (`user-select: none`), and the ⓘ and Close show the pointer cursor. Close, like the ⓘ, shows the focus outline every other control shows when the keyboard focuses it.
- Each new size and colour of this task must be a custom property in src/index.css, as T2's are.
- The draggable's `attributes` stay off the card, as today's comment in `Card` says, so the ⓘ is the one focusable part of a card. The card's own focus rule in src/board/Card.css goes, since the card can no longer take the focus.
- The test of the pointer press must render the board inside an element that has a React `onPointerDown` handler, and assert that a `pointerdown` fired on the ⓘ does not call that handler while one fired on the card's name does.
- docs/vocabulary.md must hold these two rows, each character for character, added as the table's last rows. Each row says only what this task builds:

```
| Editing | ⓘ, which opens the panel of a card | "ⓘ" | The upper right corner of each card | the ⓘ button in `Card` in src/board/Card.tsx |
| Editing | Panel of a card | the name of what it opens as its heading, as "Orca"; "Close", spoken | A panel over the board | `Panel` in src/ui/Panel.tsx |
```

- The builder cannot drag a card in jsdom (ADR 018). The checks by hand of the cycle's Judgement are the engineer's, and the builder's evidence is the tests of the Done when.
- Guidance: the Escape key closes the panel, focus moves to Close when the panel opens and returns to the ⓘ that opened it when it closes.
- The tests T2 leaves in src/board/Board.test.tsx must keep their names and what they assert, their queries rewritten to find a card by the text of its name. The test `no card's button is disabled, before or after a dimension is chosen` is removed, its rule gone with the card's button.
- Guidance: on a screen narrower than the panel's drawn width, the panel takes the screen's width less `--board-padding` on each side.
- Guidance: focus stays inside the dialog while it is open.

**Out of scope**

- The name field and the Delete button that drawing 1 shows in the panel: the field is an unsettled decision, and Delete is a later cycle.
- The ⓘ that drawing 1 shows on each dimension and on each zone's label: a later cycle.
- The italic letter i in a bordered circle that drawings 1 and 7 draw for the ⓘ: never; the button's text is the character `ⓘ`, which draws its own circle.
- The "Back to the list of decks" button, the dashed fields, "Save answers" and the account button that drawing 1 shows, and "Sign in" and the sign-in form that drawing 7 shows: a later cycle.
- An accessible name for the ⓘ other than its text: an unsettled decision.
- A touch target for the ⓘ larger than its drawn size on a phone: an unsettled decision.
- The ⓘ with no background that drawing 1 shows: never; the ⓘ has the white background drawing 7 shows.
- The blue ring drawing 1 shows around the ⓘ of the open card: never; it marks in the drawing which ⓘ was pressed.
- The panel centred down the screen: never; its top edge is where drawing 1 shows it.
- Closing the panel by a press on the scrim: an unsettled decision.

**Done when**

- The test `Panel shows its heading, names its dialog by it, holds its children and calls onClose from Close` in src/ui/Panel.test.tsx passes.
- These tests in src/board/Board.test.tsx pass:
  - `a card is not a button and holds one button, its ⓘ`
  - `pressing a card's ⓘ opens a panel headed by the card's name, before and after a dimension is chosen`
  - `Close closes the card's panel`
  - `a pointer press on a card's ⓘ stops at the ⓘ, and one on the card's name does not`
- Every other test of T2's Done when but the one removed, and every test in src/board/board.test.ts, passes.
- Each of the two rows of the Details is a line of docs/vocabulary.md.
- `npm run build` exits with status 0.

**Debrief**

None.
