# 007 — Deck acts and Convex functions

Waits for: 005, `Deck`, `Dimension`, `Category` and `Card` in convex/model/deck.ts, and AGENTS.md, which this cycle takes as 005 leaves it

## Goal

Outcome: Every act on a learner's deck is one pure function returning the changed deck or a refusal, and one Convex mutation that applies the act for the deck's owner alone and writes the result, with one document per deck, a mutation that deletes a deck, and a `startLearner` mutation that gives a learner their first deck once.

Scope: The cycle covers the acts in convex/model/deckActs.ts, Convex installed in the repository with its `decks` and `learners` tables, the owner helper `ownedDeck` with every other read of the `decks` table beside it in convex/owned.ts, the two queries, one mutation per act, `startLearner`, the tests of the acts as pure functions and of the functions under convex-test, and the typecheck of convex/. It leaves out every call of a function from the app, Clerk, the provider that connects the app to Convex, the deploy of the functions to production, and every screen.

Judgement: The engineer runs `npm test` and reads, in the Debriefs, each act's tests and each function's tests passing, a call for another learner's deck throwing and writing nothing, and a second `startLearner` adding nothing. The engineer reads in T2's Debrief that `npm run typecheck` fails while a type error stands in convex/decks.ts.

## Records

- PDR 009: Rules each deck must meet, with an error for the app's own deck and a refused name for a learner's
- PDR 010: Answers set by saving the sorted board, with a question before any answer changes
- PDR 011: Making by a field where it goes, changing by its panel, and deleting after a question
- PDR 014: Changes shown at once and kept when the connection returns, with a change that no longer fits named and left out
- ADR 007: One deck shape keyed by ids made on the device, with the app's own deck bundled as JSON keyed by name
- ADR 009: Convex for keeping the learners' decks, with one helper checking each deck's owner
- ADR 011: One Convex document per deck, changed by one pure act run on the device and in the mutation
- ADR 012: Late changes refused as the mutation's value, Save answers kept in part, and one hook naming what was not kept
- ADR 013: A learners table and one mutation for giving each learner the copy of the app's own deck once
- ADR 018: Vitest in four kinds, unit, component in jsdom, Convex functions under convex-test and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Acts on a deck as pure functions

**Status**

- [ ]

**Goal**

Each act on a learner's deck is one pure function in convex/model/deckActs.ts that returns the changed deck or a refusal carrying the kind and the name or id at fault, and Save answers returns the ids it left out, each proven by a unit test.

**Dependencies**

None.

**Files**

- convex/model/deckActs.ts, new
- convex/model/deckActs.test.ts, new

**Details**

- convex/model/deckActs.ts must export exactly this and import nothing but the types of convex/model/deck.ts (ADR 011, ADR 012):

```ts
import type { Deck } from "./deck";

export type Kind = "deck" | "card" | "dimension" | "category";

export type Refusal =
  /** Another thing of the kind already bears the name where it is held. */
  | { refused: "nameTaken"; kind: Kind; name: string }
  /** The name is empty. */
  | { refused: "noName"; kind: Kind }
  /** The deck holds no card, dimension or category of the id. */
  | { refused: "gone"; kind: "card" | "dimension" | "category"; id: string };

export type ActResult =
  { ok: true; deck: Deck } | { ok: false; refusal: Refusal };

/** The ids a Save answers set no answer for: cards the deck does not hold, categories the dimension does not hold. */
export type LeftOut = { cards: string[]; categories: string[] };

export type SaveAnswersResult =
  { ok: true; deck: Deck; leftOut: LeftOut } | { ok: false; refusal: Refusal };

// Acts on the decks of one learner; `decks` is every deck the learner has.
export function createDeck(
  decks: readonly Deck[],
  args: { id: string; name: string },
): ActResult;
export function renameDeck(
  decks: readonly Deck[],
  args: { deck: string; name: string },
): ActResult;

// Acts on the things of one deck.
export function addCard(
  deck: Deck,
  args: { id: string; name: string },
): ActResult;
export function renameCard(
  deck: Deck,
  args: { card: string; name: string },
): ActResult;
export function deleteCard(deck: Deck, args: { card: string }): ActResult;
export function addDimension(
  deck: Deck,
  args: { id: string; name: string },
): ActResult;
export function renameDimension(
  deck: Deck,
  args: { dimension: string; name: string },
): ActResult;
export function deleteDimension(
  deck: Deck,
  args: { dimension: string },
): ActResult;
export function addCategory(
  deck: Deck,
  args: { dimension: string; id: string; name: string },
): ActResult;
export function renameCategory(
  deck: Deck,
  args: { dimension: string; category: string; name: string },
): ActResult;
export function deleteCategory(
  deck: Deck,
  args: { dimension: string; category: string },
): ActResult;
export function saveAnswers(
  deck: Deck,
  args: { dimension: string; answers: { card: string; category: string }[] },
): SaveAnswersResult;
```

- convex/model/deckActs.ts and its test must use no part of JavaScript's library newer than ES2021, the library Convex's own tsconfig gives the files under convex/, and must typecheck under the compiler options of tsconfig.app.json, since the app will import the acts: each import of a type is written `import type`, no local and no parameter stands unused, no syntax is used that cannot be erased, and no case of a `switch` falls through.
- Every argument named `card`, `dimension`, `category` or `deck` is an id, and every `id` is the id of the thing the act makes.
- No act changes the deck, the decks or the arguments it is given, and an act that refuses returns no deck.
- An act that gives a name must first trim it with `String.prototype.trim` and use the trimmed name. It must refuse with `noName` when the trimmed name is empty, and otherwise with `nameTaken`, carrying the trimmed name, when another thing of the same kind bears exactly that name where it is held: another deck of `decks`, another card of the deck, another dimension of the deck, another category of the same dimension (PDR 009). Names are compared character for character.
- An act whose result would equal the deck it was given, as a rename to the name the thing already bears or a Save answers that changes no card's answer, must return `ok: true` with that deck, the same object. For `renameDeck` that deck is the one of `decks` whose id is `args.deck`.
- The comments in the block above tell the builder what a name means and are no part of what the file must hold.
- An act must refuse with `gone`, carrying the kind and the id, when the card, the dimension or the category it changes is not in the deck; `addCategory`, `renameCategory` and `deleteCategory` check the dimension before the category (ADR 012). `gone` comes before `noName`, and `noName` before `nameTaken`. A refusal comes before the rule on an act that changes nothing: an act returns the deck it was given only when none of the three refusals applies, so a rename of a thing to the empty name it already bears refuses with `noName` (PDR 009).
- An act that makes a thing takes its id as given and never checks it against the ids the deck holds.
- `createDeck` must return, as `deck`, a new deck of the id and the name with no dimension and no card. `renameDeck` must return the deck of `decks` whose id is `args.deck` under its new name; the caller guarantees that `decks` holds it.
- `addCard` must add the card at the end of `cards` with no answer. `addDimension` must add the dimension at the end of `dimensions` with no category. `addCategory` must add the category at the end of its dimension's `categories` (PDR 011).
- `deleteCard` must remove the card. `deleteCategory` must remove the category and the answer of every card whose answer under that dimension it is. `deleteDimension` must remove the dimension and every card's answer under it (PDR 011).
- `saveAnswers` must refuse, with `gone` of kind `dimension`, only when the deck does not hold the dimension. Otherwise it must set, for each entry of `answers` whose card the deck holds and whose category the dimension holds, that category as the card's answer under the dimension, taking the entries in order so that, among a card's entries that fit, the last one stands, leave every other answer as it was, and return in `leftOut.cards` the id of each entry's card the deck does not hold and in `leftOut.categories` the id of each entry's category the dimension does not hold, each id once, in the order `answers` first gives it (ADR 012).

**Out of scope**

- A Convex function, table or package: T2 and T3.
- An act that deletes a deck: T2 deletes the document in its mutation.
- Fitting a late change to the deck, as by giving a taken name a suffix: never (PDR 014).
- Any call of an act from src/: a later cycle.

**Done when**

- These tests in convex/model/deckActs.test.ts pass:
  - `createDeck returns a deck of the id and the trimmed name with no dimension and no card`
  - `createDeck refuses an empty name and a name another deck of the learner bears`
  - `renameDeck returns the deck under its new name, and unchanged under its own name`
  - `renameDeck refuses an empty name and a name another deck of the learner bears`
  - `addCard adds the card at the end with no answer`
  - `addCard refuses an empty name and a name another card bears`
  - `renameCard renames the card and leaves its id and answers`
  - `renameCard refuses a card the deck lacks, an empty name and a name another card bears, in that order`
  - `deleteCard removes the card, and refuses a card the deck lacks`
  - `addDimension adds the dimension at the end with no category`
  - `addDimension refuses an empty name and a name another dimension bears`
  - `renameDimension renames the dimension and leaves every answer under it`
  - `renameDimension refuses a dimension the deck lacks, an empty name and a name another dimension bears, in that order`
  - `deleteDimension removes the dimension and every card's answer under it, and refuses a dimension the deck lacks`
  - `addCategory adds the category at the end of its dimension`
  - `addCategory refuses a dimension the deck lacks, an empty name and a name another category of the dimension bears, in that order`
  - `addCategory keeps a name a category of another dimension bears`
  - `renameCategory renames the category and leaves every answer that is it`
  - `renameCategory refuses a dimension the deck lacks, a category the dimension lacks, an empty name and a name another category of the dimension bears, in that order`
  - `deleteCategory removes the category and the answer of every card that had it, and refuses a dimension or a category the deck lacks`
  - `saveAnswers sets the answer of each card it is given and leaves every other answer`
  - `saveAnswers leaves out a card the deck lacks and a category the dimension lacks, sets the rest and returns each id left out once`
  - `saveAnswers refuses only a dimension the deck lacks`
  - `a name is trimmed before it is checked and kept`
  - `an act that changes nothing returns the deck it was given, the same object`
  - `no act changes the deck, the decks or the arguments it is given`
- `npx tsc --ignoreConfig --noEmit --strict --target es2021 --module esnext --moduleResolution bundler --skipLibCheck --verbatimModuleSyntax --noUnusedLocals --noUnusedParameters --erasableSyntaxOnly --noFallthroughCasesInSwitch convex/model/deckActs.ts convex/model/deckActs.test.ts` exits with status 0.

**Debrief**

None.

### T2 — Convex tables, owner helper, queries and deck mutations

**Status**

- [ ]

**Goal**

The repository holds Convex with one document per deck in `decks`, a `learners` table, one helper that loads a deck only for its owner, the queries that list and get a learner's decks, and the mutations that create, rename and delete a deck and start a learner, each proven under convex-test.

**Dependencies**

- T1: `createDeck`, `renameDeck`, `Refusal` and `ActResult` in convex/model/deckActs.ts.

**Files**

- package.json
- package-lock.json
- vite.config.ts
- .gitignore
- AGENTS.md
- convex/schema.ts, new
- convex/owned.ts, new
- convex/decks.ts, new
- convex/decks.test.ts, new
- convex/learners.ts, new
- convex/learners.test.ts, new
- convex/tsconfig.json, new
- convex/README.md, new
- convex/test.setup.ts, new
- convex/_generated/api.d.ts, new
- convex/_generated/api.js, new
- convex/_generated/dataModel.d.ts, new
- convex/_generated/server.d.ts, new
- convex/_generated/server.js, new

**Details**

- The task must install `convex` as a dependency, and `convex-test` and `@edge-runtime/vm` as development dependencies (ADR 009, ADR 018).
- vite.config.ts must run two Vitest projects under the one `npm test`: the tests under src/ in jsdom with the setup file as today, and the tests under convex/ in the `edge-runtime` environment (ADR 018).
- The `typecheck` script of package.json must run `tsc -b` and then `tsc --noEmit -p convex`, the `build` script stays as it is, and the lines of AGENTS.md under "# Commands" must read:

```
- `npm test` runs every test, the record citation guard among them.
- `npm run dev` serves the app for development.
- `npx convex dev` runs the development deployment of Convex and pushes the functions as they change.
- `npm run typecheck` typechecks the app, the tests and convex/.
- `npm run build` typechecks and builds the static files into dist/.
```

- The files under convex/\_generated/, convex/tsconfig.json and convex/README.md must be written by Convex's own command and committed as it writes them, never written by hand: by `npx convex dev --once`, and by `npx convex codegen --init` for convex/tsconfig.json and convex/README.md where the first does not write them. `.env.local` stays the engineer's file, never committed, and Convex's command may add the deployment's address to it. .gitignore must gain the line `.env.local`.
- Before this task the engineer logs in with `npx convex login`, makes the project and its development deployment in Convex's dashboard, and writes `.env.local` with the line `CONVEX_DEPLOYMENT` naming that deployment; the engineer runs no command that writes under convex/. While `.env.local` holds no `CONVEX_DEPLOYMENT` the task is blocked, and the builder never sets up a Convex project. Guidance: `npx convex dev --once` then writes the files and pushes the functions to that development deployment.
- convex/schema.ts must define exactly these tables (ADR 011, ADR 013):

```ts
// decks: one document per deck, in the shape of `Deck` with its owner.
{
  id: v.string(), // the deck's own id, made on the device
  owner: v.string(), // the owner's Clerk user id
  name: v.string(),
  dimensions: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      categories: v.array(v.object({ id: v.string(), name: v.string() })),
    }),
  ),
  cards: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      answers: v.record(v.string(), v.string()),
    }),
  ),
}
// indexes of decks: "by_owner" on ["owner"], "by_deck_id" on ["id"]

// learners: one row for each learner given their first deck.
{ learner: v.string() } // the learner's Clerk user id
// index of learners: "by_learner" on ["learner"]
```

- convex/owned.ts must hold every read of the `decks` table, as these four functions, and no other file but convex/decks.test.ts and convex/learners.test.ts reads a document of that table but through them (ADR 009):

```ts
/** The caller's Clerk user id, the `subject` of `ctx.auth.getUserIdentity()`; null when the caller is not signed in. */
export async function learnerOf(
  ctx: QueryCtx | MutationCtx,
): Promise<string | null>;

/** The owner helper: the document of the deck of this id, or null unless the caller is signed in, a deck holds the id and the caller owns it. */
export async function ownedDeck(
  ctx: QueryCtx | MutationCtx,
  id: string,
): Promise<Doc<"decks"> | null>;

/** Every document of the caller's decks, read through "by_owner" in the order they were made; none when the caller is not signed in. */
export async function ownedDecks(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"decks">[]>;

/** Whether a deck of any owner holds the id, read through "by_deck_id". */
export async function deckIdTaken(
  ctx: QueryCtx | MutationCtx,
  id: string,
): Promise<boolean>;
```

- A `Deck` a function returns must hold `id`, `name`, `dimensions` and `cards` and nothing else of the document.
- convex/schema.ts, convex/owned.ts, convex/decks.ts and convex/learners.ts must also typecheck under the compiler options of tsconfig.app.json, since the app will import the generated API and with it these four files: each import of a type is written `import type`, no local and no parameter stands unused, no syntax is used that cannot be erased, and no case of a `switch` falls through. The generated files, the tests and convex/test.setup.ts are not held to this.
- convex/decks.ts must export these functions, each validating its arguments with `v`:

```ts
// queries
list: {} -> Deck[] // the caller's decks, in the order they were made; [] when not signed in
get: { id: string } -> Deck | null // null when `ownedDeck` gives null

// mutations
createDeck: { id: string; name: string } -> Refusal | null
renameDeck: { deck: string; name: string } -> Refusal | null
deleteDeck: { deck: string } -> null
```

- `createDeck` must throw when the caller is not signed in or when `deckIdTaken` gives true for the id. Otherwise it must apply the act `createDeck` to the caller's decks, return the refusal and write nothing when the act refuses, and insert the deck with the caller as its owner and return null when it does not (ADR 011, ADR 012).
- `renameDeck` and `deleteDeck` must load the deck through `ownedDeck` and throw when it gives null. `renameDeck` must apply the act `renameDeck` to the caller's decks, return the refusal and write nothing when it refuses, and otherwise return null, writing the deck back unless the act returned the deck it was given, the same object. The deck it was given is the element, of the decks handed to the act, whose id is `args.deck`: the mutation compares the act's result with that element, never with the document `ownedDeck` gave. `deleteDeck` must delete the document.
- convex/learners.ts must export the mutation `startLearner: { deck: Deck } -> null`, its argument validated in the shape of the `decks` table without `owner`. It must throw when the caller is not signed in. When `learners` holds no row for the caller, it must add the row and insert `deck` with the caller as its owner, in the one transaction a mutation is; when it holds one, it must write nothing and return null, whatever `deck` it is given (ADR 013). For a caller with no row it must throw, and write nothing, when `deckIdTaken` gives true for the id of `deck`.
- Every test in convex/decks.test.ts and convex/learners.test.ts must call the functions through convex-test's in-memory backend as a learner set by `withIdentity`, or with no identity for a caller who is not signed in, and assert what the function returns and what the tables hold, which a test may read from the tables directly (ADR 018).
- convex/test.setup.ts must export `modules`, the function modules of convex/ that convex-test takes, found with `import.meta.glob`; the two test files pass it to `convexTest` with the schema. Guidance: a reference to the types of `vite/client` at the top of that file gives `import.meta.glob` its type under convex/tsconfig.json.
- Guidance: `withIdentity({ subject: "user_a" })` sets the Clerk user id that `learnerOf` reads.
- Guidance: the validator of a deck's fields is one value in convex/schema.ts, shared by the table and by `startLearner`'s argument.

**Out of scope**

- A mutation for an act on a card, a dimension or a category, or for Save answers: T3.
- convex/auth.config.ts, Clerk, or any provider in src/: a later cycle.
- Building the copy of the app's own deck, or calling `startLearner` from the app: an unsettled decision.
- A change to .github/workflows/check-and-deploy.yml: a later cycle.
- An HTTP endpoint or a Clerk webhook: never (ADR 013).

**Done when**

- These tests in convex/decks.test.ts pass:
  - `list returns the caller's decks in the order they were made and none of another learner's`
  - `list returns no deck and get returns null to a caller who is not signed in`
  - `get returns the caller's deck by its id as a Deck with no owner, and null for another learner's deck and for an id no deck holds`
  - `createDeck adds a deck owned by the caller and returns null`
  - `createDeck returns the refusal and writes nothing for an empty name and for a name the caller already uses`
  - `createDeck keeps a name another learner uses`
  - `createDeck throws when a deck already holds the id`
  - `renameDeck renames the caller's deck, and returns the refusal and writes nothing for a name the caller already uses`
  - `deleteDeck deletes the caller's deck`
  - `renameDeck and deleteDeck throw for another learner's deck and write nothing`
  - `createDeck, renameDeck and deleteDeck throw for a caller who is not signed in`
- These tests in convex/learners.test.ts pass:
  - `startLearner adds the learner's row and the deck on the first call`
  - `a second startLearner adds nothing`
  - `startLearner adds nothing for a learner who has deleted every deck`
  - `startLearner throws for a caller who is not signed in`
- Every test under src/ and convex/model/ passes under `npm test`.
- `npm run typecheck` exits with status 0, and exits with a status other than 0 while a type error stands in convex/decks.ts.
- `npx tsc --ignoreConfig --noEmit --strict --target es2021 --module esnext --moduleResolution bundler --skipLibCheck --verbatimModuleSyntax --noUnusedLocals --noUnusedParameters --erasableSyntaxOnly --noFallthroughCasesInSwitch convex/schema.ts convex/owned.ts convex/decks.ts convex/learners.ts` exits with status 0.

**Debrief**

None.

### T3 — One mutation per act on a deck's things

**Status**

- [ ]

**Goal**

Each act on a card, a dimension or a category, and Save answers, is one Convex mutation that loads the deck through the owner helper, applies the act, writes the deck back, and returns the refusal or what Save answers left out as its value, each proven under convex-test.

**Dependencies**

- T1: the nine acts on the things of a deck, `saveAnswers`, `Refusal` and `LeftOut` in convex/model/deckActs.ts.
- T2: `ownedDeck` in convex/owned.ts; convex/decks.ts and convex/decks.test.ts; the `decks` table; the Vitest project of convex/.

**Files**

- convex/decks.ts
- convex/decks.test.ts

**Details**

- convex/decks.ts must gain these ten mutations, each named after its act in convex/model/deckActs.ts and each validating its arguments with `v` (ADR 011):

```ts
addCard: { deck: string; id: string; name: string } -> Refusal | null
renameCard: { deck: string; card: string; name: string } -> Refusal | null
deleteCard: { deck: string; card: string } -> Refusal | null
addDimension: { deck: string; id: string; name: string } -> Refusal | null
renameDimension: { deck: string; dimension: string; name: string } -> Refusal | null
deleteDimension: { deck: string; dimension: string } -> Refusal | null
addCategory: { deck: string; dimension: string; id: string; name: string } -> Refusal | null
renameCategory: { deck: string; dimension: string; category: string; name: string } -> Refusal | null
deleteCategory: { deck: string; dimension: string; category: string } -> Refusal | null
saveAnswers: { deck: string; dimension: string; answers: { card: string; category: string }[] } -> Refusal | LeftOut
```

- `deck` is the deck's id, and the other arguments are the act's own.
- Each mutation must load the deck through `ownedDeck`, throw when it gives null, apply its act to the deck, return the refusal and write nothing when the act refuses, write nothing when the act returns the deck it was given, the same object, and otherwise write the changed deck back under the same owner (ADR 009, ADR 011, ADR 012).
- Each of the nine acts' mutations must return null when its act does not refuse. `saveAnswers` must return the act's `leftOut`, and must write nothing when the act returns the deck it was given, the same object. No test can tell that skipped write from a write of the same deck, which leaves the document's fields as they were, so the Debrief names the branch of convex/decks.ts that skips the write for the engineer to read.
- None of these ten mutations takes a whole deck, and none throws for a refusal (ADR 011, ADR 012).
- The task adds no module to convex/, so the files under convex/\_generated/ stay as T2 left them. What T2 says of the compiler options of tsconfig.app.json holds for convex/decks.ts as this task leaves it.
- Guidance: one function in convex/decks.ts that takes an act and returns its mutation's handler writes the load, the refusal and the write once.

**Out of scope**

- A change to an act in convex/model/deckActs.ts: never in this task.
- The hook that sends an act and names what was not kept, and every optimistic update: a later cycle.
- A `ConvexError` carrying a refusal: never (ADR 012).

**Done when**

- These tests in convex/decks.test.ts pass:
  - `each of the nine acts' mutations writes the deck its act returns and returns null`
  - `each of the ten mutations returns its act's refusal and writes nothing`
  - `each of the ten mutations throws for another learner's deck and writes nothing`
  - `each of the ten mutations throws for a caller who is not signed in`
  - `saveAnswers writes the answers that fit and returns the ids it left out`
  - `saveAnswers whose every answer is left out leaves the deck's document as it was and returns the ids left out`
  - `saveAnswers returns the refusal and writes nothing for a dimension the deck lacks`
- Every other test passes under `npm test`.
- `npm run typecheck` exits with status 0.
- `npx tsc --ignoreConfig --noEmit --strict --target es2021 --module esnext --moduleResolution bundler --skipLibCheck --verbatimModuleSyntax --noUnusedLocals --noUnusedParameters --erasableSyntaxOnly --noFallthroughCasesInSwitch convex/schema.ts convex/owned.ts convex/decks.ts convex/learners.ts` exits with status 0.

**Debrief**

None.
