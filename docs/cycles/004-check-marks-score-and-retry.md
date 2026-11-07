# Cycle 004: Check, marks, score and Retry

Waits for: 003, everything src/board/board.ts exports, the components `Board`, `Pool`, `Zone` and `Card` in src/board/ with their props, their stylesheets and src/index.css, and the tests in src/board/board.test.ts and src/board/Board.test.tsx.

## Goal

Outcome: The learner checks a full board once and reads on each card, where it lies, a correct or incorrect mark by a colour and an icon, reads the score as the count of correct cards over all cards, retries with only the incorrect cards returned to the pool in random order, and sees a correct card lose its mark the moment they take hold of it.

Scope: The cycle covers the marks in the board's state, the actions for Check and Retry, the removal of a mark when a card is selected or its drag starts, the Check button with its hint while disabled, the Retry button, the score, the marks on the cards, their colours and icons, the reducer's and the component tests of these, and the vocabulary's Where and Code cells for the verdict's concepts. It leaves out the validator at start and the error shown in place of the board.

Judgement: The engineer runs `npm test` and sees the reducer's and the component tests pass. On the dev server in the current Chrome, Firefox and Safari, and in a portrait phone emulation, the engineer chooses Habitat, sees Check disabled with `Place every card to check` beside it, places every card and sees Check enable and the hint go; presses Check and reads on every card a colour and an icon with no category named on an incorrect card, and beside the buttons the score as the count of correct cards of 30; presses Retry and sees only the incorrect cards back in the pool in a new order, the correct cards in place with their marks, the score gone and Check disabled again; starts a drag of a correct card and sees its mark go as the drag starts, presses Escape to cancel and sees the card unmarked where it lies; places every card and presses Check again. The engineer also drags a card by mouse and by touch in each served browser, as ADR 006 asks at each cycle's review.

## Records

- PDR 003: One Check of the whole board, with marks, a score and Retry
- ADR 003: One pure reducer holding the board, fed random numbers by its actions
- ADR 006: Vitest in three kinds, unit, component in jsdom and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Marks, Check and Retry in the reducer

**Status**

- [ ]

**Goal**

The board's state holds a mark per card, Check sets every mark from where each card lies, Retry returns only the incorrect cards to the pool permuted among their positions, selecting a card or starting its drag removes its mark, and a score is derived from the marks, each proven by a unit test.

**Dependencies**

None.

**Files**

- src/board/board.ts
- src/board/board.test.ts
- docs/vocabulary.md

**Details**

- src/board/board.ts must add exactly this type, this field, these actions and this function, and keep everything it exports today (ADR 003):

  ```ts
  export type Mark = 'correct' | 'incorrect';

  export type BoardState = {
    dimension: string | null;
    places: Record<string, Place>;
    order: string[];
    marks: Record<string, Mark>;
    selected: string | null;
  };

  export type BoardAction =
    | { type: 'load'; random: RandomSource }
    | { type: 'chooseDimension'; dimension: string; random: RandomSource }
    | { type: 'select'; item: string }
    | { type: 'dragStart'; item: string }
    | { type: 'place'; item: string; place: Place }
    | { type: 'check' }
    | { type: 'retry'; random: RandomSource }
    | { type: 'reset'; random: RandomSource };

  /** The score, or null unless every card bears a mark. */
  export function score(state: BoardState): { correct: number; total: number } | null;
  ```

  `marks` holds an entry for a card only while it bears a mark; a card with no entry is unmarked. `emptyBoard.marks` is empty.
- The actions must change as follows, and otherwise stay as they are; the reducer stays pure and returns `state` itself whenever nothing changes (ADR 003):
  - `load`, `reset`, and `chooseDimension` when it changes the dimension: `marks` becomes empty (PDR 004).
  - `select`, whenever it changes the selection: the entry of `item` in `marks` is also removed. `dragStart`: the entry of `item` in `marks` is removed and `selected` becomes null; when the card bears no mark and nothing is selected, return `state` (PDR 003: a card loses its correct mark the moment the learner takes hold of it).
  - `place`: leaves `marks` as they are.
  - `check`: when `dimension` is null, or any card is in the pool, return `state`. Otherwise every card gets the mark `correct` when the `category` of its zone equals the item's answer for the chosen dimension in the set, and `incorrect` otherwise, and `selected` becomes null (PDR 003).
  - `retry`: when no card bears the mark `incorrect`, return `state`. Otherwise every card marked `incorrect` goes to the pool and loses its mark, every card marked `correct` keeps its place and its mark, and `order` changes only at the positions the returned cards held: with `positions` the indices of `order` holding a returned card, ascending, and `permuted` the `shuffle` of the returned cards in `order` order with the action's `random`, `order[positions[k]]` becomes `permuted[k]`; `selected` becomes null (PDR 003, ADR 003).
- `score` must return null unless every card in `places` has an entry in `marks`, and otherwise the count of entries equal to `correct` as `correct` and the count of cards as `total`.
- src/board/board.test.ts must add at least these tests, each asserting the exact state with `toEqual` or the identity with `toBe`:
  - `check` while a card is in the pool returns the same state object.
  - `check` marks each card correct or incorrect by where it lies and clears the selection.
  - `retry` returns only the incorrect cards to the pool, removes their marks, keeps the correct cards and their marks, permutes the returned cards among exactly the positions they held, with a fixed sequence, and leaves every other position as it was.
  - `retry` while no card is marked incorrect returns the same state object.
  - `select` on a marked card removes its mark.
  - `dragStart` on a marked card removes its mark.
  - `reset` and `chooseDimension` with another dimension remove every mark.
  - `score` is null before Check, counts the correct cards over all cards after Check, and is null again once one mark is removed.
  Every test of cycle 003 must keep passing, with `marks: {}` added to its expected states.
- In docs/vocabulary.md the Code cells must change so that: the Check row's reads `` the `check` action of `BoardAction` in src/board/board.ts ``; the Correct mark row's reads `` `Mark` `'correct'` in src/board/board.ts ``; the Incorrect mark row's reads `` `Mark` `'incorrect'` in src/board/board.ts ``; the Score row's reads `` `score` in src/board/board.ts ``; the Retry row's reads `` the `retry` action of `BoardAction` in src/board/board.ts ``. Where cells stay as they are.

**Out of scope**

- The buttons, the hint, the icons and the colours: T2.
- A `score` field, a `checked` flag or any other field in `BoardState`: never; ADR 003 names the state and the score is derived.
- Removing a mark on `place` instead of on `select` and `dragStart`: never; PDR 003 and ADR 003 decided against it.
- Naming the right category on an incorrect card anywhere in the state: never; PDR 003 decided against it.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/board/board.test.ts with at least 21 tests passed, and src/board/Board.test.tsx with the same tests as at the end of cycle 003.

**Debrief**

None.

### T2 — Check, marks, score and Retry on the board

**Status**

- [ ]

**Goal**

The learner presses Check once the pool is empty and reads a mark on every card and the score, presses Retry to get only the incorrect cards back, and reads the hint while Check is disabled, each proven by a component test in jsdom.

**Dependencies**

- T1: `Mark`, `marks` of `BoardState`, the `check` and `retry` actions and `score` in src/board/board.ts.

**Files**

- src/board/Board.tsx
- src/board/Pool.tsx
- src/board/Zone.tsx
- src/board/Card.tsx
- src/board/Board.css
- src/board/Card.css
- src/index.css
- src/board/Board.test.tsx
- docs/vocabulary.md

**Details**

- The props must change exactly so: `PoolProps` and so `ZoneProps` gain `marks: Record<string, Mark>`, and `CardProps` gains `mark: Mark | null`. Nothing else in the props changes.
- The screen must show only words docs/vocabulary.md gives, in addition to those cycle 003 shows: `Check`, `Place every card to check`, `Retry`, `Correct`, `Incorrect` and the score as the number of correct cards, ` of `, the number of all cards and ` correct`, as in `27 of 30 correct`. Never any other text.
- The document must gain this structure (PDR 003):
  - Beside Reset stands a `button` of `type="button"` reading `Check`, which has the `disabled` attribute while any card is in the pool or no dimension is chosen, and dispatches `check` when pressed. While it is disabled, a `span` reading `Place every card to check` stands beside it; otherwise the span is absent.
  - Beside Check stands a `button` of `type="button"` reading `Retry`, which has the `disabled` attribute unless some card bears the mark `incorrect`, and dispatches `retry` with the board's `random` when pressed.
  - Beside the buttons, while `score(state)` is not null, stands a `p` reading the score as `N of M correct`, with `N` the correct count and `M` the total; otherwise the `p` is absent. Guidance: `aria-live="polite"` on a wrapper that is always present lets assistive technology read the score when it appears.
  - A card with a mark has the attribute `data-mark` set to `correct` or `incorrect`, and holds, after its name and before any `Selected` span, a `span` with `aria-hidden="true"` holding the icon, and a `span` of class `visually-hidden` reading `Correct` or `Incorrect`. A card with no mark has no `data-mark` attribute and neither span. Guidance: the icon is the glyph ✓ for correct and ✕ for incorrect.
  - An incorrect card shows nothing beyond its name, the icon and the hidden word; never the category it belongs to (PDR 003).
- Colours must be custom properties `--color-correct` and `--color-incorrect` declared in src/index.css and applied in src/board/Card.css by `data-mark`, as the card's background or border, so that the mark reads by colour and by icon together (PDR 003, LCD1). The hint, the score and the two buttons take their place in src/board/Board.css within the layout of cycle 003, and the desktop fit of cycle 003 must hold with them.
- src/board/Board.test.tsx must add at least these tests, named as here, acting through `@testing-library/user-event` with a helper that places every card by click into the zone of its answer or into a chosen wrong zone:
  - `disables Check and shows the hint while the pool is not empty`
  - `enables Check and removes the hint once the pool is empty`
  - `Check marks every card where it lies and shows the score`
  - `an incorrect card shows its name, the icon and Incorrect, and no category`
  - `Retry is disabled while no card is marked incorrect`
  - `Retry returns only the incorrect cards to the pool, removes their marks and the score, and keeps the correct marks`
  - `selecting a correct card removes its mark and the score`
  - `Reset removes every mark and the score`
  - `choosing another dimension removes every mark and the score`
  Guidance: `screen.getByRole('button', { name: 'Penguin Incorrect' })` finds a marked card by its full accessible name, where Penguin stands for whatever item the test picked.
- In docs/vocabulary.md the rows must change so that:
  - Check: Where reads `A button beside Reset`; Code gains `; the Check button in `Board` in src/board/Board.tsx`.
  - Hint: Where reads `Beside Check while it is disabled`; Code reads `` the hint in `Board` in src/board/Board.tsx ``.
  - Correct mark: Where reads `On a correct card after Check, as a colour, an icon and hidden text`; Code gains `; the mark in `Card` in src/board/Card.tsx`.
  - Incorrect mark: Where reads `On an incorrect card after Check, as a colour, an icon and hidden text`; Code gains `; the mark in `Card` in src/board/Card.tsx`.
  - Score: Where reads `Beside the buttons after Check`; Code gains `; the score in `Board` in src/board/Board.tsx`.
  - Retry: Where reads `A button beside Check`; Code gains `; the Retry button in `Board` in src/board/Board.tsx`.

**Out of scope**

- A results list apart from the board, or a percentage: never; PDR 003 decided against both.
- Hiding Check after a check: never; a card moved after its verdict is judged again at the next Check under PDR 003.
- Keeping the score while a card is taken hold of after Check: never; the score is derived from the marks under ADR 003, and a disturbed board bears no whole verdict.
- An automated test of a drag, including the mark's removal at drag start: never; ADR 006 checks the drag path by hand.
- Running the validator when the app starts and the error shown in place of the board: a later cycle, held by an open question.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/board/Board.test.tsx with at least 21 tests passed.
- `grep -nE '#[0-9a-fA-F]{3,8}|\b[0-9]+(px|rem|em|vh|vw|%)' src/board/*.css | grep -v '@media'` prints nothing.
- `npm run dev`, opened in Chrome at 1366 by 768 with Habitat chosen and every card in the pool: `document.documentElement.scrollHeight <= window.innerHeight` evaluates to `true` in the console.
- `npm run dev`, opened in Chrome with Habitat chosen: Check is disabled with `Place every card to check` beside it; with every card placed, Check is enabled and the hint is gone; after Check every card bears a colour and an icon and the score reads the correct count ` of 30 correct`; after Retry only the incorrect cards are in the pool, the score is gone and Check is disabled; a drag started on a correct card removes its mark at the start of the drag, and Escape during the drag leaves the card unmarked where it lies.

**Debrief**

None.
