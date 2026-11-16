# 009 — Deck list and addresses

Waits for: 005, `Deck` in convex/model/deck.ts; 006, `BoardsProvider` and `useDeckBoard` in src/board/BoardsProvider.tsx, `Board` and `BoardProps` in src/board/Board.tsx, `Card` in src/board/Card.tsx with src/board/Card.css, and `Panel` in src/ui/Panel.tsx with src/ui/Panel.css, as it leaves them; 007, the queries `list` and `get` and the mutations `createDeck` and `deleteDeck` of convex/decks.ts, and `createDeck`, `ActResult` and `Refusal` in convex/model/deckActs.ts; 008, `App` and `stayOnPage` in src/App.tsx, `Account` in src/account/Account.tsx and its tests, `AppDeckScreen` in src/screens/AppDeckScreen.tsx, the `account` prop of `Board`, and every other file this cycle's tasks list that an earlier cycle lists, package.json, package-lock.json, docs/vocabulary.md, src/index.css, src/board/Board.css and src/board/Board.test.tsx among them, as the last of those cycles leaves it

Canvas: https://claude.ai/artifact/AgFMPvjzHiWy4Ypf49DNqb

## Goal

Outcome: A signed-in learner reaches their list of decks at its own address, makes a deck by "New deck", opens each deck's board at an address of its name and code, deletes a deck from its panel after a question, and finds each board as they left it when they come back to it from the list or by Back and Forward; signed out, either address shows the app's own deck with the sign-in form open, and a deck that cannot be opened brings the list with a line saying so.

Scope: The cycle covers React Router with the three addresses, the copy of index.html to 404.html, the making and reading of a deck's address, the hook that sends an act on the learner's decks with its optimistic update, the guard `SignedInOnly`, the sign-in form opened by an address with its close observed and reported, the list of decks with its "New deck" field and its refusals, the screen of a learner's deck with the arrow back to the list, the line for a deck that cannot be opened, and the deletion of a deck from its panel after a question. It leaves out the copy of the app's own deck that starts a learner's list, renaming a deck, every act on a card, a dimension or a category, Save answers, and the lines for changes not yet kept or not kept.

Judgement: The engineer runs `npx convex dev` and `npm run dev`, signs in, and presses the arrow on the board of the app's own deck: the list of decks shows at `/decks` with the account button. Typing a name into "New deck" and pressing Enter opens the new deck's empty board at `/decks/<name>-<code>`; a name already used, and an empty name, each show their refusal under the field, which keeps what was typed. The browser's Back returns to the list and Forward to the deck. On the board of the app's own deck the engineer chooses a dimension and places cards, goes to the list by the arrow, comes back by Back, and finds the board as they left it. A deck made in this cycle holds no card, so the engineer reads in T4's Debrief the test that a deck's board keeps its chosen dimension when it is opened again from the list; a reload of a deck's address shows the same deck. The ⓘ of a deck opens its panel, Delete asks the question naming the deck, which for a deck with no card reads `Delete the deck "<Deck>"?`, Cancel keeps the deck and Delete removes it; the question's words for a deck with cards are proven by the tests T6 names. Opening the address of the deleted deck brings the list with the line that the deck cannot be opened, which is gone after a reload. Signed out, `/decks` and a deck's address each show the board of the app's own deck dimmed, with the sign-in form centred over it and the address unchanged; closing the form, by a press on the dimmed board, by the Escape key and by its cross, each ends at `/`, and signing in from the form shows what the address names and never `/`. "Sign out" on the list of decks brings the board of the app's own deck at `/`, Back then shows the sign-in form again, and Forward then shows the board at `/` with no form over it, usable and scrolling. After `npm run build`, dist/404.html is a copy of dist/index.html.

## Records

- PDR 001: Current desktop browsers and portrait phones as the served devices
- PDR 008: Cards moved by dragging alone, opening in panels
- PDR 009: Deck rules with an error or a refusal
- PDR 011: Fields for making, panels for changing and deleting
- PDR 012: A list of decks starting with a copy
- PDR 013: Accounts keeping a learner's decks on every device
- PDR 014: Changes shown at once, kept when back online
- PDR 015: An address for the list and each deck
- ADR 007: One shape keyed by ids for every deck
- ADR 008: Clerk and its own modal for signing in
- ADR 009: Convex and one owner helper for learners' decks
- ADR 011: One document per deck, changed by pure acts
- ADR 012: Refusals as mutation values, named by one hook
- ADR 014: @dnd-kit/core for dragging alone, cards holding one button
- ADR 015: Boards by deck id in one pure reducer
- ADR 016: A board component free of Convex and Clerk
- ADR 017: React Router and one guard for the addresses
- ADR 018: Vitest in four kinds, dragging checked by hand
- ADR 019: Clerk's modal close observed through the app's container

## Tasks

### T1 — Router, deck addresses and 404.html

**Status**

- [x]

**Goal**

The app takes its screen from the address through React Router, with `/` showing the board of the app's own deck and any other path replaced by `/`, a deck's address is made from its name and id and read back to its id, and the build copies index.html to 404.html.

**Dependencies**

None.

**Files**

- package.json
- package-lock.json
- src/App.tsx
- src/routes/AppRoutes.tsx, new
- src/routes/AppRoutes.test.tsx, new
- src/routes/deckAddress.ts, new
- src/routes/deckAddress.test.ts, new

**Details**

- The task must install `react-router` as a dependency and use it in declarative mode (ADR 017).
- `App` must render `BrowserRouter` around Clerk's provider, and `AppRoutes` in place of `AppDeckScreen`, inside `BoardsProvider` (ADR 015, ADR 017). `stayOnPage` and what `ClerkProvider` is given stay as they are: Clerk is only ever handed the address the learner is already at.
- The task must create these interfaces:

```tsx
// src/routes/AppRoutes.tsx
/** The app's routes. It must be rendered inside a router and inside `BoardsProvider`. */
export default function AppRoutes(): ReactElement;

// src/routes/deckAddress.ts
/** The address of a deck's board. */
export function deckAddress(deck: { id: string; name: string }): string;

/** The id of the deck that one path segment of a deck's address names, or null when the segment ends in no code. */
export function deckIdOf(segment: string): string | null;
```

- `AppRoutes` must show `AppDeckScreen` at `/` and replace any other path with `/` (ADR 017).
- `deckAddress` must give `/decks/`, then the deck's name with each run of characters other than letters and digits made one hyphen, then a hyphen, then the deck's id with its hyphens removed (ADR 017). A letter or a digit is any character Unicode calls one, the pattern `[\p{L}\p{N}]` with the `u` flag, and the name's letters keep their case.
- `deckIdOf` must read the code as the last 32 characters of the segment, give null unless they are 32 of the characters `0` to `9` and `a` to `f`, and otherwise give them with hyphens put back after the 8th, 12th, 16th and 20th character, the form `crypto.randomUUID()` gives an id. It never reads the name before the code (ADR 017).
- The `build` script of package.json must leave dist/404.html a copy of dist/index.html (ADR 017).
- src/routes/AppRoutes.test.tsx must render `AppRoutes` inside `MemoryRouter` and `BoardsProvider` and mock `@clerk/react`.

**Out of scope**

- The routes `/decks` and `/decks/<name>-<code>` and the guard: T3 and T4.
- Hash routing, a router written on the History API, or React Router's data or framework mode: never (ADR 017).
- A code of the app's own for a deck, or Convex's document id in an address: never (ADR 017).

**Done when**

- These tests in src/routes/deckAddress.test.ts pass:
  - `deckAddress gives /decks/, the name with each run of other characters made one hyphen, a hyphen and the id without its hyphens`
  - `deckAddress keeps letters and digits of any script and the letters' case`
  - `deckIdOf gives back the id of the deck an address was made from, whatever name stands before the code`
  - `deckIdOf gives null for a segment that ends in no code of 32 hex digits`
- These tests in src/routes/AppRoutes.test.tsx pass:
  - `the path / shows the board of the app's own deck`
  - `any other path is replaced by /`
- Every other test passes under `npm test`.
- After `npm run build`, `cmp dist/index.html dist/404.html` prints nothing and exits with status 0.

**Debrief**

- `npx vitest run src/routes --reporter=verbose` passed the four tests of src/routes/deckAddress.test.ts, each by the name the Done when gives.
- The same run passed the two tests of src/routes/AppRoutes.test.tsx, `the path / shows the board of the app's own deck` and `any other path is replaced by /`; the second renders `/decks`, a deck's address and `/nowhere`, and asserts the path `/` reached by a REPLACE, not a push.
- `npm test`: 14 files, 136 tests passed. `npm run typecheck` exited with status 0.
- `npm run build` exited with status 0, and `cmp dist/index.html dist/404.html` printed nothing and exited with status 0. The build printed Vite's warning that a chunk is larger than 500 kB, which fails nothing.
- `npm install react-router` installed 8.5.1, used only through `BrowserRouter`, `MemoryRouter`, `Routes`, `Route` and `Navigate`. The `build` script copies the file with `cp dist/index.html dist/404.html` after `vite build`; the workflow's check and deploy jobs both run `npm run build`, so the deployed build carries 404.html.
- No departure from guidance.
- Read `deckAddress` in src/routes/deckAddress.ts: it applies the rule of runs to the whole name, so a name that begins or ends in a character other than a letter or a digit gives an address with a hyphen at the start, or two hyphens before the code, as `Year 9: cells & tissues!` gives `/decks/Year-9-cells-tissues--<code>`.

### T2 — Hook that sends an act on the learner's decks

**Status**

- [x]

**Goal**

One hook makes and deletes a deck: it applies the act on the device first, returns a refusal without sending, sends the mutation otherwise, and applies the same act as the mutation's optimistic update to the list of decks and to the deck's own query.

**Dependencies**

None.

**Files**

- src/decks/useDeckActs.ts, new
- src/decks/useDeckActs.test.tsx, new
- src/decks/optimistic.ts, new
- src/decks/optimistic.test.ts, new

**Details**

- The task must create these interfaces (ADR 011, ADR 012):

```ts
// src/decks/useDeckActs.ts
export type DeckActs = {
  /**
   * Makes a deck of the name under an id made by `crypto.randomUUID()`.
   * Returns the act's refusal and sends nothing when the act refuses;
   * otherwise sends the mutation and returns the new deck.
   */
  createDeck(name: string): ActResult;
  /** Deletes the deck of the id. */
  deleteDeck(deck: string): void;
};

/** Every act the app sends goes through this hook. */
export function useDeckActs(): DeckActs;

// src/decks/optimistic.ts
import type { OptimisticLocalStore } from "convex/browser";

/** Applies `createDeck` to the list of decks the store holds, adds the deck to it, and sets the deck's own query to the deck. */
export function createDeckLocally(
  store: OptimisticLocalStore,
  args: { id: string; name: string },
): void;

/** Takes the deck out of the list of decks the store holds and sets the deck's own query to null. */
export function deleteDeckLocally(
  store: OptimisticLocalStore,
  args: { deck: string },
): void;
```

- `useDeckActs` must read the learner's decks through `useQuery(api.decks.list)` and apply the act `createDeck` of convex/model/deckActs.ts to them before sending anything (ADR 011). While the list has not loaded, it takes the learner to have no deck.
- `createDeck` of the hook must pass the name as typed; the act trims it.
- Each mutation must be made with `useMutation` and given its function of src/decks/optimistic.ts through `withOptimisticUpdate` (ADR 009, ADR 011).
- `createDeckLocally` and `deleteDeckLocally` must read and set `api.decks.list` with no arguments and `api.decks.get` with the deck's id, and never change a value the store gave them. The list's arguments are the empty object `{}` wherever a call of the store takes arguments, as setting a query does, and the test's store keeps a query read with no arguments and one set with `{}` under one key. Each must do nothing at all while the store has no value for the list. `createDeckLocally` must set the new deck's own query whether or not the store holds a value for it.
- The hook must catch a mutation that throws, so that no unhandled rejection reaches the page, show nothing on the screen for it, and write the error to the browser's console with `console.error` (ADR 012).
- Here and in every later test file of this cycle, the mock of `convex/react` must give `useMutation` a mutation, bearing `withOptimisticUpdate`, for any function it is asked for, so that an act a later cycle adds to the hook breaks no test that does not send it.
- src/decks/useDeckActs.test.tsx must mock `convex/react`. src/decks/optimistic.test.ts must run the two functions over a store written in the test that keeps each query's value by its function and arguments.
- Guidance: that store keys a query by `getFunctionName` of its function, from `convex/server`, with its arguments, since a function read from `api` is not the same object at each read.

**Out of scope**

- Any screen that calls the hook: T5 and T6.
- An act on a card, a dimension or a category, renaming a deck, and Save answers: a later cycle, and renaming an unsettled decision.
- Keeping what an act touched, or giving a line for a change not kept: a later cycle.
- A mutation that takes a whole deck, or an act's optimistic update written apart from the act: never (ADR 011). Deleting a deck has no act, and `deleteDeckLocally` is the whole of its optimistic update.

**Done when**

- These tests in src/decks/optimistic.test.ts pass:
  - `createDeckLocally adds the deck to the end of the list and sets the deck's own query to it`
  - `createDeckLocally changes nothing when the act refuses or the list has not loaded`
  - `deleteDeckLocally takes the deck out of the list and sets the deck's own query to null`
  - `neither function changes a value the store gave it`
- These tests in src/decks/useDeckActs.test.tsx pass:
  - `createDeck sends the mutation with a new id and the name, and returns the new deck`
  - `createDeck returns the refusal and sends nothing for an empty name and for a name the learner already uses`
  - `deleteDeck sends the mutation with the deck's id`
  - `a mutation that throws leaves no unhandled rejection and writes the error to the console`
- `npm run typecheck` exits with status 0.

**Debrief**

- `npx vitest run src/decks --reporter=verbose` passed the four tests of src/decks/optimistic.test.ts, each by the name the Done when gives, and a fifth, `deleteDeckLocally changes nothing while the list has not loaded`, for the constraint that each function does nothing while the store has no value for the list. The first test also sets the new deck's own query over a store already holding a value for it.
- The same run passed the four tests of src/decks/useDeckActs.test.tsx, each by the name the Done when gives, and a fifth, `createDeck takes the learner to have no deck while the list has not loaded`. The tests assert that each mutation is given `createDeckLocally` or `deleteDeckLocally` through `withOptimisticUpdate`, and that the mutation of `createDeck` carries the name as typed, `"  History "`, while the deck returned bears it trimmed.
- The test of a mutation that throws listens for `unhandledRejection` on `process`, and failed when the hook's `.catch` was replaced by a `.then` for the trial, then passed with the `.catch` restored.
- `npm run typecheck` exited with status 0. `npm test`: 16 files, 146 tests passed.
- No departure from guidance: the test's store keys a query by `getFunctionName` of its function with its arguments, `{}` when none are given.
- Read `useDeckActs` in src/decks/useDeckActs.ts: it returns a new `DeckActs` object, with a new mutation from `withOptimisticUpdate`, at each render, so a screen of T5 or T6 that puts it, or one of its functions, in an effect's dependencies runs that effect at each render.

### T3 — Guard and the list of decks

**Status**

- [ ]

**Goal**

At `/decks` a signed-in learner sees their decks listed by name, each a link to its address, with the account button, while a learner who is not signed in sees the board of the app's own deck with the sign-in form open, lands on `/` when they close it, and is brought to `/` by "Sign out".

**Dependencies**

- T1: `AppRoutes` in src/routes/AppRoutes.tsx and its test; `deckAddress` in src/routes/deckAddress.ts.

**Files**

- src/routes/AppRoutes.tsx
- src/routes/AppRoutes.test.tsx
- src/routes/SignedInOnly.tsx, new
- src/routes/SignedInOnly.test.tsx, new
- src/screens/DeckListScreen.tsx, new
- src/screens/DeckListScreen.css, new
- src/screens/DeckListScreen.test.tsx, new
- src/screens/AppDeckScreen.tsx
- src/account/Account.tsx
- src/account/Account.test.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create or change these interfaces (ADR 017, ADR 019):

```tsx
// src/routes/SignedInOnly.tsx
/** The guard: renders the route inside it only for a learner Convex has confirmed. */
export default function SignedInOnly(): ReactElement | null;

// src/account/Account.tsx
export type AccountProps = {
  /** Opens the sign-in form, with no press, when `Account` first shows a learner who is not signed in. */
  signInOpen?: boolean;
  /** Called once the learner has closed the sign-in form without signing in, never when it closes because they signed in. */
  onSignInClose?: () => void;
};
export default function Account(props: AccountProps): ReactElement | null;

// src/screens/AppDeckScreen.tsx
/** The screen of the app's own deck; its props go to its `Account`. */
export default function AppDeckScreen(props: AccountProps): ReactElement | null;

// src/screens/DeckListScreen.tsx
/** The list of the learner's decks. */
export default function DeckListScreen(): ReactElement | null;
```

- `AppRoutes` must show `DeckListScreen` at `/decks`, as a route inside `SignedInOnly`.
- `SignedInOnly` must read `useConvexAuth()` of `convex/react` and nothing of Clerk. While it reports loading, the guard renders nothing. While the learner is not authenticated, it renders `AppDeckScreen` with `signInOpen` and leaves the address as it is, and it replaces the address with `/` when `onSignInClose` is called. Once the learner is authenticated, it renders the route's screen (ADR 017). `onSignInClose` means, to the guard, that the learner closed the form without signing in: the guard reads nothing of Clerk to tell a close from a sign-in (ADR 019).
- The sign-in form the guard opens must be the form "Sign in" opens: Clerk's own modal, opened by `Account` through the same call of `openSignIn` with what cycle 008 gives it, centred over the dimmed board of the app's own deck as drawing 7 shows, with the address left as it is through every step of signing in or of making an account (ADR 008, ADR 017).
- Given `signInOpen`, `Account` must make that call with no press, in the effect that runs when it first shows a learner whom Clerk's `useAuth()` reports loaded and signed out: once for each run of that effect on mount, and never again while it stays mounted.
- Every call of `openSignIn`, the one a press on "Sign in" makes included, must give the modal, as `getContainer`, one element of `Account`'s own, which `Account` renders into `document.body` through React's `createPortal` for as long as it is mounted, whatever Clerk reports and whether or not it shows a button. The task writes no CSS for the element and never renders it inside a bar (ADR 019).
- `Account` must learn that the modal has closed only from a `MutationObserver` on that element: a close is the element emptied after it held the modal (ADR 019).
- `Account` must keep an observed close as state and call `onSignInClose` only once `useAuth()` reports loaded and signed out while a close is held, once for that close. A report of signed in must drop the held close with `onSignInClose` not called, and the held close must outlast every moment `useAuth()` reports not loaded (ADR 019).
- When `Account` unmounts with the modal open, it must first stop observing the element and then close the modal through `closeSignIn` of `useClerk()`, so that this close never reaches `onSignInClose`. `Account` takes the modal as open from its own call of `openSignIn` until it observes a close. Unmounting with no modal open calls nothing of Clerk.
- The app runs under React's StrictMode in development, in src/main.tsx, which runs each effect twice on mount: the effect opens the form, its cleanup closes it as an unmount does, and the effect opens it again, so `openSignIn` is called twice there with `closeSignIn` between. Clerk takes the three in the order called. After a load of `/decks` or of a deck's address by a learner who is not signed in, the form must stand open, with the address unchanged and `onSignInClose` not called; the test under StrictMode asserts that and counts no call.
- "Sign out" in `Account` must now push the address `/` through React Router and then sign the learner out, handing Clerk `/` as the address to go to afterwards, so that the browser's Back reaches the address the learner signed out from and no sign-in form shows in between (PDR 015). At `/` it pushes nothing.
- The tests cycle 008 left in src/account/Account.test.tsx must keep their names and what they assert, now rendered inside `MemoryRouter`. The test `Sign out signs the learner out through Clerk` asserts only that Clerk's sign-out is called; the address handed to Clerk is the new test's to assert. The test `pressing Sign in opens Clerk's sign-in form through openSignIn` now meets a call that also carries `getContainer`.
- `SignedInOnly` must keep `useQuery(api.decks.list)` subscribed for as long as it renders a route for an authenticated learner, so that the list's value outlives a move from one route inside it to another.
- `DeckListScreen` must read `useQuery(api.decks.list)`, render nothing while it is loading, and otherwise show a bar holding `Account` at its end, which is the element the account menu is placed against as the board's bar is, made its positioned ancestor by src/screens/DeckListScreen.css (`position: relative`) as cycle 008 has src/board/Board.css make the board's bar, so that the menu hangs 10px below the list's bar with its right edge at the screen's right padding, and, under it, a list of the decks in the query's order, each a list item drawn as the deck's box and holding one link to `deckAddress` of the deck, which shows the deck's name, fills the whole box, and shows the focus outline every other control shows when the keyboard focuses it.
- Each new size and colour of this task is a custom property in src/index.css, and a size an existing property already holds, as the 12px of `--board-padding`, takes that property.
- The list must look as drawing 4 shows it: the bar, the list's width, the gap between the decks, and each deck's box, padding and weight of name, and the 12px between the bar and the list. On a screen narrower than the drawn list, the list takes the screen's width less the board's padding on each side.
- src/screens/DeckListScreen.test.tsx and src/routes/SignedInOnly.test.tsx must mock `convex/react` and `@clerk/react` and render inside `MemoryRouter`. src/routes/SignedInOnly.test.tsx also renders inside `BoardsProvider`, since the guard shows `AppDeckScreen`. src/routes/AppRoutes.test.tsx now mocks `convex/react` too, for every test in it.
- In src/account/Account.test.tsx and src/routes/SignedInOnly.test.tsx the mock of `@clerk/react` must stand in for the modal: its `openSignIn` appends one element to the element the `getContainer` it is given returns, and its `closeSignIn` removes that element. A test closes the form as the learner does by removing that element, and sets what the mock of `useAuth` reports, signed out, not loaded or signed in, in the order its name gives (ADR 019).
- docs/vocabulary.md must hold these two rows, each character for character. The first is added, and the second replaces the row of the account button:

```
| List | Deck, a collection of cards with its dimensions, named by the learner | the deck's name as the learner gives it, as "Biology revision" | Each deck in the list of decks | `Deck` in convex/model/deck.ts; the list in `DeckListScreen` in src/screens/DeckListScreen.tsx |
| Account | Account button, the learner's profile picture or the first letter of their email address in a circle | the learner's profile picture, or the first letter of their email address, as "S"; "Account", spoken | The top of the board and of the list of decks while signed in | the account button in `Account` in src/account/Account.tsx |
```

- A row this cycle adds to docs/vocabulary.md stands after the last row of its Area, or as the table's last row when no row has its Area.

**Out of scope**

- The ⓘ on each deck, the scrim and the panel that drawing 4 shows: T6, and the panel's name field an unsettled decision.
- The "New deck" field that drawing 4 shows: T5.
- The route of a deck's address: T4. Until T4, a deck's link leads to a path `AppRoutes` replaces with `/`.
- The copy of the app's own deck that starts a new learner's list: a later cycle, and the copy's name an unsettled decision. A learner with no deck sees an empty list.
- Clerk's `useAuth`, `SignedIn` or `SignedOut` in the guard, a redirect to `/` carrying the address to return to, or Clerk's own redirect to sign in: never (ADR 017).
- The form as drawing 7 draws it, its box, its cross, its heading, its fields, its buttons and its foot, and the dimming of the board behind it: never; Clerk's modal renders each (ADR 008). Words of the app's own on the cross: an unsettled decision.
- A `MutationObserver` on `document.body`, any of Clerk's class names, Clerk's `__internal_addNavigationListener`, a timer that looks for the modal, a fixed wait after a close, or Clerk's `session` read when the observer fires: never (ADR 019).
- `Account` reporting every close for the guard to sort, or `stayOnPage` marking a sign-in: never (ADR 019).
- The modal's opening and its container held in one provider above the routes, to keep the form open through Back and Forward: never.
- What cycle 006 ruled out of drawing 7 stays out: the italic letter i in a bordered circle that it draws for the ⓘ.

**Done when**

- These tests in src/routes/SignedInOnly.test.tsx pass:
  - `renders nothing while Convex reports loading`
  - `shows the board of the app's own deck with the sign-in form open, at the address it was given, to a learner who is not signed in`
  - `replaces the address with / when the learner closes the sign-in form`
  - `renders the route's screen once the learner is authenticated`
  - `keeps the list of decks subscribed while it renders a route for an authenticated learner`
- These tests in src/screens/DeckListScreen.test.tsx pass:
  - `renders nothing while the decks are loading`
  - `shows each deck by its name, in the query's order, as a link to its address`
  - `shows the account button and no deck for a learner with no deck`
- These tests in src/account/Account.test.tsx pass:
  - `opens the sign-in form with no press when signInOpen is given and the learner is signed out`
  - `gives every call of openSignIn one container of its own in document.body`
  - `calls onSignInClose once when the form closes while Clerk reports the learner signed out`
  - `holds a close while Clerk reports not loaded, drops it when Clerk reports signed in, and calls onSignInClose when Clerk reports signed out`
  - `unmounting with the form open stops observing, closes the form through closeSignIn and does not call onSignInClose`
  - `unmounting with no form open calls nothing of Clerk`
  - `under StrictMode the form signInOpen opens stays open and onSignInClose is not called`
  - `Sign out pushes the address / and signs the learner out, and pushes nothing at /`
- The test `the path /decks shows the list of decks to a signed-in learner` in src/routes/AppRoutes.test.tsx passes.
- Every other test passes under `npm test`.
- Each of the two rows of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T4 — A deck's board at its address

**Status**

- [ ]

**Goal**

A deck's address opens that deck's board by its code alone, with an arrow back to the list that also stands on the board of the app's own deck while signed in, the address follows the deck's name, each board is as the learner left it, and an address of a deck the learner cannot open brings the list with a line saying so.

**Dependencies**

- T1: `deckAddress` and `deckIdOf` in src/routes/deckAddress.ts.
- T3: `AppRoutes` with `SignedInOnly`; `DeckListScreen` and its test; `AppDeckScreen` taking `AccountProps`.

**Files**

- src/routes/AppRoutes.tsx
- src/routes/AppRoutes.test.tsx
- src/screens/DeckScreen.tsx, new
- src/screens/DeckScreen.test.tsx, new
- src/screens/DeckNotOpened.tsx, new
- src/screens/BackToList.tsx, new
- src/screens/BackToList.css, new
- src/screens/DeckListScreen.tsx
- src/screens/DeckListScreen.css
- src/screens/DeckListScreen.test.tsx
- src/screens/AppDeckScreen.tsx
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- docs/vocabulary.md

**Details**

- The task must create or change these interfaces (ADR 016, ADR 017):

```tsx
// src/screens/DeckScreen.tsx
/** The screen of a learner's deck, the one screen that reads a deck from Convex. */
export default function DeckScreen(): ReactElement | null;

// src/screens/BackToList.tsx
/** The arrow back to the list of decks: a link to /decks. */
export default function BackToList(): ReactElement;

// src/screens/DeckNotOpened.tsx
export function DeckNotOpenedProvider(props: { children: ReactNode }): ReactElement;

/** `shown` turns true at `show()` and false the next time the address's path changes from /decks to another path. It lives in memory alone. Outside the provider it gives `shown` false and a `show` that does nothing. */
export function useDeckNotOpened(): { shown: boolean; show: () => void };

// src/board/Board.tsx, added to BoardProps
/** Shown at the start of the bar, before "Sort by". */
back?: ReactNode;
```

- `AppRoutes` must show `DeckScreen` at `/decks/:segment`, as a route inside `SignedInOnly`, and render `DeckNotOpenedProvider` around its routes.
- A segment from which `deckIdOf` gives null is any other path (ADR 017): `AppRoutes` itself must replace the address with `/` for it before any route renders, whether or not the learner is signed in, so that `SignedInOnly` is not rendered for it and no sign-in form opens. Guidance: `AppRoutes` reads the path with React Router's `useMatch` and renders `Navigate` in place of its routes.
- `DeckScreen` must read the deck's id from the segment with `deckIdOf`. It never meets a segment that gives null, makes no replacement of its own for one, and renders nothing for the null the function's type still allows.
- `DeckScreen` must read the deck through `useQuery(api.decks.get, { id })`. When the query gives null, it must call `show()` of `useDeckNotOpened` and replace the address with `/decks` (PDR 015).
- While the query is loading, `DeckScreen` must show the deck of that id that `api.decks.list` holds, when the list has loaded and holds one, so that a deck just made shows its board whatever the connection; it renders nothing only when neither gives a deck (PDR 014).
- When it has a deck, `DeckScreen` must replace the address with `deckAddress` of the deck whenever the segment, as `useParams` gives it decoded, differs from the last segment of that address, take the deck's board from `useDeckBoard`, render nothing while the board is null, and otherwise render `Board` with the deck, the board, the dispatch, `<Account />` as `account` and `<BackToList />` as `back` (ADR 015, ADR 017).
- `AppDeckScreen` must pass `<BackToList />` as `back` while `useConvexAuth()` reports the learner authenticated, and nothing as `back` otherwise. It reads Convex's word on the sign-in alone, as `SignedInOnly` does (ADR 017), and no deck: ADR 016 keeps Convex out of `Board` and its parts, and `DeckScreen` stays the one screen that reads a deck.
- `BackToList` must render a link of React Router to `/decks`, which pushes the address, with the accessible name "Back to the list of decks", showing the arrow and the icon button's box that drawing 1 shows at the start of the bar, with the focus outline every other control shows when the keyboard focuses it. On a screen at most 720px wide it is 44px wide and high. Its box and its arrow look as the box and the cross of Close do in src/ui/Panel.css: the task reads the same custom properties of src/index.css that Close's rules read, those cycle 006 added and those that stood before, and adds none.
- `DeckListScreen` must show, at its top under the bar and while `shown` is true, the line "This deck cannot be opened. It may have been deleted, or belong to another account." in a paragraph with `role="status"`, as wide as the list, in the page's font size and the colour of the board's prompt, with no box around it. The 12px stand between the bar and the line, and the gap between two decks stands between the line and the list.
- No board is stored by this task: each board is the one `BoardsProvider` holds for the deck's id, so a deck opened again from the list, by Back or by Forward shows its board as it was left, and a reload starts it over (PDR 013, ADR 015).
- src/screens/DeckScreen.test.tsx must mock `convex/react` and `@clerk/react` and render `AppRoutes` inside `MemoryRouter` and `BoardsProvider`.
- docs/vocabulary.md must hold these two rows, each character for character, each added after the last row of its Area. The first row's Where is the vocabulary's own wording: it covers each board a signed-in learner sorts, the app's own deck's among them, and calls the link a button for its look:

```
| Board | Back to the list of decks | an arrow; "Back to the list of decks", spoken | A button at the start of the top of the board of a signed-in learner's deck | `BackToList` in src/screens/BackToList.tsx |
| List | Line after a deck's address names a deck the learner cannot open | "This deck cannot be opened. It may have been deleted, or belong to another account." | A line at the top of the list of decks, from a deck's address naming a deck the learner cannot open until the learner leaves the list | `useDeckNotOpened` in src/screens/DeckNotOpened.tsx; the line in `DeckListScreen` in src/screens/DeckListScreen.tsx |
```

**Out of scope**

- The ⓘ on each dimension and on each zone's label, the "New dimension", "New card" and "New category" fields, "Save answers", and Delete in the card's panel that drawing 1 shows: a later cycle. The panel's name field: an unsettled decision.
- What cycle 006 ruled out of drawing 1 stays out: the italic letter i in a bordered circle, the ⓘ with no background, and the blue ring around the ⓘ of the open card.
- A cross on the line, or the line fading by itself: never.
- Keeping a board in the router's location state or in `sessionStorage`: never (ADR 015).
- What the learner meets when the deck they are on is deleted from another device: an unsettled decision. Until it is settled the rule above applies: the query gives null and the list shows with the line.
- A call of Convex from `Board` or any file under src/board/: never (ADR 016).

**Done when**

- These tests in src/screens/DeckScreen.test.tsx pass:
  - `renders nothing while the deck is loading and the list holds no deck of its id`
  - `shows the board of a deck the list holds while the deck's own query is loading`
  - `shows the board of the deck its address names by the code alone, with the arrow and the account button`
  - `replaces the address with the deck's own when the name in it differs`
  - `replaces the address with / for a segment that ends in no code, whether or not the learner is signed in`
  - `brings the list of decks with the line when the deck cannot be opened, and makes the address the list's`
  - `the arrow leads to the list of decks`
  - `a deck's board keeps its chosen dimension when the learner goes to the list and opens the deck again`
- These tests in src/screens/DeckListScreen.test.tsx pass:
  - `shows the line that a deck cannot be opened only while it is shown`
  - `the line is gone when the learner comes back to the list after opening a deck`
- These tests in src/routes/AppRoutes.test.tsx pass:
  - `the board of the app's own deck shows the arrow to a signed-in learner`
  - `the board of the app's own deck shows no arrow to a learner who is not signed in`
- The test `shows what it is given as back at the start of the bar` in src/board/Board.test.tsx passes.
- Every other test passes under `npm test`.
- Each of the two rows of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T5 — "New deck" field and its refusals

**Status**

- [ ]

**Goal**

A learner types a name into the dashed "New deck" field ending the list and presses Enter to make a deck and open its board, and reads under the field why an empty name or a name they already use is refused, with what they typed kept.

**Dependencies**

- T1: `deckAddress` in src/routes/deckAddress.ts.
- T2: `useDeckActs` in src/decks/useDeckActs.ts.
- T4: `DeckListScreen` with its line; the route of a deck's address.

**Files**

- src/ui/NewField.tsx, new
- src/ui/NewField.css, new
- src/ui/NewField.test.tsx, new
- src/words/refusalWords.ts, new
- src/words/refusalWords.test.ts, new
- src/screens/DeckListScreen.tsx
- src/screens/DeckListScreen.css
- src/screens/DeckListScreen.test.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create these interfaces:

```tsx
// src/ui/NewField.tsx
export type NewFieldProps = {
  /** The field's words: its placeholder and its accessible name, as "New deck". */
  label: string;
  /** Called with the text as typed when the learner presses Enter. Returns null when the name was taken up, or the words of its refusal. */
  onEnter: (name: string) => string | null;
  /** A class for the `<input>`. */
  className?: string;
};

export default function NewField(props: NewFieldProps): ReactElement;

// src/words/refusalWords.ts
/**
 * The words the learner reads for a name refused. `held` is the name of what
 * holds the name: the deck for a card or a dimension, the dimension for a
 * category; a deck's refusal reads none.
 */
export function refusalWords(
  refusal: Extract<Refusal, { refused: "nameTaken" | "noName" }>,
  held?: string,
): string;
```

- `NewField` must render one `<input type="text">` with `label` as its placeholder and its accessible name. On Enter it must call `onEnter` with the field's text, an empty text included. When `onEnter` gives null, the field empties and keeps the focus. When it gives words, they show as a line under the field, the field keeps what the learner typed, and the line stays until the field's text changes or an Enter is taken up (PDR 009, PDR 011).
- `NewField` must render one wrapper element holding the `<input>` and the line. The line must be a paragraph with `role="alert"`, in the small font size and the label colour, tied to the field through `aria-describedby`, and laid over what stands under the field, so that nothing on the screen moves when it shows. It must have the page's background colour behind its whole box and lie above resting cards and under a dragged card, by the z-index custom property cycle 008 gave the account menu in src/index.css, so that it can be read over whatever stands under it.
- Guidance: the line starts at the field's start, directly under the field, may be wider than the field, and wraps where it would pass the screen's edge.
- Guidance: the wrapper is a `<div>` with `position: relative` and no width or display of its own, so it is as wide as its field where it stands in a row, as in a bar or in the pool, and as wide as the list where it stands in a column, which lets a caller's width of 100% fill the list.
- On a screen at most 720px wide every `NewField` is at least 44px high.
- The field's own rules in src/ui/NewField.css must give it the look drawing 6 shows the "New dimension" field: its dashed border of 1px in the colour of a control's border, its radius, its padding, its width and the page's font size, with the grey placeholder, the solid border while focused and the focus outline of the bullet below. A caller's class is added to the field's own and changes only the border's width and colour, the radius, the padding, the width and the font size. `DeckListScreen` gives "New deck" the box drawing 4 shows that way: a dashed border of 2px in the colour of a region's border, its radius, its padding, and the list's full width. Each new size and colour is a custom property in src/index.css.
- The field must show a dashed border holding its name in grey. While it has the focus the dashed border becomes a solid border of the same width in the focus colour, as drawing 6 shows on the field in use, and the field shows the focus outline every other control shows. Its text is typed straight into it, with no button to press first.
- `refusalWords` must give these words, with the refusal's name in place of the last name and `held` in place of the first, each name between straight double quotes:
  - a deck: `You already have a deck called "<Deck>".` and `A deck needs a name.`
  - a card: `The deck "<Deck>" already has a card called "<Card>".` and `A card needs a name.`
  - a dimension: `The deck "<Deck>" already has a dimension called "<Dimension>".` and `A dimension needs a name.`
  - a category: `The dimension "<Dimension>" already has a category called "<Category>".` and `A category needs a name.`
- Every caller gives `held` for a card, a dimension or a category. Called without it for one of them, `refusalWords` puts nothing between the first pair of quotes.
- This cycle shows only a deck's words; the others are shown, and take their rows of docs/vocabulary.md, in a later cycle.
- `DeckListScreen` must show `NewField` labelled "New deck" after the list's `<ul>`, never as an item of it, in the box drawing 4 shows, with the gap between two decks above it. `DeckListScreen` must hold the `<ul>` and the field in one column of the list's width, as drawing 4's list holds the decks and the field, so that the field's full width is the list's. Its `onEnter` must call `createDeck` of `useDeckActs`, give the words of `refusalWords` when the act refuses with `nameTaken` or `noName`, which are the only refusals `createDeck` gives, give null and push nothing for any other refusal, and, when the act does not refuse, push the address `deckAddress` of the new deck and give null (PDR 011).
- docs/vocabulary.md must hold these two rows, each character for character, each added after the last row of its Area:

```
| List | New deck, a field that makes a deck of the typed name and opens its board | "New deck" | A dashed field ending the list of decks | `NewField` in src/ui/NewField.tsx; the field in `DeckListScreen` in src/screens/DeckListScreen.tsx |
| Editing | Refusal of a deck name | "You already have a deck called "<Deck>"."; "A deck needs a name." | A line under the "New deck" field | `refusalWords` in src/words/refusalWords.ts |
```

**Out of scope**

- Everything drawing 6 shows but the look of its fields, at rest and in use: the board's fields, the ⓘ on dimensions and zones and "Save answers" are a later cycle.
- The ⓘ on each deck, the scrim and the panel that drawing 4 shows: T6.
- A button that turns into the field, or a "+" inside it: never.
- Showing the words for a card, a dimension or a category name refused: a later cycle.
- The 2px offset drawing 6 gives the outline of the field in use: never; the field takes the app's own focus outline.
- A refusal shown while the learner types, before Enter: never; the act that refuses is applied when Enter is pressed.

**Done when**

- These tests in src/ui/NewField.test.tsx pass:
  - `shows its label as its placeholder and its accessible name`
  - `Enter calls onEnter with the text as typed, an empty text included`
  - `a name taken up empties the field, which keeps the focus`
  - `a refusal shows under the field, which keeps what was typed`
  - `the refusal goes when the text changes`
- These tests in src/words/refusalWords.test.ts pass:
  - `a deck name already used reads: You already have a deck called "<Deck>".`
  - `an empty deck name reads: A deck needs a name.`
  - `a card name already used reads: The deck "<Deck>" already has a card called "<Card>".`
  - `an empty card name reads: A card needs a name.`
  - `a dimension name already used reads: The deck "<Deck>" already has a dimension called "<Dimension>".`
  - `an empty dimension name reads: A dimension needs a name.`
  - `a category name already used reads: The dimension "<Dimension>" already has a category called "<Category>".`
  - `an empty category name reads: A category needs a name.`
- These tests in src/screens/DeckListScreen.test.tsx pass:
  - `the New deck field stands after the list and is no item of it`
  - `Enter in New deck makes a deck and opens its address`
  - `a refused deck name shows its words under New deck and opens nothing`
- Every other test passes under `npm test`.
- Each of the two rows of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T6 — Deleting a deck from its panel after a question

**Status**

- [ ]

**Goal**

Each deck in the list holds an ⓘ that opens the deck's panel, and Delete in the panel asks a question naming the deck and how many cards are lost, deleting the deck only when the learner confirms.

**Dependencies**

- T2: `deleteDeck` of `useDeckActs` in src/decks/useDeckActs.ts.
- T5: `DeckListScreen` with its field.

**Files**

- src/ui/InfoButton.tsx, new
- src/ui/InfoButton.css, new
- src/ui/Question.tsx, new
- src/ui/Question.css, new
- src/ui/Question.test.tsx, new
- src/words/deleteQuestion.ts, new
- src/words/deleteQuestion.test.ts, new
- src/board/Card.tsx
- src/board/Card.css
- src/screens/DeckListScreen.tsx
- src/screens/DeckListScreen.css
- src/screens/DeckListScreen.test.tsx
- src/ui/Panel.tsx
- src/ui/Panel.css
- src/index.css
- docs/vocabulary.md

**Details**

- The task must create these interfaces:

```tsx
// src/ui/InfoButton.tsx
/** The ⓘ: one button whose text is the character ⓘ, which stops a pointer press from reaching what it sits on. */
export default function InfoButton(props: {
  /** Called with the pressed ⓘ, which takes the focus back when what it opened closes. */
  onPress: (button: HTMLElement) => void;
  className?: string;
}): ReactElement;

// src/ui/Question.tsx
export type QuestionProps = {
  /** The question, as 'Delete the deck "History"?'. */
  question: string;
  /** The word of the button that agrees, as "Delete". */
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function Question(props: QuestionProps): ReactElement;

// src/words/deleteQuestion.ts
/** The question before a deck is deleted. */
export function deleteDeckQuestion(deck: Deck): string;
```

- `InfoButton` must be the ⓘ `Card` holds today, moved: the same element, text, look, focus outline and stopping of the pointer press. `Card` must render `InfoButton` in place of its own button, and every test of the card's ⓘ keeps passing unchanged.
- `DeckListScreen` must render one `InfoButton` for each deck, inside the deck's list item, beside the deck's link in the markup and never inside it, with the look of the card's ⓘ but in a box 15px wide and high, placed by `top: 6px` and `right: 6px` inside the deck's box as drawing 4 shows, its glyph sized to fill that box.
- Pressing a deck's ⓘ must open `Panel` with the deck's name as its heading, holding one `<button type="button">` whose accessible name is "Delete", shown as the bin in the red box drawing 4 shows, at the end of a row of its own under the heading, where drawing 4 shows it. On a screen at most 720px wide Delete is 44px wide and high. The look of Delete lives in src/ui/Panel.css under a class of its own, for every panel that holds a Delete.
- Guidance: when the deck's panel closes by Close or by the Escape key, `DeckListScreen` returns the focus to the ⓘ that opened it, as `closePanel` of `Board` in src/board/Board.tsx does for a card's panel.
- Each new size and colour of this task, the deck's ⓘ's among them, is a custom property in src/index.css.
- The panel and the question of a deck must show only while the list holds that deck.
- Pressing Delete must show `Question` over the list with `deleteDeckQuestion` of the deck as `question` and "Delete" as `confirm`. Cancel closes the question and leaves the panel open and the deck as it is. Delete calls `deleteDeck` of `useDeckActs` with the deck's id and closes the question and the panel (PDR 011).
- `deleteDeckQuestion` must give `Delete the deck "<Deck>"? N cards and their answers will be lost.` with the count of the deck's cards in place of N, `Delete the deck "<Deck>"? 1 card and their answers will be lost.` for a deck of one card, and `Delete the deck "<Deck>"?` for a deck with no card.
- `Question` must render a scrim fixed to the viewport and, above it and above any panel, an element with `role="alertdialog"` and `aria-modal="true"` named by the question's text through `aria-labelledby`, holding the question and two `<button type="button">`, the first reading `confirm` and the second "Cancel". A press on the scrim does nothing. While a question is open over a panel, the Escape key and the focus belong to the question alone: the panel under it neither closes nor takes the focus, and the task changes `Panel` as far as that needs.
- Guidance: `Question` takes the scrim, the box and the place of `Panel`, with its two buttons at the end of the box in the look of the bar's buttons, given by a class of its own in src/ui/Question.css that takes the same custom properties as `.board-action` in src/board/Board.css and, as that class is there, is at least 44px high on a screen at most 720px wide. The Escape key cancels, and focus moves to Cancel when the question opens.
- When it closes, `Question` itself must return the focus to the element that had it when the question opened, where that element still stands: after Cancel that is Delete, and after a deck is deleted, its panel gone, the focus moves nowhere.
- src/ui/Question.test.tsx and the tests of this task in src/screens/DeckListScreen.test.tsx assert what shows and what is called; the hook is mocked with `convex/react`.
- The checks of the cycle's Judgement that need a browser, a second device or the engineer's accounts are the engineer's. The builder's evidence for the Judgement is the tests this cycle names, and its Debrief says so.
- docs/vocabulary.md must hold these three rows, each character for character. The first is added after the last row of its Area, and the other two replace the rows of the ⓘ and of the panel. Each row says only what is built once this task is done:

```
| List | Question before deleting a deck | "Delete the deck "<Deck>"? N cards and their answers will be lost."; "Delete the deck "<Deck>"? 1 card and their answers will be lost."; "Delete the deck "<Deck>"?"; "Delete"; "Cancel" | A question over the list of decks | `deleteDeckQuestion` in src/words/deleteQuestion.ts; `Question` in src/ui/Question.tsx |
| Editing | ⓘ, which opens the panel of a card or a deck | "ⓘ" | The upper right corner of each card; each deck in the list of decks | `InfoButton` in src/ui/InfoButton.tsx |
| Editing | Panel of a card or a deck, for deleting a deck | the name of what it opens as its heading, as "Orca"; "Delete", spoken; "Close", spoken | A panel over the board; a panel over the list of decks | `Panel` in src/ui/Panel.tsx |
```

**Out of scope**

- The name field that drawing 4 shows in the panel, and renaming a deck: an unsettled decision.
- Delete in a card's panel, and the ⓘ and the panel of a dimension or a category: a later cycle.
- The blue ring drawing 4 shows around the ⓘ of the open deck: never; it marks in the drawing which ⓘ was pressed.
- The italic letter i in a bordered circle that drawing 4 draws for the ⓘ: never; the deck's ⓘ is `InfoButton`, the character `ⓘ`, as cycle 006 ruled for the card's.
- Deleting at once with an Undo, or with no question: never (PDR 011).
- A question that names the deck's dimensions: never.

**Done when**

- These tests in src/words/deleteQuestion.test.ts pass:
  - `a deck of several cards reads: Delete the deck "<Deck>"? N cards and their answers will be lost.`
  - `a deck of one card reads: Delete the deck "<Deck>"? 1 card and their answers will be lost.`
  - `a deck with no card reads: Delete the deck "<Deck>"?`
- These tests in src/ui/Question.test.tsx pass:
  - `Question shows its question with the confirming word and Cancel, and calls onConfirm and onCancel`
  - `Question returns the focus, when it closes, to the element that had it when it opened`
- These tests in src/screens/DeckListScreen.test.tsx pass:
  - `each deck holds an ⓘ beside its link, not inside it`
  - `a deck's ⓘ opens a panel headed by the deck's name with Delete`
  - `Delete asks the question that names the deck and its cards`
  - `Cancel closes the question and keeps the panel and the deck`
  - `confirming deletes the deck and closes the question and the panel`
- Every test of the card's ⓘ in src/board/Board.test.tsx passes, the file unchanged.
- Every other test passes under `npm test`.
- Each of the three rows of the Details is a line of docs/vocabulary.md.
- `npm run build` exits with status 0, and `cmp dist/index.html dist/404.html` prints nothing.

**Debrief**

None.
