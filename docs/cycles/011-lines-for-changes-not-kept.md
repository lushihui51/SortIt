# 011 — Lines for changes not kept

Waits for: 005, `Deck` in convex/model/deck.ts; 006, `BoardsProvider` in src/board/BoardsProvider.tsx and the board's files under src/board/; 007, `Refusal`, `LeftOut` and `Kind` in convex/model/deckActs.ts and the values the mutations of convex/decks.ts return; 008, no interface but through 009 and 010, and the files this cycle's tasks list that it lists, which this cycle takes as 010 leaves them; 009, `App` in src/App.tsx with the router it renders, `AppRoutes` in src/routes/AppRoutes.tsx and its test, `AppDeckScreen` in src/screens/AppDeckScreen.tsx, `DeckNotOpenedProvider` and `useDeckNotOpened` in src/screens/DeckNotOpened.tsx, `SignedInOnly` in src/routes/SignedInOnly.tsx and its test, `DeckListScreen` in src/screens/DeckListScreen.tsx with its line for a deck that cannot be opened, its styles and its test, and `refusalWords` in src/words/refusalWords.ts; 010, `useDeckActs` with `forDeck` in src/decks/useDeckActs.ts and its test, `Board`, `BoardProps` and `BoardActs` in src/board/Board.tsx, `DeckScreen` in src/screens/DeckScreen.tsx and its test, and every other file this cycle's tasks list that an earlier cycle lists, docs/vocabulary.md, src/index.css, src/board/Board.css and src/board/Board.test.tsx among them, as 010 leaves it

Canvas: https://claude.ai/artifact/83To5MxpQpttenpuCaoTMh

## Goal

Outcome: A learner reads a line at the top of the board or of the list while any change is not yet kept, and, for each change kept late that no longer fits, a line naming what was not kept and why, with the screen returned to the deck as kept.

Scope: The cycle covers the words of the line for each change not kept as one pure function, the hook keeping what each act touched when it was sent and turning each refusal and each id left out that a mutation returns into lines, the set of things whose making was refused, the lines shown at the top of the board and of the list until the learner leaves that screen, and the line shown while Convex reports a mutation in flight. It leaves out the line for a rename not kept, a line for a change lost because its deck was deleted or Convex refused the write, and what the learner meets when the deck they are on is deleted from another device.

Judgement: The engineer runs `npx convex dev` and `npm run dev`, signs in in two browsers and opens one deck in both. In the first, with the network cut in the browser's tools, the engineer adds a card: it shows at once, and the line "Your changes are not saved yet. Keep this page open." stands at the top of the board. In the second browser the engineer adds a card of the same name. With the network back in the first, the waiting line goes, the card added there goes with the second browser's card of that name showing in its place, so that one card of the name stands and not two, and a line in the box drawing 9 shows reads that the new card was not kept and that the deck already has a card of that name. The line stays while the engineer sorts, and is gone after going to the list and back. The engineer repeats it with a category deleted in the second browser while a Save answers waits in the first, and reads one line for the category and none for its cards. The exact words of every line for a change not kept are proven by the tests T1 names, and those of the waiting line by the tests T4 names.

## Records

- PDR 009: Rules each deck must meet, with an error for the app's own deck and a refused name for a learner's
- PDR 014: Changes shown at once and kept when the connection returns, with a change that no longer fits named and left out
- PDR 015: An address for the list and each deck, opening sign-in or the list when the deck cannot be opened
- ADR 009: Convex for keeping the learners' decks, with one helper checking each deck's owner
- ADR 011: One Convex document per deck, changed by one pure act run on the device and in the mutation
- ADR 012: Late changes refused as the mutation's value, Save answers kept in part, and one hook naming what was not kept
- ADR 016: The board as a view of a deck, its board and its acts, with Convex and Clerk kept out of it
- ADR 017: React Router for the addresses, with the list and each deck behind one guard waiting on Convex
- ADR 018: Vitest in four kinds, unit, component in jsdom, Convex functions under convex-test and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Words of the lines for a change not kept

**Status**

- [ ]

**Goal**

One pure function gives, from what an act touched when it was sent and what its mutation returned, the lines the learner reads for what was not kept and why, and the things to remember as never made.

**Dependencies**

None.

**Files**

- src/decks/notKept.ts, new
- src/decks/notKept.test.ts, new

**Details**

- src/decks/notKept.ts must export exactly this and import nothing but types of convex/model/deckActs.ts and `refusalWords` of src/words/refusalWords.ts (ADR 012):

```ts
/** A thing an act touches, with its name as the deck held it when the act was sent. */
export type Thing = { kind: Kind; id: string; name: string };

/** What the hook keeps of an act when it sends it. */
export type SentAct = {
  /** Whether the act makes its subject or changes it. */
  making: boolean;
  /** The thing the act makes or changes, which its line names. */
  subject: Thing;
  /** Every other thing the act rests on: its deck, and the dimension of a category. */
  others: Thing[];
  /** The name of what holds the subject's name: the deck for a card or a dimension, the dimension for a category; null for a deck. */
  held: string | null;
  /** For Save answers alone: the card and the category of each pair sent. */
  answers?: { card: Thing; category: Thing }[];
};

export type NotKept = {
  /** The lines to show, in order. */
  lines: string[];
  /** The ids to add to the things whose making was refused. */
  notMade: string[];
};

/**
 * The lines for what a mutation returned. `notMade` holds the ids of the things
 * whose making was refused so far; `laterChanged` tells whether the hook has
 * sent a later act that touches the subject.
 */
export function linesFor(
  sent: SentAct,
  returned: Refusal | LeftOut,
  notMade: ReadonlySet<string>,
  laterChanged: boolean,
): NotKept;
```

- The comments in the block above tell the builder what a name means and are no part of what the file must hold.
- For Save answers the subject is the dimension and `making` is false.
- A line is two sentences joined by one space: what was not kept, then why (PDR 014).
- What was not kept must read, with the subject's kind as the word `deck`, `card`, `dimension` or `category` and its name between straight double quotes:
  - a making: `Your new <kind> "<Name>" was not kept.`, or `Your new <kind> "<Name>" and your later changes to it were not kept.` when `laterChanged` is true;
  - any other act: `Your change to the <kind> "<Name>" was not kept.`
- Why must read:
  - for a refusal `nameTaken`: `refusalWords` of the refusal with `sent.held`, or with no second argument when `sent.held` is null;
  - for a refusal `gone` whose id is the subject's, or is neither the subject's nor one of `others`: `It was deleted on another device.`;
  - for a refusal `gone` whose id is one of `others`: `The <kind> "<Name>" was deleted on another device.`, with that thing's kind and its name.
- For a refusal `noName`, which the device gives before anything is sent and no mutation returns late, `linesFor` must give no line and add nothing.
- For a refusal `nameTaken` or `gone`, `linesFor` must give one line, and add the subject's id to `notMade` when `making` is true. When the refusal is `gone` and its id is in the `notMade` it was given, it must give no line and still add the subject's id when `making` is true (ADR 012).
- For a `LeftOut`, `linesFor` must give, first, one line for each category left out whose id is not in `notMade`: `Your answers in the category "<Category>" were not kept. It was deleted on another device.`; then one line for each card left out whose id is not in `notMade` and whose pair's category is not left out: `Your answer for the card "<Card>" was not kept. It was deleted on another device.` Each follows the order `returned` gives the ids, takes its name from `sent.answers`, and adds nothing to `notMade` (ADR 012). Where `sent.answers` holds a card more than once, which the board never sends, the card's last pair is the one read, as the act lets a card's last entry stand.
- A `LeftOut` with no id gives no line.
- `linesFor` changes nothing it is given.
- This task shows none of these words on a screen; T3 shows them and gives them their row of docs/vocabulary.md.

**Out of scope**

- The line for a rename not kept, `Renaming the <kind> "<Name>" to "<New name>" was not kept.`: an unsettled decision; the hook sends no rename yet.
- Keeping `SentAct`s, sending anything, or showing a line: T2 and T3.
- One line for all changes, a line without its reason, or one line per card of a deleted category: never.
- A line for a later change to a thing never made that says it was deleted on another device: never (ADR 012).

**Done when**

- These tests in src/decks/notKept.test.ts pass:
  - `a new card whose name was taken reads: Your new card "<Card>" was not kept. The deck "<Deck>" already has a card called "<Card>".`
  - `a new dimension, a new category and a new deck whose name was taken each read their kind and the refusal of their name`
  - `a making with later changes reads: Your new <kind> "<Name>" and your later changes to it were not kept.`
  - `a new category whose dimension was deleted reads: Your new category "<Category>" was not kept. The dimension "<Dimension>" was deleted on another device.`
  - `deleting a card, a dimension or a category already deleted reads: Your change to the <kind> "<Name>" was not kept. It was deleted on another device.`
  - `deleting a category whose dimension was deleted names the dimension as deleted`
  - `a Save answers whose dimension was deleted reads: Your change to the dimension "<Dimension>" was not kept. It was deleted on another device.`
  - `a Save answers kept in part gives one line for each category left out, then one for each card left out whose category was kept`
  - `a refusal or an id left out whose fault is a thing never made gives no line`
  - `a making refused, with a line or without, adds its subject to the things never made`
  - `a LeftOut with no id gives no line`
  - `a refusal noName gives no line`
  - `a refusal gone for an id the act did not declare reads as its subject deleted`
  - `linesFor changes nothing it is given`
- `npm run typecheck` exits with status 0.

**Debrief**

None.

### T2 — Hook that keeps what it sends and gives the lines

**Status**

- [ ]

**Goal**

The hook keeps, for each act it sends, what the act touched as the deck held it then, turns what each mutation returns into lines through `linesFor`, keeps the set of things never made until a reload, and hands the lines to the screen that is showing until the learner leaves it.

**Dependencies**

- T1: `Thing`, `SentAct`, `NotKept` and `linesFor` in src/decks/notKept.ts.

**Files**

- src/decks/useDeckActs.ts
- src/decks/useDeckActs.test.tsx
- src/decks/NotKeptProvider.tsx, new
- src/decks/NotKeptProvider.test.tsx, new
- src/routes/AppRoutes.tsx

**Details**

- The task must create these interfaces (ADR 012):

```tsx
// src/decks/NotKeptProvider.tsx
/** Holds, in memory alone, every act sent in order, the ids of the things never made, and the lines for changes not kept. It must be rendered inside the router. */
export function NotKeptProvider(props: { children: ReactNode }): ReactElement;

/** The lines the screen that calls it shows, oldest first. Only the board's screens and the list of decks call it. */
export function useNotKeptLines(): string[];

/** For the hook alone. `send` records an act as sent; the `settle` it returns takes what the act's mutation returned, or null when it returned null or threw. */
export function useNotKept(): {
  send(sent: SentAct): { settle(returned: Refusal | LeftOut | null): void };
};
```

- `AppRoutes` must render `NotKeptProvider` around everything it renders, its routes and whatever it renders in their place while it replaces the address for a segment that ends in no code alike, so that the provider stays mounted until a reload. Outside a `NotKeptProvider`, `useNotKept` must give a `send` whose `settle` does nothing and `useNotKeptLines` must give no line, so that a screen tested without the provider works as before. The task changes no test of the routes: T3's tests of the screens, which render `AppRoutes`, show the provider in place.
- Every act of `useDeckActs`, `deleteDeck` left out, must build its `SentAct` from the deck or the decks it applied the act to and call `send` with it before sending: the subject with its kind and name, `others` holding the deck for an act on a deck's things and the dimension for an act on a category, `held`, and for Save answers each pair's card and category with their names. The subject of an act that makes a thing bears the name the act gave it, trimmed, as the deck the act returned holds it (ADR 012).
- When the mutation resolves, the hook must call `settle` with the `Refusal` or the `LeftOut` it resolved with, and with null when it resolved with null or threw.
- `settle` with a `Refusal` or a `LeftOut` must call `linesFor` with the act's `SentAct`, the value, the things never made as they stand at that moment, and whether any act sent after this one holds the id of this act's subject as its subject, among its `others` or in its `answers`. It must then add the lines it gives to the lines shown and the ids it gives to the things never made. `settle` with null adds nothing (ADR 012).
- The acts sent and the things never made are the provider's, shared by every screen that sends an act, and must last until a reload; a change of screen clears neither.
- A line must show on the screen that calls `useNotKeptLines` when the line arises, or, when no screen calls it at that moment, on the next screen that does. Once a screen has shown it, it must stay until the learner next moves to another path by a change that adds an entry to the browser's history or moves along it, and be gone for good after that; a move made before any screen has shown the line takes nothing away. A replacement of the current entry by the app, as the deck's own address or the list for a deck that cannot be opened, takes no line away (PDR 014).
- The deck's screen and the list of decks do not call `useNotKeptLines` yet; T3 has them call it. A call of the hook is a showing: T3 has a screen call it only where the screen draws the lines it is given.
- src/decks/NotKeptProvider.test.tsx must render the provider inside `MemoryRouter`. The new tests of src/decks/useDeckActs.test.tsx mock `convex/react`, render the hook inside the provider inside `MemoryRouter`, and give each mutation the value its test names.

**Out of scope**

- Showing a line on the board or on the list: T3.
- Comparing the kept deck with the device's to find what was left out, or withdrawing an act already sent: never (ADR 012).
- A line for a mutation that throws, as for a deck deleted on another device: never; no decision gives its words.
- A cross on a line, or a line that fades by itself: never.

**Done when**

- These tests in src/decks/NotKeptProvider.test.tsx pass:
  - `a line shows on the screen that is showing when it arises`
  - `a line that arises while no screen shows lines shows on the next screen that does`
  - `a line stays while the path stays, stays when the app replaces the address, and is gone once the learner has moved to another path`
  - `outside the provider no line shows and settling does nothing`
  - `the things never made and the acts sent outlast a change of path`
  - `a making refused after a later act on its subject was sent, from any screen, gives the line that names the later changes`
- These tests in src/decks/useDeckActs.test.tsx pass:
  - `a mutation that returns a refusal adds the line linesFor gives for what the act touched when it was sent`
  - `the names of a line are the deck's when the act was sent, not when its mutation returned`
  - `a Save answers that returns ids left out adds a line for each`
  - `a later act on a thing whose making was refused adds no line`
  - `the subject of a making bears its trimmed name`
  - `a mutation that returns null or throws adds no line`
- Every other test passes under `npm test`, and `npm run typecheck` exits with status 0.

**Debrief**

None.

### T3 — Lines at the top of the board and of the list

**Status**

- [ ]

**Goal**

A learner reads each line for a change not kept at the top of the board or of the list of decks, in the box drawing 9 shows, until they leave that screen, and the line for a deck that cannot be opened takes the same box.

**Dependencies**

- T2: `useNotKeptLines` in src/decks/NotKeptProvider.tsx.

**Files**

- src/ui/Notice.tsx, new
- src/ui/Notice.css, new
- src/ui/Notice.test.tsx, new
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/screens/DeckScreen.tsx
- src/screens/DeckScreen.test.tsx
- src/screens/AppDeckScreen.tsx
- src/screens/DeckListScreen.tsx
- src/screens/DeckListScreen.css
- src/screens/DeckListScreen.test.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create or change these interfaces (ADR 016):

```tsx
// src/ui/Notice.tsx
/** One line at the top of a screen. */
export default function Notice(props: { children: ReactNode }): ReactElement;

// src/board/Board.tsx, added to BoardProps
/** Shown between the bar and the pool. */
notices?: ReactNode;
```

- `Notice` must render an element with `role="status"` holding the icon and the line as drawing 9 shows them: the box with its background, border, radius, padding and gap, and the icon's size and colour, each a custom property in src/index.css. The sizes src/index.css already holds take its properties: `--border-width` for the border's 1px, `--card-radius` for the radius's 6px, `--icon-size` for the icon's 18px, and `--region-padding` and `--board-padding` for the padding's 8px and 12px. The gap's 10px and each colour are new properties. The icon is hidden from assistive technology.
- `DeckScreen` and `AppDeckScreen` must each pass, as `notices`, one `Notice` for each line `useNotKeptLines` gives, oldest first. `DeckListScreen` must show them at its top under the bar, after its line for a deck that cannot be opened. A screen must call `useNotKeptLines` only where it draws the lines the hook gives, never while it renders nothing, so that a line counts as shown only once the learner can read it. Guidance: each screen calls the hook in a component of its own file that it renders once it has its content.
- The line "This deck cannot be opened. It may have been deleted, or belong to another account." of `DeckListScreen` must now be a `Notice`, in place of the paragraph it is today, with its words and its rule for going away unchanged. The rule of src/screens/DeckListScreen.css that styled that paragraph goes, no element using it. Its test tells the `Notice` from the paragraph by the icon, which the paragraph did not hold.
- The tests of this task in src/screens/DeckScreen.test.tsx and src/screens/DeckListScreen.test.tsx must render `AppRoutes`, which holds `NotKeptProvider` and `DeckNotOpenedProvider`, inside `MemoryRouter` and `BoardsProvider`, with `convex/react` and `@clerk/react` mocked, and must raise each line for a change not kept by a mocked mutation that resolves with a refusal: for the board, an act made on a deck's board whose mutation resolves while that board shows; for the list, an act made on a deck's board whose mutation resolves once the list shows. No test of this task mocks src/decks/NotKeptProvider.tsx or calls `useNotKept`.
- Guidance: the list's test gets both lines by leaving an act waiting on one deck's board, then moving to the address of a deck the mocked `api.decks.get` gives null for, which brings the list with its line, and only then resolving the waiting mutation.
- Several lines stack, each in a `Notice` of its own, with the board's gap between them. On the list each `Notice` is as wide as the list; the 12px stand between the bar and the first notice, and the gap between two decks stands between two notices and between the last notice and the list.
- docs/vocabulary.md must hold this row, character for character, added as the table's last row. It says only what is built once this task is done:

```
| Saving | Line naming a change kept late that was not kept | "Your new <kind> "<Name>" was not kept."; "Your new <kind> "<Name>" and your later changes to it were not kept."; "Your change to the <kind> "<Name>" was not kept."; "Your answer for the card "<Card>" was not kept."; "Your answers in the category "<Category>" were not kept."; "It was deleted on another device."; "The <kind> "<Name>" was deleted on another device."; the refusals of a deck name, a card name, a dimension name and a category name for a name taken | A line at the top of the board or of the list of decks, until the learner leaves that screen | `linesFor` in src/decks/notKept.ts; `useNotKeptLines` in src/decks/NotKeptProvider.tsx; `Notice` in src/ui/Notice.tsx |
```

**Out of scope**

- The line while changes are not yet kept: T4.
- Everything drawing 9 shows but the line and its box: it is built, but for what earlier cycles ruled out of the drawings, which stays out: the italic letter i in a bordered circle, the ⓘ with no background, and the 4px margin of a zone's ⓘ.
- A box over the board naming what was not kept, or the typed name put back in its field with the refusal under it: never (PDR 014).
- A call of `useNotKeptLines`, of Convex or of anything under src/decks/ from a file under src/board/: never (ADR 016).

**Done when**

- The test `Notice shows its line with role status and an icon hidden from assistive technology` in src/ui/Notice.test.tsx passes.
- The test `shows what it is given as notices between the bar and the pool` in src/board/Board.test.tsx passes.
- These tests in src/screens/DeckScreen.test.tsx pass:
  - `a line for a change not kept shows at the top of the deck's board`
  - `the line is gone after the learner goes to the list and opens the deck again`
- These tests in src/screens/DeckListScreen.test.tsx pass:
  - `a line for a change not kept shows at the top of the list, after the line for a deck that cannot be opened`
  - `the line for a deck that cannot be opened is a notice`
- Every other test passes under `npm test`.
- The row of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T4 — Line while changes are not yet kept

**Status**

- [ ]

**Goal**

A learner reads "Your changes are not saved yet. Keep this page open." at the top of the board or of the list of decks for as long as Convex reports a mutation in flight.

**Dependencies**

- T3: `Notice` in src/ui/Notice.tsx; the `notices` prop of `Board`; `DeckScreen`, `AppDeckScreen` and `DeckListScreen` showing their lines.

**Files**

- src/decks/useChangesWaiting.ts, new
- src/decks/useChangesWaiting.test.tsx, new
- src/screens/DeckScreen.tsx
- src/screens/DeckScreen.test.tsx
- src/screens/AppDeckScreen.tsx
- src/screens/DeckListScreen.tsx
- src/screens/DeckListScreen.test.tsx
- src/routes/SignedInOnly.test.tsx
- src/routes/AppRoutes.test.tsx
- docs/vocabulary.md

**Details**

- The task must create this hook (ADR 009):

```ts
// src/decks/useChangesWaiting.ts
/** Whether Convex's client reports a mutation in flight. */
export function useChangesWaiting(): boolean;
```

- `useChangesWaiting` must read what Convex's own client reports of its mutations in flight, and keep no count of its own. Guidance: the connection state of Convex's React client tells it.
- The mock of `convex/react` in each test file that renders one of the three screens, src/routes/SignedInOnly.test.tsx and src/routes/AppRoutes.test.tsx among them, must give the hook what it reads, reporting no mutation in flight unless its test says otherwise.
- The checks of the cycle's Judgement that need a browser, a second device or the engineer's accounts are the engineer's. The builder's evidence for the Judgement is the tests this cycle names, and its Debrief says so.
- While `useChangesWaiting` gives true, `DeckScreen`, `AppDeckScreen` and `DeckListScreen` must each show one `Notice` reading "Your changes are not saved yet. Keep this page open.", before the lines for changes not kept and, on the list, after the line for a deck that cannot be opened. It goes the moment the hook gives false (PDR 014).
- docs/vocabulary.md must hold this row, character for character, added after the last row of its Area:

```
| Saving | Line while changes are not yet kept | "Your changes are not saved yet. Keep this page open." | A line at the top of the board or of the list of decks while changes are not yet kept | `useChangesWaiting` in src/decks/useChangesWaiting.ts; `Notice` in src/ui/Notice.tsx |
```

**Out of scope**

- Keeping a change that waits when the learner closes the page, or asking before the page closes: never (PDR 014).
- Locking the deck, or reloading the page, when the connection returns: never (PDR 014).
- A delay before the line shows, or words that say the connection is lost: never; the line shows for as long as a mutation is in flight.

**Done when**

- The test `useChangesWaiting follows what Convex's client reports of mutations in flight` in src/decks/useChangesWaiting.test.tsx passes.
- These tests pass, one in src/screens/DeckScreen.test.tsx and one in src/screens/DeckListScreen.test.tsx:
  - `the board shows the waiting line while a change is not yet kept, before the lines for changes not kept, and not otherwise`
  - `the list shows the waiting line while a change is not yet kept, and not otherwise`
- Every other test passes under `npm test`.
- The row of the Details is a line of docs/vocabulary.md.
- `npm run build` exits with status 0.

**Debrief**

None.
