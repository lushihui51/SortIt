# Cycle 003: Board for placing

Waits for: 001, src/App.tsx, src/main.tsx, vite.config.ts and package.json, which this cycle changes. 002, `ItemSet`, `Dimension` and `Item` in src/set/itemSet.ts and `shippedSet` in src/set/shippedSet.ts.

## Goal

Outcome: The learner opens the page to every card in the pool in random order and the dimension picker, chooses a dimension to get one labelled zone per category, moves cards by drag, by tap or click and by keyboard, and clears the board by Reset or by choosing another dimension, on a desktop browser and a portrait phone.

Scope: The cycle covers the board's reducer with the actions for loading, choosing a dimension, selecting a card, starting a drag, placing a card and Reset; the components for the picker, the pool, the zones, the cards and Reset; selecting and sending over native buttons; dragging with @dnd-kit/core; the layout and the stylesheets; the jsdom test setup and the component tests of these acts; and the vocabulary's Where and Code cells for the board's concepts. It leaves out Check, the marks, the score and Retry, and it leaves out running the validator when the app starts and the error shown in place of the board.

Judgement: The engineer runs `npm test` and sees the reducer's tests and the component tests pass. On the dev server, in the current Chrome, Firefox and Safari at a desktop size of 1366 by 768 and in a portrait phone emulation 390 wide, the engineer sees on load the pool holding all 30 cards, the picker, the prompt and no zone, and a different order after a reload; chooses Habitat and sees six zones in the set's order; drags a card by mouse, and by touch in the emulation, from the pool to a zone, between zones and back to the pool; clicks a card and then a zone and sees it move; moves focus by Tab to a card, presses Enter, moves to a zone's label and presses Enter and sees it move; presses Reset and sees every card back in the pool in a new order with Habitat still chosen; chooses Diet and sees the board cleared with three zones; chooses Diet again and sees nothing change. At the desktop size with Habitat chosen and every card in the pool the page has no scrollbar; at the phone width the board is one column and the page scrolls.

## Records

- PDR 001: Current desktop browsers and portrait phones as the served devices
- PDR 002: One board with cards moved by drag, tap or keyboard
- PDR 004: Reset and a change of dimension clearing the board at once
- PDR 006: One set and nothing kept beyond the visit
- ADR 002: @dnd-kit/core for dragging, with selecting and sending as app state
- ADR 003: One pure reducer holding the board, fed random numbers by its actions
- ADR 006: Vitest in three kinds, unit, component in jsdom and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Board reducer

**Status**

- [x]

**Goal**

One pure reducer holds the chosen dimension, the place and order of every card and the selected card, and answers the actions for loading, choosing a dimension, selecting, starting a drag, placing and Reset, each proven by a unit test.

**Dependencies**

None.

**Files**

- src/board/board.ts (new)
- src/board/board.test.ts (new)
- docs/vocabulary.md

**Details**

- src/board/board.ts must export exactly these types, this constant and these functions (ADR 003):

  ```ts
  import type { ItemSet } from "../set/itemSet";

  /** Returns a number in [0, 1), as Math.random does. */
  export type RandomSource = () => number;

  export type Place = { kind: "pool" } | { kind: "zone"; category: string };

  export type BoardState = {
    dimension: string | null;
    places: Record<string, Place>;
    order: string[];
    selected: string | null;
  };

  export type BoardAction =
    | { type: "load"; random: RandomSource }
    | { type: "chooseDimension"; dimension: string; random: RandomSource }
    | { type: "select"; item: string }
    | { type: "dragStart"; item: string }
    | { type: "place"; item: string; place: Place }
    | { type: "reset"; random: RandomSource };

  export const emptyBoard: BoardState;

  export function shuffle<T>(list: readonly T[], random: RandomSource): T[];

  export function createBoardReducer(
    set: ItemSet,
  ): (state: BoardState, action: BoardAction) => BoardState;
  ```

  `places` is keyed by item name and holds every item of the set once the board is loaded; `order` holds every item name exactly once, and the pool and every zone show their cards in the order of `order`. `emptyBoard` has no dimension, no place, an empty order and no selection.

- `shuffle` must return a new array in the Fisher-Yates order: copy the list, then for `i` from the last index down to 1 draw `j = Math.floor(random() * (i + 1))` and swap the elements at `i` and `j`. It must call `random` exactly `length - 1` times and never change the list it is given.
- The reducer returned by `createBoardReducer` must be pure: it never calls `Math.random`, never mutates `state`, the action or the set, and returns `state` itself whenever an action changes nothing (ADR 003).
- The actions must do exactly this:
  - `load`: every item of the set is in the pool, `order` is `shuffle` of the item names in the set's order with the action's `random`, `dimension` is null and `selected` is null (LPD1: the pool shows its cards in random order when the app loads and each time the board is cleared).
  - `chooseDimension`: when `dimension` equals the current one, or names no dimension of the set, return `state`. Otherwise `dimension` is the new one, every item is in the pool, `order` is `shuffle` of the current `order` with the action's `random`, and `selected` is null (PDR 004, LPD1).
  - `select`: when `dimension` is null, or `item` is not in `places`, return `state`. When `item` is the selected card, `selected` becomes null. Otherwise `selected` becomes `item` (PDR 002).
  - `dragStart`: `selected` becomes null; when it already is, return `state`.
  - `place`: when `dimension` is null, or `item` is not in `places`, or `place` is a zone whose `category` is not one of the chosen dimension's categories, return `state`. Otherwise `places[item]` becomes `place` and `selected` becomes null (PDR 002).
  - `reset`: every item is in the pool, `order` is `shuffle` of the current `order` with the action's `random`, `selected` is null and `dimension` is kept (PDR 004, LPD1).
- src/board/board.test.ts must hold a fixed random source, a function that returns the numbers of a given array in turn, and at least these tests, each asserting the exact state with `toEqual` or the identity with `toBe`:
  - `shuffle` on five elements with a fixed sequence gives the exact order the Fisher-Yates steps produce for that sequence, and calls `random` four times.
  - `load` puts every item in the pool in the shuffled order with no dimension and no selection.
  - `chooseDimension` with the current dimension returns the same state object.
  - `chooseDimension` with a name the set lacks returns the same state object.
  - `chooseDimension` with another dimension sets it, returns every card to the pool, reshuffles the order and clears the selection.
  - `select` before a dimension is chosen returns the same state object.
  - `select` selects the card, `select` on the selected card clears the selection, `select` on another card moves the selection.
  - `dragStart` clears the selection.
  - `place` before a dimension is chosen returns the same state object.
  - `place` into a zone of the chosen dimension moves the card and clears the selection.
  - `place` into a zone of a category the dimension lacks returns the same state object.
  - `place` back into the pool moves the card.
  - `reset` returns every card to the pool, reshuffles the order, clears the selection and keeps the dimension.
- In docs/vocabulary.md, the Code cells must be extended so that: the Dimension row's reads `` `Dimension` in src/set/itemSet.ts; `dimension` of `BoardState` in src/board/board.ts ``; the Pool row's reads `` `Place` of kind `pool` in src/board/board.ts ``; the Zone row's reads ``one of `Dimension.categories` in src/set/itemSet.ts; `Place` of kind `zone` in src/board/board.ts``; the Selected card row's reads `` `selected` of `BoardState` in src/board/board.ts ``; the Reset row's reads ``the `reset` action of `BoardAction` in src/board/board.ts``. Where cells stay as they are.

**Out of scope**

- Marks, Check and Retry, and the removal of a mark on `select` and `dragStart`: cycle 004.
- A React hook or component: T2.
- Drawing a random number inside the reducer, or a seed in the state: never; ADR 003 feeds the reducer by its actions.
- Storing the set, or anything else, in `BoardState`: never; ADR 003 names the state.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/board/board.test.ts with at least 13 tests passed.

**Debrief**

- `npm run typecheck` printed `> tsc -b` and exited 0.
- `npm test` printed `Test Files  4 passed (4)` and `Tests  31 passed (31)`; `npx vitest run --reporter=verbose` lists 20 passing tests in src/board/board.test.ts, the 13 the Details name (the `select` case split into three tests) and seven more: `select` and `place` of an item the board lacks, `dragStart` with no selection, `place` where the card already lies, and one test that no action changes the state, the action or the set. src/recordCitationGuard.test.ts still passes, and `npm run build` succeeds.
- No departure from guidance. The tests use a set of four items of their own rather than `shippedSet`, so every expected state is written out in full; a random source of zeros makes every shuffle of four cards a rotation left by one, which tells a shuffle of the current `order` from one of the set's order.
- Read `createBoardReducer` in src/board/board.ts: every action's result passes through `sameBoard`, so any action whose result equals the state returns `state` itself, as the purity constraint requires. This covers cases the action list does not name, such as `place` into the place a card already holds with no selection, or a `reset` whose shuffle happens to give the same order. `select` and `place` test an item with `Object.hasOwn`, so a name such as `toString` is not taken as being on the board.

### T2 — Board components with select and send

**Status**

- [x]

**Goal**

The page shows the picker, the pool, the prompt and, once a dimension is chosen, its zones, and the learner selects a card and sends it by click and by keyboard, resets the board and changes the dimension, each proven by a component test in jsdom.

**Dependencies**

- T1: everything src/board/board.ts exports.

**Files**

- src/board/Board.tsx (new)
- src/board/DimensionPicker.tsx (new)
- src/board/Pool.tsx (new)
- src/board/Zone.tsx (new)
- src/board/Card.tsx (new)
- src/board/Board.test.tsx (new)
- src/test/setup.ts (new)
- src/index.css (new)
- src/App.tsx
- src/main.tsx
- vite.config.ts
- package.json
- package-lock.json
- docs/vocabulary.md

**Details**

- The development dependencies jsdom, @testing-library/react, @testing-library/dom, @testing-library/user-event and @testing-library/jest-dom must be added, and no other (ADR 006). In vite.config.ts the `test` key must set `environment: 'jsdom'` and `setupFiles: ['src/test/setup.ts']`; src/test/setup.ts must import `@testing-library/jest-dom/vitest` and nothing else.
- The components must export exactly these props and defaults:

  ```tsx
  // src/board/Board.tsx
  export type BoardProps = { set: ItemSet; random?: RandomSource };
  export default function Board({
    set,
    random = Math.random,
  }: BoardProps): ReactElement;

  // src/board/DimensionPicker.tsx
  export type DimensionPickerProps = {
    dimensions: readonly string[];
    chosen: string | null;
    onChoose: (dimension: string) => void;
  };

  // src/board/Pool.tsx
  export type PoolProps = {
    items: readonly string[];
    selected: string | null;
    disabled: boolean;
    onPressCard: (item: string) => void;
    onPressLabel: () => void;
  };

  // src/board/Zone.tsx
  export type ZoneProps = PoolProps & { category: string };

  // src/board/Card.tsx
  export type CardProps = {
    item: string;
    selected: boolean;
    disabled: boolean;
    onPress: (item: string) => void;
  };
  ```

- `Board` must hold the state with `useReducer` over `createBoardReducer(set)`, initialised by reducing `emptyBoard` with `{ type: 'load', random }`, and must pass `random` to every `chooseDimension` and `reset` action it dispatches (ADR 003). Guidance: memoise the reducer on `set`.
- src/App.tsx must render `<Board set={shippedSet} />` and nothing else; src/main.tsx must import src/index.css.
- The screen must show only words docs/vocabulary.md gives: `Sort by`, the dimension names, `Choose how to sort to begin`, `Unsorted`, the item names, the category names, `Selected` and `Reset`. Never any other text, attribute text read aloud included.
- The document must have this structure (PDR 002):
  - The picker is a `fieldset` whose `legend` reads `Sort by`, holding one `button` of `type="button"` per dimension in the set's order, its text the dimension's name, with `aria-pressed="true"` on the chosen one and `aria-pressed="false"` on the others. Pressing one calls `onChoose`.
  - Beside the picker stands a `button` of `type="button"` reading `Reset`, which dispatches `reset`.
  - The pool is a `section` labelled by its label, a `button` of `type="button"` reading `Unsorted`, followed by its cards.
  - Where the zones will be, before a dimension is chosen, stands a `p` reading `Choose how to sort to begin` and no zone. Once a dimension is chosen the prompt is gone and one zone stands per category of the chosen dimension, in the dimension's order, each a `section` labelled by its label, a `button` of `type="button"` reading the category's name, followed by its cards.
  - A card is a `button` of `type="button"` whose text is the item's name, followed, while the card is selected, by a `span` of class `visually-hidden` reading `Selected`. Nothing else is in the button.
  - The pool and every zone list their cards in the order of `order`.
- src/index.css must hold a `.visually-hidden` rule that removes the element from view and keeps it for assistive technology, and nothing else; T4 fills the rest.
- Selecting and sending must be one code path over these native buttons, so that a click, a tap and Enter or Space on a focused button do the same (ADR 002, PDR 002):
  - Pressing a card dispatches `select` for it. Before a dimension is chosen every card has the `disabled` attribute.
  - Pressing the pool's label or a zone's label while a card is selected dispatches `place` for the selected card into that place; while no card is selected it does nothing.
  - Pressing Escape while focus is inside the board, with a card selected, dispatches `select` for the selected card, which clears the selection.
- Never a `select` element or radio buttons for the picker: arrow keys would change the dimension and clear the board while the learner only browses.
- src/board/Board.test.tsx must render `Board` with `shippedSet` and a fixed random source, act through `@testing-library/user-event`, find the pool and the zones by their accessible names with `getByRole('region', { name })` or an equivalent, and hold at least these tests, named as here:
  - `shows every card in the pool, the prompt and no zone before a dimension is chosen`
  - `disables every card before a dimension is chosen`
  - `shows one zone per category of the chosen dimension and removes the prompt`
  - `sends a selected card to a zone by click`
  - `sends a selected card to a zone by keyboard`
  - `returns a selected card to the pool by click on the pool's label`
  - `clears the selection on a second click on the selected card`
  - `clears the selection on Escape`
  - `does nothing on a zone's label while no card is selected`
  - `Reset returns every card to the pool and keeps the dimension`
  - `choosing another dimension clears the board and shows its zones`
  - `choosing the current dimension again changes nothing`
    Guidance: the fixed random source makes the order after every shuffle exact, so a test can assert the first card's name; `screen.getByRole('button', { name: 'Penguin Selected' })` finds a selected card by its full accessible name, where Penguin stands for whatever item the test picked.
- In docs/vocabulary.md the rows must change so that:
  - Dimension: Where reads `The picker, as one button per dimension under "Sort by"`; Code gains `; `DimensionPicker` in src/board/DimensionPicker.tsx`.
  - Prompt: Where reads `Where the zones will be, before a dimension is chosen`; Code reads ``the prompt in `Board` in src/board/Board.tsx``.
  - Pool: Where reads `The pool's label`; Code gains `; `Pool` in src/board/Pool.tsx`.
  - Card: Where reads `Each card`; Code gains `; `Card` in src/board/Card.tsx`.
  - Zone: Where reads `Each zone's label`; Code gains `; `Zone` in src/board/Zone.tsx`.
  - Selected card: Where reads `Hidden text on the selected card, read by assistive technology`.
  - Reset: Where reads `A button beside the picker`; Code gains `; the Reset button in `Board` in src/board/Board.tsx`.

**Out of scope**

- Dragging, and any import from @dnd-kit/core: T3.
- Any stylesheet rule beyond `.visually-hidden`: T4.
- Check, the hint while it is disabled, marks, the score and Retry: cycle 004.
- Running the validator when the app starts and the error shown in place of the board: a later cycle, held by an open question.
- A heading or any text beyond the words listed above: never; the vocabulary gives the words.
- A confirmation before Reset or a change of dimension: never; PDR 004 decided against one.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/board/Board.test.tsx with at least 12 tests passed, and src/recordCitationGuard.test.ts still passing.
- `npm run dev`, opened in a browser: the page shows the picker with `Habitat` and `Diet`, `Reset`, `Unsorted` with 30 cards and `Choose how to sort to begin`; a click on `Habitat` shows six zones; a click on a card and then on `Ocean` moves the card; a reload shows the pool in another order with no dimension chosen.

**Debrief**

- `npm run typecheck` printed `> tsc -b` and exited 0.
- `npm test` printed `Test Files  5 passed (5)` and `Tests  43 passed (43)`; `npx vitest run --reporter=verbose` lists the 12 tests of src/board/Board.test.tsx under the names the Details give, all passing, and `every record citation outside the records names an active record` in src/recordCitationGuard.test.ts passing. `npm run build` succeeds.
- `npm run dev`, driven by a Playwright script in headless Chromium from outside the repository: the page read `Sort by`, `Habitat`, `Diet`, `Reset`, `Unsorted` with 30 cards and `Choose how to sort to begin`; a click on `Habitat` gave 6 zones; a click on `Baboon` and then on `Ocean` left `Ocean` holding `Baboon`; after a reload the pool held 30 cards in another order with `Habitat` at `aria-pressed="false"`. The only console error was the browser's own 404 for /favicon.ico, which index.html does not declare.
- No departure from guidance: the reducer is memoised on `set`, and the tests find a selected card by its full name, such as `Baboon Selected`.
- Read `Card` in src/board/Card.tsx: a selected card's button holds a space between the item's name and the `Selected` span, because without it the spoken name runs together as `BaboonSelected`. That space is the only thing in the button besides the name and the span.
- Read `Board` in src/board/Board.tsx: Escape is caught by a `keydown` handler on the board's outer `div`, so it works from any focused button in the board. `Board` reads `set` only at its first render: a new `set` gives a new reducer but does not load the board again. The keyboard test sets focus with `focus()` rather than Tab, and presses Enter on the card and Space on the zone's label; the Tab path is left to the hand check of the cycle's Judgement.

### T3 — Dragging with dnd-kit

**Status**

- [x]

**Goal**

The learner drags a card by mouse or touch from the pool to a zone, between zones and back to the pool, and a press without movement still selects the card.

**Dependencies**

- T1: `Place`, the `dragStart` and `place` actions in src/board/board.ts.
- T2: `Board`, `Pool`, `Zone` and `Card` and their props.

**Files**

- src/board/Board.tsx
- src/board/Pool.tsx
- src/board/Zone.tsx
- src/board/Card.tsx
- src/board/Card.css (new)
- src/board/Board.test.tsx
- package.json
- package-lock.json

**Details**

- The dependency @dnd-kit/core at major version 6 must be added, and no other dnd-kit package (ADR 002).
- `Board` must wrap the board in one `DndContext` with exactly one sensor, a `PointerSensor` with an `activationConstraint` of `distance`, and never a `KeyboardSensor`, `MouseSensor` or `TouchSensor` (ADR 002). Guidance: a distance of 8 pixels.
- `DndContext` must receive `onDragStart`, dispatching `dragStart` for the dragged item; `onDragEnd`, dispatching `place` for the dragged item into the `place` carried by the droppable it ended over, and nothing when it ended over none; and `onDragCancel`, doing nothing (ADR 003).
- No text of dnd-kit's own may reach the document or be announced: `DndContext` must receive an `accessibility` prop whose `announcements` each return `undefined` and whose `screenReaderInstructions.draggable` is the empty string, and `Card` must never spread the `attributes` that `useDraggable` returns, since they add a role description and a description the vocabulary does not give.
- `Card` must call `useDraggable` with the item's name as `id` and `disabled` from its props, apply `setNodeRef` and `listeners` to its button, and move the button while dragged by a `transform` style built from the `transform` it returns. Guidance: write `translate3d(${x}px, ${y}px, 0)` by hand rather than add @dnd-kit/utilities.
- `Pool` must call `useDroppable` with id `pool` and data `{ place: { kind: 'pool' } }`; `Zone` must call it with id `zone:` followed by the category and data `{ place: { kind: 'zone', category } }`; each applies `setNodeRef` to its section.
- src/board/Card.css must be imported by `Card` and must set `touch-action: none` on the card's button, so that a touch drag is not taken as a scroll (ADR 002, PDR 001). Guidance: LCD1 governs the file; it holds no colour or size here.
- The tests of T2 must keep passing unchanged, which shows that a click still selects under the sensor; change src/board/Board.test.tsx only if rendering under `DndContext` needs a wrapper.

**Out of scope**

- Styling the dragged card or the zone under it beyond the transform: T4.
- An automated test of a drag: never; ADR 006 checks the drag path by hand.
- A drag preview or `DragOverlay`: an unsettled decision.
- dnd-kit's keyboard sensor: never; ADR 002 makes tap and keyboard one path over native buttons.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes with the same tests as at the end of T2.
- `npm ls @dnd-kit/core` prints one line with a version starting `@dnd-kit/core@6.`.
- `npm run dev`, opened in Chrome with Habitat chosen: a card dragged by mouse from the pool to a zone lands there; dragged from that zone to another, lands there; dragged back to the pool, lands there; a press and release on a card without movement selects it; with the pointer over a zone during a drag, a release before the activation distance leaves the card where it was. In Chrome's device emulation of a phone, a touch drag from the pool to a zone lands there.
- `npm run dev`, before a dimension is chosen: a drag of a card does not start.

**Debrief**

- `npm run typecheck` printed `> tsc -b` and exited 0.
- `npm test` printed `Test Files  5 passed (5)` and `Tests  43 passed (43)`; `npx vitest run --reporter=verbose` lists the same 43 test names as at the end of T2, the 12 of src/board/Board.test.tsx among them, and src/board/Board.test.tsx is unchanged. `npm run build` succeeds.
- `npm ls @dnd-kit/core` printed the root line `sort-it@0.0.0 /home/jadenlu/Projects/SortIt` and one dependency line, `└── @dnd-kit/core@6.3.1`. package.json gains only `"@dnd-kit/core": "^6.3.1"`; @dnd-kit/accessibility and @dnd-kit/utilities appear in package-lock.json only as dependencies of @dnd-kit/core.
- `npm run dev`, driven by a Playwright script in headless Chromium from outside the repository, at 1366 by 768 with Habitat chosen: a mouse drag of `Hippopotamus` from the pool to `Ocean` left `Ocean` holding it, with `translate3d(553.93px, 42px, 0px)` on the card mid-drag and no card selected after the drop; a drag from `Ocean` to `Forest` left `Ocean` empty and `Forest` holding it; a drag from `Forest` to `Unsorted` left `Forest` empty and the card in the pool; a press and release on `Crocodile` without movement gave `Crocodile Selected`; with `Crocodile` in `Desert`, a press on it, a move of 4 by 3 pixels inside `Desert` and a release gave no transform and left it in `Desert`, selected by the click; a drag of it onto `Reset`, over no droppable, left it in `Desert`. In a context 390 by 844 with touch and mobile emulation, a touch drag sent as Chrome DevTools Protocol touch events moved `Duck` from the pool to `Ocean`. After the drags the live region and the hidden description dnd-kit adds both held empty text, no card carried `aria-roledescription`, and a card's computed `touch-action` was `none`. The only console error was the 404 for /favicon.ico seen in T2.
- `npm run dev`, before a dimension is chosen: a mouse press on the first card and a move of 60 by 60 pixels gave the card no transform, and the pool's order was unchanged after the release.
- No departure from guidance: the activation distance is 8 pixels, and the transform is written by hand as `translate3d`.
- Read `Card` in src/board/Card.tsx: its button gains the class `card`, which src/board/Card.css selects for `touch-action: none`; that class is the only attribute added besides the ref, the listeners and the transform. `dragEnd` in `Board` in src/board/Board.tsx casts the droppable's `data.current` to `{ place: Place }`, which `Pool` and `Zone` are the only writers of. A click that follows an activated drag never reaches the card, because dnd-kit's pointer sensor stops it, so a drop does not also select the card it moved. The browser checks ran in headless Chromium with touch sent through the DevTools Protocol, not in Chrome's own device toolbar; the hand check in Chrome, Firefox and Safari is the cycle's Judgement.

### T4 — Layout and stylesheet

**Status**

- [x]

**Goal**

The board fits a desktop screen without scrolling at the sizes PDR 001 promises and becomes one scrolling column on a portrait phone, with every colour and size a custom property in plain CSS.

**Dependencies**

- T2: the document structure of `Board`, `DimensionPicker`, `Pool`, `Zone` and `Card`.
- T3: `Card.css`, the `isOver` state of each droppable and the transform of a dragged card.

**Files**

- src/index.css
- src/board/Board.css (new)
- src/board/DimensionPicker.css (new)
- src/board/Pool.css (new)
- src/board/Zone.css (new)
- src/board/Card.css
- src/board/Board.tsx
- src/board/DimensionPicker.tsx
- src/board/Pool.tsx
- src/board/Zone.tsx
- src/board/Card.tsx

**Details**

- Styling must be plain CSS in one file per component, imported by that component, with every colour and every size a custom property declared on `:root` in src/index.css, and no CSS framework, preprocessor or CSS-in-JS library (LCD1). A component stylesheet may hold a literal only in a media query's condition.
- src/index.css must declare the custom properties, set the page's background and text colour and a system font stack on `body`, and keep the `.visually-hidden` rule.
- At a viewport of 1366 by 768 in the served desktop browsers, with Habitat chosen and all 30 cards in the pool, the page must show the picker, Reset, the pool and all six zones with no scrollbar (PDR 001). Guidance: one column of three rows, the picker with Reset on top, the pool as a band of wrapped cards, and the zones as a grid of three columns and two rows filling the remaining height; a card is a compact chip.
- At a viewport 390 wide the board must be one column, the pool above the zones and the zones one below another, and the page must scroll (PDR 001). Guidance: a media query at 720 pixels.
- A zone and the pool must each be a visible region with its label at the top, and a card dropped or sent into one must appear inside it. A zone or the pool under a dragged card must be marked by a change of colour while `isOver` is true.
- A tap anywhere in a zone or the pool outside a card must press its label button, so that a learner sends a card by tapping the zone and not only its label. Guidance: give the section `position: relative` and the label button an `::after` pseudo-element with `position: absolute; inset: 0`, and put the cards above it with `position: relative` and a higher `z-index`.
- The selected card must be marked by a visible outline and a change of colour, and a disabled card must look the same as an enabled one but for its cursor, since the pool before a dimension is chosen is the learner's first view of the set (PDR 002).
- A card must keep a visible focus ring under keyboard focus, so the keyboard path of PDR 002 can be followed by eye.
- Every button must have a minimum hit size of 44 by 44 pixels on the phone width, declared as a custom property.

**Out of scope**

- Colours or icons for marks, and the layout of Check, the hint, the score and Retry: cycle 004.
- Dark mode: an unsettled decision.
- A font loaded from the network: never; the stylesheet survives without it and nothing is kept beyond the visit.
- Animation of a card settling after a drop: an unsettled decision.

**Done when**

- `npm run typecheck` exits 0 and `npm test` passes with the same tests as at the end of T3.
- `grep -nE '#[0-9a-fA-F]{3,8}|\b[0-9]+(px|rem|em|vh|vw|%)' src/board/*.css | grep -v '@media'` prints nothing.
- `npm run dev`, opened in Chrome, Firefox and Safari at 1366 by 768 with Habitat chosen and every card in the pool: `document.documentElement.scrollHeight <= window.innerHeight` evaluates to `true` in the console.
- `npm run dev`, opened in Chrome's device emulation at 390 wide with Habitat chosen: the pool stands above the zones, each zone stands below the one before, and the page scrolls to the last zone.
- `npm run dev`: a click on a zone's empty area with a card selected sends the card there; a dragged card over a zone changes that zone's colour until it is released.

**Debrief**

- `npm run typecheck` printed `> tsc -b` and exited 0. `npm test` printed `Test Files  5 passed (5)` and `Tests  43 passed (43)`, the same 43 tests as at the end of T3; src/board/Board.test.tsx is unchanged. `npm run build` succeeds.
- `grep -nE '#[0-9a-fA-F]{3,8}|\b[0-9]+(px|rem|em|vh|vw|%)' src/board/*.css | grep -v '@media'` printed nothing.
- `npm run dev`, driven by a Playwright script from outside the repository at 1366 by 768 with Habitat chosen and all 30 cards in the pool: `document.documentElement.scrollHeight <= window.innerHeight` gave `true` (768 against 768, `scrollWidth` 1366) in headless Chromium and in headless Firefox, with six zones of 442 by 290 in three columns and two rows under a pool 107 high. Safari was not checked: Playwright's WebKit build does not launch on this Fedora host without system libraries, which I did not install. Safari is left to the hand check of the cycle's Judgement.
- `npm run dev`, in Chromium emulating a phone at 390 by 664 with Habitat chosen: the pool spans y 64 to 528 and the six zones follow one below another at y 536, 640, 744, 848, 952 and 1056, all 366 wide; `scrollHeight` is 1164 and `scrollWidth` 390, and scrolling to the end shows the last zone whole (top 556, bottom 652 in a 664 viewport). The smallest of the 40 buttons is 44 by 44.
- `npm run dev`: in Chromium and Firefox at the desktop size, a click on a card and then near the bottom of Desert's empty area left Desert holding the card. In the phone emulation, a tap on a card and then a tap in Arctic's empty corner left Arctic holding it. A mouse drag of a pool card held over Forest gave Forest the class `zone zone-over` and the background `rgb(227, 238, 252)`, against `rgb(255, 255, 255)` before; after the release it was `zone` and white again and Forest held the card, in both browsers. No console error was logged.
- Also observed in both browsers: a disabled card and an enabled one have the same computed colour, background, border and opacity, and differ only in `cursor`, `default` against `grab`; after five Tabs from a selection the focused card showed a 3px solid outline.
- Departures from guidance: none in the layout. The zones fill the remaining height as a grid of three columns inside a flex column, and the label's `::after` stretches over its region as the guidance gives.
- Read `Board` in src/board/Board.tsx: it gains two wrapper `div`s, `board-bar` around the picker and Reset and `board-zones` around the prompt or the zones, so the zones form one grid; no text or role is added. `Card` in src/board/Card.tsx gains the classes `card-selected` and `card-dragging`, the latter from `useDraggable`'s `isDragging`, which lifts the dragged card above every region. `Pool` and `Zone` read `isOver` from `useDroppable` into the classes `pool-over` and `zone-over`.
- Read src/board/Card.css: the selected card's outline is a `box-shadow` ring, not the CSS `outline` property, because the keyboard focus ring uses `outline` and the two must show together on a focused selected card. src/index.css also holds a `box-sizing` rule and a rule that makes buttons inherit the page's font and colour, and the custom property `--full-row`, which holds the 100% basis of a region's label, because the grep forbids the literal in a component stylesheet.
- Outside the repository: installing Playwright's Firefox and WebKit removed the Chromium builds 1243 that ~/.cache/ms-playwright held, and I installed Chromium 1217 in their place. Another project's Playwright that needs 1243 will download it again.
