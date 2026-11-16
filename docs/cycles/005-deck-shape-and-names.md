# 005 — Deck shape and names

## Goal

Outcome: The code calls the collection a deck and each thing sorted a card, every deck takes the one shape `Deck` keyed by ids, and the app's own deck is one JSON file keyed by name that passes the validator in a test, is turned into a `Deck`, and is sorted on the board as it is today.

Scope: The cycle covers the rename of set to deck and of item to card through every tracked file outside docs/ and through docs/vocabulary.md; the type `Deck` and its parts; the app's own deck as deck.json and its conversion to a `Deck`; and the board reading a `Deck` by ids. It leaves out the check of the app's own deck when the app starts, the error shown in place of the board, and every change in how the board behaves.

Judgement: The engineer opens the app at `npm run dev` in a desktop browser and finds the board of the app's own deck behaving as it did before the cycle: 30 cards in the pool, the picker, the zones of the chosen dimension, a card moved by drag and by a click on it and then on a label, Reset, Check, Retry and the score. The engineer runs the three `git grep` commands of T2's Done when and reads the four rows T1 gives docs/vocabulary.md.

## Records

- ADR 007: One deck shape keyed by ids made on the device, with the app's own deck bundled as JSON keyed by name
- ADR 018: Vitest in four kinds, unit, component in jsdom, Convex functions under convex-test and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Deck and card names and the `Deck` shape

**Status**

- [ ]

**Goal**

The code, the vocabulary and AGENTS.md call the collection a deck and each thing sorted a card, and the app's own deck, kept in deck.json keyed by name, converts to the one shape `Deck` keyed by ids.

**Dependencies**

None.

**Files**

- src/set/itemSet.ts, removed
- src/set/set.json, removed
- src/set/shippedSet.ts, removed
- src/set/shippedSet.test.ts, removed
- src/set/findFirstFault.ts, removed
- src/set/findFirstFault.test.ts, removed
- src/deck/appDeckFile.ts, new
- src/deck/deck.json, new
- src/deck/appDeck.ts, new
- src/deck/appDeck.test.ts, new
- src/deck/findFirstFault.ts, new
- src/deck/findFirstFault.test.ts, new
- src/deck/toDeck.ts, new
- src/deck/toDeck.test.ts, new
- convex/model/deck.ts, new
- src/App.tsx
- src/board/board.ts
- src/board/board.test.ts
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Card.tsx
- src/board/Card.css
- src/board/Pool.tsx
- src/board/Zone.tsx
- docs/vocabulary.md
- AGENTS.md

**Details**

- Every identifier, property, parameter, file name, test name, string and comment in this task's Files that says set for the collection, or item for a thing sorted, must say deck or card. A word with another meaning stays: `align-items` in the CSS, the `set` method of a `Map`, the verb "sets", `setUp`, `setup` and `setNodeRef`.
- Each file under src/set/ must move to src/deck/ under the name the Files give in the same order: itemSet.ts to appDeckFile.ts, set.json to deck.json, shippedSet.ts to appDeck.ts, shippedSet.test.ts to appDeck.test.ts, and the two findFirstFault files under their own names. Guidance: `git mv` keeps each file's history.
- In deck.json the key `items` must become `cards`, and nothing else in the file changes.
- convex/model/deck.ts must hold exactly these types and import nothing (ADR 007):

```ts
export type Category = { id: string; name: string };

export type Dimension = { id: string; name: string; categories: Category[] };

export type Card = {
  id: string;
  name: string;
  /** Maps a dimension's id to the id of the one category of that dimension that is the card's answer; a dimension with no entry has no answer. */
  answers: Record<string, string>;
};

export type Deck = {
  id: string;
  name: string;
  dimensions: Dimension[];
  cards: Card[];
};
```

- `Deck` and `Card` name the shape keyed by ids, so the type of deck.json, today `ItemSet`, must take the name `AppDeckFile`, and its parts must have no exported type of their own:

```ts
// src/deck/appDeckFile.ts
/** The shape of deck.json: the app's own deck as its author writes it, keyed by name, with no id. */
export type AppDeckFile = {
  dimensions: { name: string; categories: string[] }[];
  cards: {
    name: string;
    /** Maps a dimension's name to the one category name of that dimension the card belongs to. */
    answers: Record<string, string>;
  }[];
};
```

- The validator must keep every rule and its order of looking, under these names:

```ts
// src/deck/findFirstFault.ts
export type DeckFault =
  | { kind: "noCard" }
  | { kind: "noDimension" }
  | { kind: "tooFewCategories"; dimension: string }
  | { kind: "duplicateCard"; card: string }
  | { kind: "duplicateDimension"; dimension: string }
  | { kind: "duplicateCategory"; dimension: string; category: string }
  | { kind: "answer"; card: string; dimension: string };

export function findFirstFault(deck: AppDeckFile): DeckFault | null;
```

- The conversion must be one pure function that never changes the file it is given (ADR 007):

```ts
// src/deck/toDeck.ts
/** The id of the app's own deck as a `Deck`. */
export const appDeckId = "app";

export function toDeck(file: AppDeckFile): Deck;
```

- `toDeck` must give the deck the id `appDeckId` and the name `""`, and give each dimension, each category and each card its name as its id, in the file's order.
- `toDeck` must give each card one answer for each key of its `answers` that names a dimension of the file, keyed by that name with the category name as its value, and must drop a key that names no dimension. `toDeck` checks no value: an answer whose value names no category of its dimension is kept as it stands, since `findFirstFault` refuses a file that holds one and the test of the app's own deck proves the shipped file holds none.
- src/deck/appDeck.ts must export the file and its `Deck`, the import assigned to its type so that TypeScript checks the file's shape:

```ts
// src/deck/appDeck.ts
export const appDeckFile: AppDeckFile = file; // `file` is the default import of ./deck.json
export const appDeck: Deck = toDeck(appDeckFile);
```

- The board must keep reading the deck keyed by name in this task: `Board` takes the prop `deck: AppDeckFile` in place of `set: ItemSet`, `createBoardReducer` takes an `AppDeckFile`, and `App` passes `appDeckFile`.
- src/deck/appDeck.test.ts must run `findFirstFault` over `appDeckFile`.
- docs/vocabulary.md must hold these four rows, each character for character, each replacing the row of the same concept:

```
| Board | Dimension, one way a deck can be sorted, picked by the learner | "Sort by"; the dimension's name as the deck gives it, as "Habitat" | The picker, as one button per dimension under "Sort by" | `Dimension` in convex/model/deck.ts; `dimension` of `BoardState` in src/board/board.ts; `DimensionPicker` in src/board/DimensionPicker.tsx |
| Board | Card, one thing the learner sorts in a deck | the card's name as the deck gives it, as "Penguin" | Each card | `Card` in convex/model/deck.ts; `Card` in src/board/Card.tsx |
| Board | Zone, one category of the chosen dimension, where cards are placed | the category's name as the deck gives it, as "Ocean" | Each zone's label | `Category` in convex/model/deck.ts; `Place` of kind `zone` in src/board/board.ts; `Zone` in src/board/Zone.tsx |
| Deck | Error shown in place of the board when a card of the app's own deck lacks exactly one answer in a dimension | "This deck cannot be shown: "<Card>" needs exactly one answer for <dimension>." | Not shown yet | `DeckFault` of kind `answer` and `findFirstFault` in src/deck/findFirstFault.ts |
```

- The first two lines under "# Project" in AGENTS.md must read:

```
- Sort It is a single-page quiz app in which a learner picks a dimension and drags each card of a fixed deck into its correct category for that dimension.
- The product's user is the learner, who sorts the cards; the cards and dimensions come from one data file in the repository that is edited by hand.
```

- Guidance: `tsc -b` checks convex/model/deck.ts through the import in src/deck/toDeck.ts, so no tsconfig file changes.

**Out of scope**

- Reading the `Deck` by ids on the board: T2.
- Checking the app's own deck when the app starts, or showing an error in place of the board: a later cycle; the sentences the error shows for six of its seven faults are an unsettled decision.
- A name for the app's own deck in deck.json, or any name for it but the empty string `toDeck` gives: an unsettled decision.
- Installing the `convex` package, or adding any other file under convex/: a later cycle.
- Carrying the rename into a record or a file under docs/cycles/: never.

**Done when**

- These tests in src/deck/toDeck.test.ts pass: `toDeck gives the deck the fixed id and an empty name, and each dimension, category and card its name as its id, in the file's order`; `toDeck keeps each answer that names a dimension and drops an answer that names none`; `toDeck leaves the file it is given unchanged`.
- The test `the app's own deck meets every rule it must meet` in src/deck/appDeck.test.ts passes.
- Every test in src/deck/findFirstFault.test.ts, src/board/board.test.ts and src/board/Board.test.tsx passes.
- `git ls-files src/set` prints nothing.
- `git grep --untracked -c -E "[iI]tem" -- . ':!docs' ':!package-lock.json'` prints exactly the two lines `src/board/Board.css:1` and `src/board/DimensionPicker.css:1`.
- `git grep --untracked -n -E "ItemSet|shippedSet|SetFault|validSet|/set/|set\.json" -- . ':!docs' ':!package-lock.json'` prints nothing.
- `git grep --untracked -c -w "set" -- . ':!docs' ':!package-lock.json'` prints exactly the one line `src/recordCitationGuard.test.ts:1`.
- `grep -n -w -i -E "items?|sets?" docs/vocabulary.md` prints nothing, and each of the four rows of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T2 — Board over a `Deck` by ids

**Status**

- [ ]

**Goal**

The board reads the `Deck` it is given, keeps every card, dimension and category by its id and shows each by its name, and the app shows the board of `appDeck`.

**Dependencies**

- T1: `Deck`, `Dimension`, `Category` and `Card` in convex/model/deck.ts; `appDeck` in src/deck/appDeck.ts; `Board`, `createBoardReducer`, `BoardState` and `BoardAction` under their renamed props and fields.

**Files**

- src/App.tsx
- src/board/board.ts
- src/board/board.test.ts
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Card.tsx
- src/board/Pool.tsx
- src/board/Zone.tsx
- src/board/DimensionPicker.tsx

**Details**

- `createBoardReducer` and `Board` must take a `Deck` from convex/model/deck.ts (ADR 007):

```ts
// src/board/board.ts
export function createBoardReducer(
  deck: Deck,
): (state: BoardState, action: BoardAction) => BoardState;

// src/board/Board.tsx
export type BoardProps = {
  deck: Deck;
  /** Draws every shuffle of the cards. */
  random?: RandomSource;
};
```

- In `BoardState`, `Place` and `BoardAction`, every value that names a card, a dimension or a category must be its id: `dimension`, `selected`, the keys of `places` and of `marks`, the entries of `order`, `category` of a `Place` of kind `zone`, and the `card` and `dimension` fields of the actions (ADR 007).
- A name must be read from the `Deck` only to show it: each button of the picker, each zone's label and each card show the name of the dimension, the category or the card whose id they hold.
- A card's draggable id must be its card id, and a zone's droppable id must be made from its category id.
- `App` must render `Board` with `appDeck`.
- No rule of the board changes: every test in src/board/board.test.ts and src/board/Board.test.tsx must keep what it asserts, rewritten over ids where it names a card, a dimension or a category.
- The deck that src/board/board.test.ts reduces over must give every dimension, category and card an id that differs from its name, so that a key taken from a name fails a test.
- Guidance: src/board/Board.test.tsx keeps rendering the app's own deck, now `appDeck`, whose ids are its names, and adds the one test of the Done when over a deck of its own whose ids differ from its names.
- Guidance: `Pool` and `Zone` take the `Card` objects they show and `DimensionPicker` the `Dimension` objects, so each component reads the id and the name from one value. `Pool` and `Zone`, which also import the component `Card`, import the type as `CardModel`. `Zone` takes its `Category` object the same way, and the component `Card` takes the card it shows as a `CardModel`, imported under that name there too.
- The builder cannot drag a card in jsdom (ADR 018). The checks by hand of the cycle's Judgement are the engineer's, and the builder's evidence for it is the tests and the commands of this Done when.

**Out of scope**

- Removing the selecting and sending of a card, making Check a switch, or computing a mark where it is read: a later cycle.
- Holding the board's state outside `Board`, or keeping one board for each deck id: a later cycle.
- Making an id with `crypto.randomUUID()`: a later cycle.
- A change to convex/model/deck.ts or to any file under src/deck/: never.

**Done when**

- The test `shows each dimension, zone and card by its name for a deck whose ids differ from its names` in src/board/Board.test.tsx passes.
- Every other test in src/board/board.test.ts and src/board/Board.test.tsx passes.
- `npm run build` exits with status 0.
- `git grep --untracked -c -E "[iI]tem" -- . ':!docs' ':!package-lock.json'` prints exactly the two lines `src/board/Board.css:1` and `src/board/DimensionPicker.css:1`.
- `git grep --untracked -n -E "ItemSet|shippedSet|SetFault|validSet|/set/|set\.json" -- . ':!docs' ':!package-lock.json'` prints nothing.
- `git grep --untracked -c -w "set" -- . ':!docs' ':!package-lock.json'` prints exactly the one line `src/recordCitationGuard.test.ts:1`.

**Debrief**

None.
