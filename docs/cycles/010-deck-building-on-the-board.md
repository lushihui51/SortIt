# 010 — Deck building on the board

Waits for: 005, `Deck`, `Dimension`, `Category` and `Card` in convex/model/deck.ts and `DimensionPicker` in src/board/DimensionPicker.tsx; 006, `useDeckBoard` and `DeckBoardAction` in src/board/BoardsProvider.tsx, `BoardState` and `fitBoard` in src/board/board.ts, `Pool` in src/board/Pool.tsx and `Zone` in src/board/Zone.tsx; 007, the queries `list` and `get` and the mutations `addCard`, `deleteCard`, `addDimension`, `deleteDimension`, `addCategory`, `deleteCategory` and `saveAnswers` of convex/decks.ts, and the seven acts named as those mutations, `ActResult`, `SaveAnswersResult` and `Refusal` in convex/model/deckActs.ts; 008, the `account` prop of `Board`; 009, `Board` and `BoardProps` in src/board/Board.tsx with the `back` prop, the component `Card` in src/board/Card.tsx rendering `InfoButton`, `Panel` in src/ui/Panel.tsx with the look of Delete in src/ui/Panel.css, `useDeckActs` and `DeckActs` in src/decks/useDeckActs.ts, src/decks/optimistic.ts, `DeckScreen` in src/screens/DeckScreen.tsx, `AppDeckScreen` in src/screens/AppDeckScreen.tsx, `NewField` in src/ui/NewField.tsx, `InfoButton` in src/ui/InfoButton.tsx, `Question` in src/ui/Question.tsx, `refusalWords` in src/words/refusalWords.ts, src/words/deleteQuestion.ts, and every other file this cycle's tasks list that an earlier cycle lists, docs/vocabulary.md and src/index.css among them, as 009 leaves it

Canvas: https://claude.ai/artifact/7pSWsLHVAWh84NfzBUx96F

## Goal

Outcome: On the board of a deck of their own, a learner makes cards, dimensions and categories by the dashed fields, deletes each from its panel after a question naming what is lost, reads why a name is refused, and sets answers by Save answers, with a question before any existing answer changes.

Scope: The cycle covers the acts on a deck's cards, dimensions and categories sent through the hook with their optimistic update, the words of their refusals and questions, the three fields on the board of a learner's own deck, the prompt of a deck with no dimension, the ⓘ on each dimension and each zone, Delete in the panel of a card, a dimension and a category with its question, and Save answers with its question. It leaves out renaming anything, the lines for changes not yet kept or not kept, and every change to the board of the app's own deck.

Judgement: The engineer runs `npx convex dev` and `npm run dev`, signs in and makes a deck. Its empty board reads "Add cards and a dimension to begin" with the "New card" and "New dimension" fields. Typing names into "New card" adds cards to the pool one after another; "New dimension" adds a dimension and chooses it, and every card then shows the no-answer mark; "New category" adds zones. A name already used and an empty name each show their refusal under their field, which keeps what was typed. The engineer drags cards into zones and presses "Save answers": the no-answer marks of those cards go, and with Check on the cards read correct. Moving a saved card to another zone and pressing "Save answers" asks how many cards' answers change, and Cancel changes none. The ⓘ of a card, of a dimension and of a zone each open a panel with Delete, whose question names the thing and what is lost; deleting a category returns its cards to the pool with no answer, and deleting the chosen dimension returns the board to no dimension chosen. A reload shows every change kept. The board of the app's own deck shows none of the fields, no ⓘ on a dimension or a zone, no Delete and no "Save answers".

## Records

- PDR 001: Current desktop browsers and portrait phones as the served devices
- PDR 004: Reset and a change of dimension clearing the board at once
- PDR 007: Check as a switch for live marks
- PDR 009: Deck rules with an error or a refusal
- PDR 010: Answers set by saving the sorted board
- PDR 011: Fields for making, panels for changing and deleting
- PDR 014: Changes shown at once, kept when back online
- ADR 007: One shape keyed by ids for every deck
- ADR 009: Convex and one owner helper for learners' decks
- ADR 011: One document per deck, changed by pure acts
- ADR 012: Refusals as mutation values, named by one hook
- ADR 014: @dnd-kit/core for dragging alone, cards holding one button
- ADR 015: Boards by deck id in one pure reducer
- ADR 016: A board component free of Convex and Clerk
- ADR 018: Vitest in four kinds, dragging checked by hand

## Tasks

### T1 — Acts on a deck's things through the hook

**Status**

- [x]

**Goal**

The hook sends each act that makes or deletes a card, a dimension or a category, and Save answers, for one deck: it applies the act on the device first, returns a refusal without sending, and applies the same act as the mutation's optimistic update, and a board's dispatch can carry the deck an act has just returned.

**Dependencies**

None.

**Files**

- src/decks/useDeckActs.ts
- src/decks/useDeckActs.test.tsx
- src/decks/optimistic.ts
- src/decks/optimistic.test.ts
- src/board/Board.tsx
- src/board/BoardsProvider.tsx
- src/board/BoardsProvider.test.tsx

**Details**

- The task must create or change these interfaces (ADR 011, ADR 012, ADR 016):

```ts
// src/board/Board.tsx
/** The acts that change the deck a board shows. Each takes ids and names as the acts of convex/model/deckActs.ts do. */
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

// src/decks/useDeckActs.ts, added to DeckActs
/** The acts on the things of `deck`, each applied to `deck` before anything is sent. */
forDeck(deck: Deck): BoardActs;

// src/decks/optimistic.ts
/** The name of an act on a deck's things, which is also the name of its mutation in convex/decks.ts. */
export type ThingAct =
  | "addCard"
  | "deleteCard"
  | "addDimension"
  | "deleteDimension"
  | "addCategory"
  | "deleteCategory"
  | "saveAnswers";

/** Applies the act to the deck the store holds under `args.deck`, and sets the deck's own query and its place in the list of decks to the result. */
export function actLocally(
  store: OptimisticLocalStore,
  act: ThingAct,
  args: { deck: string } & Record<string, unknown>,
): void;

// src/board/BoardsProvider.tsx, the dispatch `useDeckBoard` returns,
// and src/board/Board.tsx, `dispatch` of BoardProps
dispatch: (action: DeckBoardAction, deck?: Deck) => void;
```

- Each act of `forDeck` must apply the act of the same name in convex/model/deckActs.ts to `deck`, return its result, send nothing when it refuses or returns the deck it was given, the same object, and otherwise send the mutation of the same name with the deck's id and the act's arguments (ADR 011).
- `addCard`, `addDimension` and `addCategory` must give the thing they make an id from `crypto.randomUUID()`, and pass the name as typed (ADR 007).
- Each mutation must be given `actLocally` for its act through `withOptimisticUpdate`. `actLocally` must take the deck from the deck's own query, or, while the store holds no value for that query, from the list of decks, which is the deck `DeckScreen` shows then (PDR 014). It must do nothing when the deck's own query holds null, when neither holds the deck, or when the act refuses. Otherwise it must set the deck's own query to the act's result and, when the store holds the list and the list holds the deck, put the result in the deck's place in the list. It must never change a value the store gave it (ADR 009, ADR 011).
- The hook must catch a mutation that throws, as it does for `createDeck`.
- Guidance: `actLocally` hands the act every argument but `deck`, cast to the act's own argument type.
- The dispatch of `useDeckBoard` must send the action with `deck` when it is given one, in place of the deck the hook was last given, so that an action sent in the same press as an act reads the deck the act returned (ADR 015). The handed deck stands for that one action alone: the next action sent without a deck carries the deck the hook was last given. The dispatch compares nothing of the handed deck with the hook's own; a caller hands it only a deck that an act on the hook's deck returned, which bears the same id.
- `BoardActs` is a type only in this task; no component takes it yet.

**Out of scope**

- Any field, button or panel that calls an act: T3, T4 and T5.
- An act that renames a card, a dimension, a category or a deck: an unsettled decision.
- Keeping what an act touched, or giving a line for a change not kept: a later cycle.
- An import of `convex/react`, of src/decks/ or of anything of Clerk in a file under src/board/: never (ADR 016).

**Done when**

- These tests in src/decks/optimistic.test.ts pass:
  - `actLocally sets the deck's own query and its place in the list to the deck its act returns, for each of the seven acts`
  - `actLocally takes the deck from the list while the deck's own query holds no value, and sets both`
  - `actLocally changes nothing when the act refuses, when the deck's own query holds null, or when neither that query nor the list holds the deck`
  - `actLocally changes no value the store gave it`
- These tests in src/decks/useDeckActs.test.tsx pass:
  - `each act of forDeck sends its mutation with the deck's id and its arguments and returns the act's result`
  - `addCard, addDimension and addCategory send a new id made on the device`
  - `an act that refuses sends nothing and returns the refusal`
  - `an act that leaves the deck as it was sends nothing`
- The test `the dispatch of useDeckBoard sends an action with the deck it is handed in place of the deck of the last render` in src/board/BoardsProvider.test.tsx passes.
- Every other test passes under `npm test`, and `npm run typecheck` exits with status 0.

**Debrief**

- `npx vitest run src/decks src/board/BoardsProvider.test.tsx --reporter=verbose` shows ✓ for all four tests of src/decks/optimistic.test.ts named in Done when. They run each of the seven acts against a store holding both queries and against a store holding only the list. For the refusal cases they run nine refused calls, a deck's own query of null, a list without the deck, and an empty store. The no-change test freezes the list, the deck's own query and the arguments.
- The same run shows ✓ for all four tests of src/decks/useDeckActs.test.tsx named in Done when. The first one also calls the optimistic update each mutation was given and asserts it calls `actLocally` with the store, the act's name and the sent arguments. To make this possible, the file mocks `actLocally` alone and keeps the rest of src/decks/optimistic.ts.
- The same run shows ✓ for `the dispatch of useDeckBoard sends an action with the deck it is handed in place of the deck of the last render`. With the line `handed ?? latestDeck.current` changed back to `latestDeck.current` in `useDeckBoard`, the test fails, and passes again once the change is restored.
- `npm test`: 23 test files passed, 215 tests passed. `npm run typecheck` exits with status 0 and prints nothing beyond its command line.
- I extended the existing test `a mutation that throws leaves no unhandled rejection and writes the error to the console` with `forDeck(...).addCard`, so it now also covers the requirement to catch a thing's mutation that throws. Its name is unchanged.
- Departure from guidance: `actLocally` hands the act every argument but `deck`, as the guidance says, but it casts the act (an entry of the map `thingActs` keyed by `ThingAct`) and leaves the arguments uncast. The effect is the same, with one cast in place of seven.
- Read `forDeck` and `useThingMutation` in src/decks/useDeckActs.ts. Every act passes through the one inner function `apply`, which runs the act, sends only when the result is ok and its deck is not the same object, and returns the result. `useThingMutation` gives each of the seven mutations its optimistic update by its act's name.

### T2 — Words of the questions

**Status**

- [x]

**Goal**

One function each gives the words the learner reads in the question before a card, a category or a dimension is deleted, and in the question before Save answers changes existing answers.

**Dependencies**

None.

**Files**

- src/words/deleteQuestion.ts
- src/words/deleteQuestion.test.ts
- src/words/saveAnswersQuestion.ts, new
- src/words/saveAnswersQuestion.test.ts, new

**Details**

- The task must create or change these interfaces:

```ts
// src/words/deleteQuestion.ts
export function deleteCardQuestion(card: Card): string;
/** `dimension` is the category's dimension, a dimension of `deck`. */
export function deleteCategoryQuestion(
  deck: Deck,
  dimension: Dimension,
  category: Category,
): string;
export function deleteDimensionQuestion(dimension: Dimension): string;

// src/words/saveAnswersQuestion.ts
/** The question before Save answers changes the answers of `count` cards under the dimension of this name. */
export function saveAnswersQuestion(count: number, dimension: string): string;
```

- `deleteCardQuestion` must give `Delete the card "<Card>"? Its answers will be lost.`
- `deleteCategoryQuestion` must count the cards whose answer under the dimension is the category, and give `Delete the category "<Category>"? N cards' answers will be lost.` with the count in place of N, `Delete the category "<Category>"? 1 card's answer will be lost.` for one card, and `Delete the category "<Category>"?` when no card has it.
- `deleteDimensionQuestion` must give `Delete the dimension "<Dimension>"? N categories and their answers will be lost.` with the count of the dimension's categories in place of N, a count of 0 included, and `Delete the dimension "<Dimension>"? 1 category and their answers will be lost.` for one category.
- `saveAnswersQuestion` must give `Change the answers of N cards for the dimension "<Dimension>"?` with the count in place of N, and `Change the answers of 1 card for the dimension "<Dimension>"?` for one card.
- Every name stands between straight double quotes, as written above.
- This task shows none of these words on a screen; T4 and T5 show them and give them their rows of docs/vocabulary.md.

**Out of scope**

- Showing any of these words on a screen, and their rows of docs/vocabulary.md: T4 and T5.
- A question of more than one line, or one that names a deck's dimensions: never.

**Done when**

- These tests in src/words/deleteQuestion.test.ts pass:
  - `a card reads: Delete the card "<Card>"? Its answers will be lost.`
  - `a category that several cards have reads: Delete the category "<Category>"? N cards' answers will be lost.`
  - `a category that one card has reads: Delete the category "<Category>"? 1 card's answer will be lost.`
  - `a category that no card has reads: Delete the category "<Category>"?`
  - `a dimension of several categories or of none reads: Delete the dimension "<Dimension>"? N categories and their answers will be lost.`
  - `a dimension of one category reads: Delete the dimension "<Dimension>"? 1 category and their answers will be lost.`
  - the three tests of a deck's question, unchanged.
- These tests in src/words/saveAnswersQuestion.test.ts pass:
  - `several cards read: Change the answers of N cards for the dimension "<Dimension>"?`
  - `one card reads: Change the answers of 1 card for the dimension "<Dimension>"?`
- `npm run typecheck` exits with status 0.

**Debrief**

- `npx vitest run src/words --reporter=verbose` shows ✓ for the six tests of src/words/deleteQuestion.test.ts named in Done when, and ✓ for the three tests of a deck's question, whose bodies and names are unchanged; only the file's imports changed above them. The category tests build their decks with `deckAnswering`, in which every card also holds Water's id as its answer under a second dimension, Diet, so a count that read answers under any dimension but the category's own would fail. The no-card case runs both a deck whose cards have other answers and a deck with no card. The dimension test of several categories also runs a dimension of 0 categories.
- The same run shows ✓ for `several cards read: Change the answers of N cards for the dimension "<Dimension>"?` and `one card reads: Change the answers of 1 card for the dimension "<Dimension>"?` in src/words/saveAnswersQuestion.test.ts.
- `npm run typecheck` exits with status 0 and prints nothing beyond its command line.
- `npm test`: 24 test files passed, 223 tests passed.
- No departure from guidance; the Details hold no guidance for this task.
- Nothing in the code needs reading beyond the Done-when tests; each function is a few lines in src/words/deleteQuestion.ts and src/words/saveAnswersQuestion.ts.

### T3 — Fields that make cards, dimensions and categories

**Status**

- [x]

**Goal**

On the board of a deck of their own a learner makes a card by "New card" ending the pool, a dimension by "New dimension" ending the picker, which is then chosen, and a category by "New category" after the zones, reads under each field why a name is refused, and reads "Add cards and a dimension to begin" on a deck with no dimension.

**Dependencies**

- T1: `BoardActs` in src/board/Board.tsx; `forDeck` of `useDeckActs`; the dispatch of `useDeckBoard` taking a deck.

**Files**

- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/board/Pool.tsx
- src/board/Pool.css
- src/board/DimensionPicker.tsx
- src/board/DimensionPicker.css
- src/screens/DeckScreen.tsx
- src/screens/DeckScreen.test.tsx
- src/ui/NewField.css
- src/index.css
- docs/vocabulary.md

**Details**

- `Board` must take the acts as a prop and show a field only when it is given them (ADR 016):

```tsx
// src/board/Board.tsx, added to BoardProps
/** The acts that change the deck; given only for a learner's own deck. */
acts?: BoardActs;
```

- `DeckScreen` must pass `forDeck(deck)` of `useDeckActs` as `acts`. `AppDeckScreen` passes none.
- Given `acts`, `Board` must show three `NewField`s: "New card" as the last thing in the pool, after its cards; "New dimension" as the last thing in the picker, after its dimensions; and, only while a dimension is chosen, "New category" after the last zone, alone in a dashed box the size of a zone. "New dimension" and "New category" keep the field's own look, and "New card" takes, by a class, the smaller box drawing 6 shows it: its padding, its width and the card's font size. They must stand and look as drawings 1 and 6 show them, and as drawing 5 shows the first two on a deck with no card and no dimension.
- Each field's `onEnter` must call its act with the text as typed: `addCard`, `addDimension`, or `addCategory` with the chosen dimension's id. When the act refuses with `nameTaken` or `noName` it must give `refusalWords` of the refusal, with the deck's name as `held` for a card or a dimension and the chosen dimension's name for a category; otherwise it gives null (PDR 009, PDR 011).
- After `addDimension` is taken up, `Board` must dispatch `chooseDimension` for the new dimension, the last dimension of the deck the act returned, with the deck the act returned as the dispatch's second argument, so the new dimension is chosen and the board cleared in the same press (PDR 011).
- A new card must show at the end of the pool with no place given by this task: `fitBoard` puts it there (ADR 015).
- On a deck with no dimension, `Board` must show "Add cards and a dimension to begin" where it shows "Choose how to sort to begin" on a deck that has one, as drawing 5 shows it.
- The line of a refusal lies over what stands under its field, as `NewField` lays it, so the bar, the pool and the zones keep their size while it shows, and it is read over the cards under it by the background and the layer cycle 009 gave it.
- Each new size and colour of this task is a custom property in src/index.css.
- Every test of this task in src/board/Board.test.tsx but the one that gives no acts must give `Board` acts made of `vi.fn()`, each returning the result the test writes, an `ActResult` or, for `saveAnswers`, a `SaveAnswersResult`, and assert what shows and what is called (ADR 018).
- docs/vocabulary.md must hold these eight rows, each character for character. The first replaces the row of the prompt, and each of the others is added after the last row of its Area. Each row says only what is built once this task is done:

```
| Board | Prompt shown where the zones will be, before a dimension is chosen | "Choose how to sort to begin" | Where the zones will be, before a dimension is chosen, on a deck with a dimension | the prompt in `Board` in src/board/Board.tsx |
| Board | Prompt shown where the zones will be, on a deck with no dimension | "Add cards and a dimension to begin" | Where the zones will be, on a deck with no dimension | the prompt in `Board` in src/board/Board.tsx |
| Editing | New card, a field that puts a card of the typed name in the pool | "New card" | A dashed field ending the pool of a signed-in learner's own deck | the field in `Board` in src/board/Board.tsx; `addCard` of `BoardActs` in src/board/Board.tsx |
| Editing | New dimension, a field that makes a dimension of the typed name and chooses it | "New dimension" | A dashed field ending the picker under "Sort by" on a signed-in learner's own deck | the field in `Board` in src/board/Board.tsx; `addDimension` of `BoardActs` in src/board/Board.tsx |
| Editing | New category, a field that makes a zone of the typed name in the chosen dimension | "New category" | A dashed field after the zones of a signed-in learner's own deck while a dimension is chosen | the field in `Board` in src/board/Board.tsx; `addCategory` of `BoardActs` in src/board/Board.tsx |
| Editing | Refusal of a card name | "The deck "<Deck>" already has a card called "<Card>"."; "A card needs a name." | A line under the "New card" field | `refusalWords` in src/words/refusalWords.ts |
| Editing | Refusal of a dimension name | "The deck "<Deck>" already has a dimension called "<Dimension>"."; "A dimension needs a name." | A line under the "New dimension" field | `refusalWords` in src/words/refusalWords.ts |
| Editing | Refusal of a category name | "The dimension "<Dimension>" already has a category called "<Category>"."; "A category needs a name." | A line under the "New category" field | `refusalWords` in src/words/refusalWords.ts |
```

- `Board` must make each of the three fields. `Pool` and `DimensionPicker` must each take their field as a child or a prop from `Board` and show it as their last thing, so neither reads `acts`.

**Out of scope**

- The ⓘ on each dimension and on each zone's label that drawings 1, 2 and 6 show, and Delete in a panel: T4.
- The "Save answers" button that drawings 1, 2, 5 and 6 show: T5.
- The arrow back to the list of decks as drawing 6 draws it, in a control's box with padding: never; cycle 009 builds it as drawing 1 draws it, in the icon button's box.
- A separate step that asks for a deck's first dimension, or a button that turns into a field: never.
- A field, or the prompt of a deck with no dimension, on the board of the app's own deck: never; the app's own deck always has a dimension and takes no acts.
- A name refused in a panel, renaming, and the name field drawing 1 shows in the panel: an unsettled decision.
- The 2px offset drawing 6 gives the outline of the field in use: never; the field takes the app's own focus outline.

**Done when**

- These tests in src/board/Board.test.tsx pass:
  - `given no acts, the board shows no field`
  - `given acts, New card ends the pool, New dimension ends the picker and New category follows the zones only while a dimension is chosen`
  - `Enter in New card calls addCard with the text as typed`
  - `Enter in New dimension calls addDimension and dispatches chooseDimension for the new dimension with the deck the act returned`
  - `Enter in New category calls addCategory with the chosen dimension's id`
  - `a refused name shows its words under its field, naming the deck for a card or a dimension and the dimension for a category`
  - `a deck with no dimension reads Add cards and a dimension to begin`
  - `a deck with a dimension reads Choose how to sort to begin before one is chosen`
- The test `the board of a learner's deck is given the acts of the hook for that deck` in src/screens/DeckScreen.test.tsx passes.
- Every other test passes under `npm test`.
- Each of the eight rows of the Details is a line of docs/vocabulary.md.

**Debrief**

- `npx vitest run src/board/Board.test.tsx src/screens/DeckScreen.test.tsx --reporter=verbose` shows ✓ for all eight tests of src/board/Board.test.tsx named in Done when. Each test that gives acts builds them with `actsOf`, whose seven acts are `vi.fn()` returning the result the test writes. The test of the three fields' places also checks that New card follows the last card, that New dimension follows the last dimension, and that the New category box is the zones' last child. The refusal test runs `nameTaken` and `noName` for each field with Diet chosen, so a category's refusal names "Diet". It also runs a `gone` refusal of New category, which shows no line and empties the field. Breaking the code made the matching test fail, and each passed again once the code was restored: the dispatch without the deck the act returned, the prompt's check of no dimension, and the category's refusal naming the deck.
- The same run shows ✓ for `the board of a learner's deck is given the acts of the hook for that deck`. The mock of `convex/react` in src/screens/DeckScreen.test.tsx now records every mutation it sends by its function's name. The test types "Orca" into New card and reads the refusal naming "Animals", with nothing sent. It then types "Seal" and reads `decks:addCard` sent with the deck's id, a new id and "Seal". It also renders `/` and finds no text field on the board of the app's own deck. With `acts={forDeck(deck)}` removed from `DeckScreen`, the test fails.
- `npm test`: 24 test files passed, 232 tests passed. `npm run typecheck` exits with status 0.
- A Python check that reads the eight rows from the Details of this task finds each as a whole line of docs/vocabulary.md, and prints `8 True`.
- I checked the look against drawings 1, 5 and 6 in a scratch Vite page outside the repository, which rendered `Board` with fake acts in headless Chromium at 1440×900 and at 390px wide. Each field stands where the drawings show it. The prompt and the two fields of a deck with no dimension match drawing 5. Each refusal lies over what is under its field, and nothing moves. On a phone, "New card" is 44px high, like a card. The live app with sign-in was not run; that is the engineer's check.
- No departure from guidance; the Details of this task hold only constraints.
- Choices the Details leave to the builder: `Pool` and `DimensionPicker` each take their field as `children`. `Pool` takes it in its own signature rather than in `PoolProps`, so `ZoneProps`, which extends `PoolProps`, gains nothing. The classes `board-new-card` and `board-new-category` live in src/board/Board.css, since `Board` makes the fields, and `--new-card-width` is the one new size in src/index.css. The "New category" field is keyed by the chosen dimension, so a refusal naming one dimension, and its typed text, go when another dimension is chosen.
- Read `makeDimension` and `wordsOf` in src/board/Board.tsx: the first dispatches `chooseDimension` with the deck `addDimension` returned, and the second turns a result into the field's words.

### T4 — Deleting a card, a dimension or a category

**Status**

- [x]

**Goal**

On the board of a deck of their own, each dimension and each zone holds an ⓘ, the panel of a card, a dimension or a category holds Delete, and Delete asks a question naming the thing and what is lost, deleting only when the learner confirms.

**Dependencies**

- T2: `deleteCardQuestion`, `deleteCategoryQuestion` and `deleteDimensionQuestion` in src/words/deleteQuestion.ts.
- T3: `Board` taking `acts`; `DimensionPicker` and the zones as T3 leaves them.

**Files**

- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/board/DimensionPicker.tsx
- src/board/DimensionPicker.css
- src/board/Zone.tsx
- src/board/Zone.css
- src/index.css
- docs/vocabulary.md

**Details**

- Given `acts`, `Board` must show one `InfoButton` for each dimension of the picker and one for each zone's label, placed and sized as drawing 3 shows them: in the upper right corner of a dimension's box, and after the name in a zone's label. Each ⓘ stands beside its dimension's button in the markup, never inside it: the button and its ⓘ are the two children of one wrapper, as large as the button and with no border or padding of its own, against which the ⓘ is placed 3px inside the button's border at the top and at the right, where drawing 3 shows it. The button takes the room for its ⓘ, the 24px of right padding drawing 3 shows, only when the ⓘ shows. A zone's label is one row holding the element that names the zone's region, which holds the category's name alone, and after it the ⓘ, so the region's name stays the category's name. Each new size and colour of this task is a custom property in src/index.css. Given no acts, neither shows (ADR 016).
- `Board` must keep which thing is open, a card, a dimension or a category of the chosen dimension, in the state it keeps the open card in today, and render `Panel` with the thing's name as its heading while the deck holds the thing. A question open for a thing closes with its panel when the deck no longer holds the thing.
- Given `acts`, the panel of a card, of a dimension and of a category must hold one `<button type="button">` whose accessible name is "Delete", shown as the bin in the red box drawings 1 and 3 show, at the end of a row of its own under the heading, with the look cycle 009 gave Delete in src/ui/Panel.css. On a screen at most 720px wide Delete is 44px wide and high. Given no acts, a card's panel holds its heading and Close alone.
- Pressing Delete must show `Question` over the board with "Delete" as `confirm` and, as `question`, `deleteCardQuestion`, `deleteDimensionQuestion` or `deleteCategoryQuestion` of the open thing. Cancel closes the question and leaves the panel open and the deck as it is, and the focus returns to Delete in the panel, as `Question` returns it. Delete calls `deleteCard`, `deleteDimension` or `deleteCategory` of `acts` and closes the question and the panel; the task moves the focus nowhere afterwards (PDR 011).
- Guidance: the panel of a dimension or of a category, closed by Close or by the Escape key, returns the focus to the ⓘ that opened it, as a card's does through `opener` and `closePanel` in `Board`; `InfoButton` hands `onPress` the pressed ⓘ.
- The task must dispatch nothing to the board for a deletion: `fitBoard` returns a deleted category's cards to the pool, and leaves no dimension chosen with every card in the pool when the chosen dimension is deleted (ADR 015).
- docs/vocabulary.md must hold these five rows, each character for character. Each of the first three is added after the last row of its Area, and the other two replace the rows of the ⓘ and of the panel. Each row says only what is built once this task is done:

```
| Editing | Question before deleting a card | "Delete the card "<Card>"? Its answers will be lost."; "Delete"; "Cancel" | A question over the board | `deleteCardQuestion` in src/words/deleteQuestion.ts |
| Editing | Question before deleting a category | "Delete the category "<Category>"? N cards' answers will be lost."; "Delete the category "<Category>"? 1 card's answer will be lost."; "Delete the category "<Category>"?"; "Delete"; "Cancel" | A question over the board | `deleteCategoryQuestion` in src/words/deleteQuestion.ts |
| Editing | Question before deleting a dimension | "Delete the dimension "<Dimension>"? N categories and their answers will be lost."; "Delete the dimension "<Dimension>"? 1 category and their answers will be lost."; "Delete"; "Cancel" | A question over the board | `deleteDimensionQuestion` in src/words/deleteQuestion.ts |
| Editing | ⓘ, which opens the panel of a card, a dimension, a category or a deck | "ⓘ" | The upper right corner of each card; each dimension under "Sort by" and each zone's label on a signed-in learner's own deck; each deck in the list of decks | `InfoButton` in src/ui/InfoButton.tsx |
| Editing | Panel of a card, a dimension, a category or a deck, for deleting it | the name of what it opens as its heading, as "Orca"; "Delete", spoken; "Close", spoken | A panel over the board; a panel over the list of decks | `Panel` in src/ui/Panel.tsx |
```

**Out of scope**

- The name field that drawings 1 and 3 show in the panel, and renaming: an unsettled decision.
- The "Save answers" button that drawings 1 and 3 show: T5.
- The blue ring drawings 1 and 3 show around the ⓘ of the open thing: never; it marks in the drawing which ⓘ was pressed.
- The 4px margin drawing 1 gives a zone's ⓘ: never; the gap drawing 3 shows stands.
- What cycle 006 ruled out of drawing 1 stays out: the italic letter i in a bordered circle and the ⓘ with no background.
- One ⓘ for the chosen dimension and all its categories: never (PDR 011).
- Deleting at once with an Undo, or refusing to delete a category until its cards are moved out: never (PDR 011).
- An accessible name for an ⓘ other than its text: an unsettled decision.

**Done when**

- These tests in src/board/Board.test.tsx pass:
  - `given no acts, no dimension and no zone holds an ⓘ and a card's panel holds no Delete`
  - `given acts, each dimension holds an ⓘ beside its button and each zone's label holds one after the element that names the zone`
  - `the ⓘ of a dimension and of a zone each open a panel headed by its name with Delete`
  - `Delete in a card's panel asks the card's question, and confirming calls deleteCard and closes the question and the panel`
  - `Delete in a category's panel asks the question that counts its cards, and confirming calls deleteCategory with the chosen dimension`
  - `Delete in a dimension's panel asks the question that counts its categories, and confirming calls deleteDimension`
  - `Cancel closes the question and keeps the panel and calls no act`
  - `a panel closes when the deck no longer holds its thing`
- Every other test passes under `npm test`.
- Each of the five rows of the Details is a line of docs/vocabulary.md.

**Debrief**

- `npx vitest run src/board/Board.test.tsx --reporter=verbose` shows ✓ for all eight tests of src/board/Board.test.tsx named in Done when. The no-acts test runs `numbered` with Habitat chosen and the app's own deck with Check on. It finds no ⓘ in the picker or in any zone's label and no ⓘ beyond one per card, and a card's panel whose only button is Close. The category test runs `partial` under Habitat, where Forest has 2 cards ("2 cards' answers"), and `numbered` under Diet, where Carnivore has 1 ("1 card's answer"), and asserts `deleteCategory` is called with "habitat" and "dimension-2". The dimension test opens Diet while Habitat is chosen, so it asserts the id of the dimension whose ⓘ was pressed, not the chosen one. The Cancel test runs a card, a dimension and a category, and checks that Delete in the panel holds the focus afterwards. The panel test re-renders the board over a deck without Shark, without Diet, without Ocean, and without Habitat while one of Habitat's zones is open. The first, third and fourth have the question open, and each closes the panel and the question. Every test asserts that no act but the confirmed one was called and that nothing was dispatched.
- Breaking the code made the matching test fail, and each passed again once the code was restored: Delete shown without acts, confirming that leaves the panel open, `deleteCategory` given the deck's first dimension in place of the chosen one, and a panel kept for a thing the deck no longer holds.
- `npm test`: 24 test files passed, 240 tests passed. `npm run typecheck` exits with status 0.
- A Python check that reads the five rows from the Details of this task finds each as a whole line of docs/vocabulary.md, and prints `5 True`.
- I changed one assertion of the T3 test `given acts, New card ends the pool, New dimension ends the picker and New category follows the zones only while a dimension is chosen`. The element before New dimension is now the wrapper holding Diet's button and its ⓘ, so the test asserts that this element contains the button. Before, it asserted that the element was the button. Its name is unchanged.
- I checked the look against drawing 3 in a scratch Vite page outside the repository, which rendered `Board` with fake acts in headless Chromium at 1440×900 and at 390px wide. In the browser, a dimension's wrapper is exactly its button's size and the button has 24px right padding. The ⓘ is 13px and stands 4px from the button's outer edge at the top and right, 3px inside its 1px border. A zone's ⓘ stands 6px after the name. Delete is 36px at 1440px wide and 44px at 390px. The live app with sign-in was not run; that is the engineer's check.
- A finding for the engineer, outside this task's Files: on this machine the ⓘ character comes from Adwaita Mono, which draws it as a pill taller than the 13px white circle `InfoButton` gives it, and lower. On a card or an unpressed dimension this does not show. On the chosen dimension, whose button is dark, the lower half of the pill disappears against the button and the ⓘ reads as a white arch. The look of the ⓘ is src/ui/InfoButton.css, from cycle 009, so I left it as it is.
- No departure from guidance. The panel of a dimension or a category returns the focus to its ⓘ on Close and on Escape, through `opener` and `closePanel`, as the guidance says.
- Choices the Details leave to the builder: the ⓘ reaches `DimensionPicker` as the prop `onOpen` and `Zone` as `onOpenCategory`, each shown only when given, so neither reads `acts`. Each dimension's button stands in its wrapper `picker-item`, with or without acts, and takes the class `picker-dimension-info` for its padding only when the ⓘ shows. `--dimension-padding-info` is the one new size in src/index.css; the zone label's gap is the existing `--gap-small`. The bin of Delete is a copy of the one in `DeckListScreen`, which is outside this task's Files.
- Read `panelOf` and `confirmDelete` in src/board/Board.tsx. `panelOf` turns the open thing into the panel's heading, its question and the act that deletes it. It returns undefined once the deck no longer holds the thing, which closes the panel and the question. It finds a category only in the chosen dimension.

### T5 — Save answers and its question

**Status**

- [x]

**Goal**

On the board of a deck of their own a learner presses "Save answers" to make the category of the zone each card lies in that card's answer under the chosen dimension, at once when no existing answer changes and after a question naming how many when one or more would.

**Dependencies**

- T1: `saveAnswers` of `BoardActs`.
- T2: `saveAnswersQuestion` in src/words/saveAnswersQuestion.ts.
- T4: `Board` with its panels and questions.

**Files**

- src/board/board.ts
- src/board/board.test.ts
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/index.css
- docs/vocabulary.md

**Details**

- src/board/board.ts must gain these two pure functions, each taking a board that fits the deck:

```ts
/** The answer each card in a zone would get: its card id and its zone's category id, in the board's order. */
export function answersOnBoard(
  board: BoardState,
): { card: string; category: string }[];

/** How many cards in a zone have an answer under the chosen dimension that is not their zone's category. */
export function answersChanged(board: BoardState, deck: Deck): number;
```

- Given `acts`, `Board` must show a `<button type="button">` reading "Save answers" in the bar after the score and before the account, filled as drawing 1 shows it. Its fill and its text take the colours a pressed control has in src/index.css, and the task adds no colour. It is never disabled. Given no acts, it does not show (PDR 010, ADR 016).
- A press on "Save answers" while no dimension is chosen or no card lies in a zone must call nothing.
- Otherwise, when `answersChanged` gives 0, the press must call `saveAnswers` of `acts` with the chosen dimension's id and `answersOnBoard` at once. When it gives 1 or more, the press must show `Question` over the board with `saveAnswersQuestion` of that count and the chosen dimension's name as `question` and "Save answers" as `confirm`; Cancel closes the question and calls nothing, and "Save answers" in the question calls `saveAnswers` the same way and closes the question (PDR 010). The dimension and the pairs are read when the learner confirms, from the board as it is then; when by then no dimension is chosen or no card lies in a zone, confirming calls nothing and closes the question.
- Guidance: when the question closes, by Cancel or by its "Save answers", the focus returns to the bar's "Save answers" button, as `Question` returns it.
- Save answers must leave the board as it is: every card stays where it lies, and a card in the pool is in no pair, so its answer stays as it was (PDR 010).
- On a screen at most 720px wide "Save answers" is at least 44px high, as Reset is, and at every width it shows the focus outline every other control shows when the keyboard focuses it.
- The checks of the cycle's Judgement that need a browser, a second device or the engineer's accounts are the engineer's. The builder's evidence for the Judgement is the tests this cycle names, and its Debrief says so.
- docs/vocabulary.md must hold these two rows, each character for character, each added after the last row of its Area:

```
| Board | Save answers, which makes the category of the zone each card lies in that card's answer under the chosen dimension | "Save answers" | A button at the top of the board of a signed-in learner's own deck | `saveAnswers` of `BoardActs` and the Save answers button in `Board` in src/board/Board.tsx; `answersOnBoard` in src/board/board.ts |
| Board | Question before Save answers changes existing answers | "Change the answers of N cards for the dimension "<Dimension>"?"; "Change the answers of 1 card for the dimension "<Dimension>"?"; "Save answers"; "Cancel" | A question over the board | `saveAnswersQuestion` in src/words/saveAnswersQuestion.ts; `answersChanged` in src/board/board.ts |
```

**Out of scope**

- A form that sets a card's answer by choosing it, or a way to clear an answer: never (PDR 010).
- Saving at once with an Undo, or a card in the pool losing its answer: never (PDR 010).
- "Save answers" on the board of the app's own deck: never (PDR 010).
- A line for an answer not kept: a later cycle.
- The name field that drawing 1 shows in the panel: an unsettled decision.

**Done when**

- These tests in src/board/board.test.ts pass:
  - `answersOnBoard pairs each card in a zone with its zone's category, in the board's order, and leaves out the pool`
  - `answersChanged counts the cards in a zone whose answer is another category, and no card without an answer or in the pool`
- These tests in src/board/Board.test.tsx pass:
  - `given no acts, the board shows no Save answers`
  - `Save answers calls saveAnswers at once when it changes no existing answer`
  - `Save answers asks how many cards' answers change, and calls saveAnswers only once the learner confirms`
  - `Cancel in the question calls nothing`
  - `Save answers calls nothing while no dimension is chosen or no card lies in a zone`
- Every other test passes under `npm test`.
- Each of the two rows of the Details is a line of docs/vocabulary.md.
- `npm run build` exits with status 0.

**Debrief**

- `npx vitest run src/board/board.test.ts --reporter=verbose` shows ✓ for `answersOnBoard pairs each card in a zone with its zone's category, in the board's order, and leaves out the pool` and `answersChanged counts the cards in a zone whose answer is another category, and no card without an answer or in the pool`. The second runs Diet over Frog's deck, with Shark and Wolf, both carnivores, in Herbivore, Deer, a herbivore, in Herbivore, Frog, with no Diet answer, in Herbivore, and Whale, a carnivore, in the pool. The count is 2. It also counts 3 on a Habitat board where only Shark lies in its answer's zone, and 0 with no dimension chosen, with every card in the pool, and with every card in a zone in its answer's zone. I also added both functions to the existing test `no function changes the state, the action, the board or the deck it is given`, whose name is unchanged.
- `npx vitest run src/board/Board.test.tsx --reporter=verbose` shows ✓ for all five tests of src/board/Board.test.tsx named in Done when. They build the boards of `partial` by hand, with Habitat chosen and a fixed order of cards. The test of saving at once runs with Check off and on. It puts Platypus, which has no answer, in a zone, so a card with no answer changes nothing and asks nothing. It also checks that the button is a `type="button"`, is enabled, follows the score and comes before what `account` shows. The test of the question runs 2 cards and 1 card. While the question shows, it renders the board again with Owl moved back to the pool, then confirms, and asserts that the pairs sent leave Owl out, so they are read at confirmation. The test that nothing is called runs no dimension chosen and every card in the pool, both from a press and from a question open when the board changes to either. Every test asserts that nothing was dispatched, so the board stays as it is.
- Breaking the code made the matching test fail, and each passed again once the code was restored: confirming with no card in a zone, asking even when no answer changes, a question that stays open after confirming, counting a card with no answer, and putting cards in the pool in the pairs.
- `npm test`: 24 test files passed, 247 tests passed. `npm run typecheck` exits with status 0.
- A Python check that reads the two rows from the Details of this task finds each as a whole line of docs/vocabulary.md, and prints `2 True`.
- `npm run build` exits with status 0. It prints the chunk-size warning it printed before this task.
- I checked the look against drawing 1 in a scratch Vite page outside the repository. It rendered `Board` over the app's own deck with fake acts, in headless Chromium. At 1440×900, "Save answers" stands after "2 of 3 correct" and before the account. It has the fill rgb(31, 35, 40), white text, a border of the fill's colour, 6px 12px padding, a radius of 6px and a height of 34px, the same as Reset. At the narrowest width headless Chromium allows, 500px, it is 44px high, as Reset is. Focused by the keyboard at both widths, it shows the 3px solid rgb(47, 111, 209) outline at a 5px offset that the other controls show. Pressed with one answer changing, it shows `Change the answers of 1 card for the dimension "Habitat"?` with "Save answers" and "Cancel".
- The cycle's Judgement needs a signed-in browser, `npx convex dev` and the engineer's accounts, so those checks are the engineer's. My evidence for the Judgement is the tests this cycle names, all passing under `npm test` above. The live app with sign-in was not run.
- No departure from guidance. When the question closes, the focus returns to the bar's "Save answers", as `Question` returns it. The tests of the question and of Cancel assert this.
- Choices the Details leave to the builder: "Save answers" takes the existing class `board-action`, for its box, its 44px on a phone and its focus outline, and adds `board-save` in src/board/Board.css for the pressed colours. The task adds no custom property. The question's words are fixed when the learner presses, so its count is the count at the press. The dimension and the pairs are still read when the learner confirms.
- Read `pressSave` and `save` in src/board/Board.tsx. The first saves at once or opens the question. The second reads the board when it runs and sends nothing when no dimension is chosen or no card lies in a zone.
