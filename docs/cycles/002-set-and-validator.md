# Cycle 002: Set and validator

Waits for: 001, the npm scripts `typecheck` and `test` in package.json and the TypeScript configuration in tsconfig.app.json.

## Goal

Outcome: The repository holds the first set, 30 animals in two dimensions of which Habitat has 6 categories, as one JSON file typed by the set's TypeScript type, and a validator that finds the first fault of a set against the rules of PDR 005, proven by unit tests and run as a test over the shipped file.

Scope: The cycle covers the set's TypeScript type, the validator and its unit tests, the JSON data file with the first set, its typed import, the test that runs the validator over the shipped file, and the vocabulary's Code cells for the set's concepts. It leaves out running the validator when the app starts and the error shown in place of the board, which wait on the sentence for each fault, and it leaves out every component of the board.

Judgement: The engineer runs `npm test` and sees the validator's tests and the shipped-set test pass. The engineer removes one answer from src/set/set.json, sees `npm test` fail naming that item and that dimension, and restores it. The product owner reads src/set/set.json and checks every item's answers.

## Records

- PDR 005: Rules a set must meet, with an error naming its first fault
- ADR 004: One bundled JSON file keyed by name, with a hand-written validator in the app and the tests

## Tasks

### T1 — Set type and validator

**Status**

- [x]

**Goal**

A set has one TypeScript type, and one function returns the first fault a set has against the rules of PDR 005, or null, with a unit test for every rule.

**Dependencies**

None.

**Files**

- src/set/itemSet.ts (new)
- src/set/findFirstFault.ts (new)
- src/set/findFirstFault.test.ts (new)
- docs/vocabulary.md

**Details**

- src/set/itemSet.ts must export exactly these types (ADR 004):

  ```ts
  export type Dimension = { name: string; categories: string[] };
  export type Item = { name: string; answers: Record<string, string> };
  export type ItemSet = { dimensions: Dimension[]; items: Item[] };
  ```

  `answers` maps a dimension's name to one category name of that dimension. Nothing in the set has an id.
- src/set/findFirstFault.ts must export exactly this type and this function:

  ```ts
  export type SetFault =
    | { kind: 'noItem' }
    | { kind: 'noDimension' }
    | { kind: 'tooFewCategories'; dimension: string }
    | { kind: 'duplicateItem'; item: string }
    | { kind: 'duplicateDimension'; dimension: string }
    | { kind: 'duplicateCategory'; dimension: string; category: string }
    | { kind: 'answer'; item: string; dimension: string };

  export function findFirstFault(set: ItemSet): SetFault | null;
  ```

- `findFirstFault` must check the rules of PDR 005 and no other, in this order, and return the first fault it meets:
  1. `noItem` when the set has no item.
  2. `noDimension` when the set has no dimension.
  3. `tooFewCategories` for the first dimension, in file order, with fewer than two categories.
  4. `duplicateItem` for the first item name, in file order, that an earlier item already bears.
  5. `duplicateDimension` for the first dimension name, in file order, that an earlier dimension already bears.
  6. `duplicateCategory` for the first category, dimensions in file order and categories in file order within one, that an earlier category of the same dimension already bears.
  7. `answer` for the first item, in file order, and the first dimension, in file order, for which the item's `answers` holds no entry under the dimension's name or holds a value that is not one of the dimension's categories.
- A key in `answers` that names no dimension is never a fault (ADR 004: these rules and no other).
- `findFirstFault` must not change the set it is given.
- src/set/findFirstFault.test.ts must hold one test per fault kind, each on a set that has that fault and no other, asserting the exact `SetFault` object with `toEqual`; one test on a set with no fault asserting `null`; and one test on a set with both a repeated item name and a bad answer asserting the `duplicateItem` fault, which proves the order. Test names must say the rule they prove, in the words of PDR 005.
- In docs/vocabulary.md, the Code cell of the Dimension row must read `` `Dimension` in src/set/itemSet.ts ``, the Code cell of the Card row must read `` `Item` in src/set/itemSet.ts ``, and the Code cell of the Zone row must read `` one of `Dimension.categories` in src/set/itemSet.ts ``. Where cells stay as they are.

**Out of scope**

- A sentence for any fault, and the error shown in place of the board: a later cycle, held by an open question.
- Running the validator when the app starts: the same later cycle.
- A rule on the size of a set: never; PDR 001 keeps a set of any size.
- A check of the JSON file's shape beyond the TypeScript type: never; ADR 004 checks the shape at compile time.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/set/findFirstFault.test.ts with 9 tests passed.

**Debrief**

- `npm run typecheck` exited 0.
- `npm test -- --reporter=default` printed `✓ src/set/findFirstFault.test.ts (9 tests)` beside `✓ src/recordCitationGuard.test.ts (1 test)`, then `Tests  10 passed (10)`. A bare `npm test` run inside this agent session printed only the totals, because Vitest picks a quieter reporter when it detects an agent; from a plain terminal it lists the files.
- `npm run build` exited 0.
- Departure: none from the Details. The no-fault test also gives the set an answers key naming no dimension and asserts that the set is unchanged after the call, and the answer test asserts both the missing entry and the value outside the categories. This proves the two other constraints without adding a test, so the count stays at 9.
- To read: src/set/findFirstFault.ts, `findFirstFault`, the answer loop. It treats an answer as present only when `Object.hasOwn` finds it, so an inherited key such as `toString` never counts as an answer.

### T2 — The first set

**Status**

- [ ]

**Goal**

The repository ships one set of 30 animals in the dimensions Habitat and Diet, typed by `ItemSet` at compile time and passed by `findFirstFault` in a test.

**Dependencies**

- T1: `ItemSet` in src/set/itemSet.ts and `findFirstFault` in src/set/findFirstFault.ts.

**Files**

- src/set/set.json (new)
- src/set/shippedSet.ts (new)
- src/set/shippedSet.test.ts (new)
- tsconfig.app.json

**Details**

- src/set/set.json must hold the one set, shaped as `ItemSet`, with exactly 30 items and exactly two dimensions (LPD3: the first set is a set of animals of about 30 items and at least two dimensions, one of 6 categories, written during the build and checked by the product owner).
- The first dimension must be named `Habitat` with these six categories in this order: `Ocean`, `Forest`, `Desert`, `Grassland`, `Arctic`, `Freshwater`. The second must be named `Diet` with these three in this order: `Herbivore`, `Carnivore`, `Omnivore`.
- Every item must be an animal under its common English name, capitalised as a name, each name once, with one answer for Habitat and one for Diet drawn from those categories. Guidance: choose animals whose habitat and diet a general reader places without hesitation, and spread the items so that every category of each dimension holds at least two.
- src/set/shippedSet.ts must import the JSON file and export it as the typed set, and nothing else (ADR 004):

  ```ts
  import set from './set.json';
  import type { ItemSet } from './itemSet';

  export const shippedSet: ItemSet = set;
  ```

  Guidance: if the import fails to typecheck, add `"resolveJsonModule": true` to the compiler options of tsconfig.app.json.
- src/set/shippedSet.test.ts must hold one test asserting that `findFirstFault(shippedSet)` is `null` (ADR 004), and no test on the set's size.

**Out of scope**

- A second set, or a way to choose one: never; PDR 006 ships one set.
- An id on any dimension, category or item: never; ADR 004 keys by name.
- A test pinning the number of items or categories: never; the set is edited by hand and the test would fail on every edit.
- The error shown for a broken set: a later cycle, held by an open question.

**Done when**

- `npm run typecheck` exits 0.
- `npm test` passes and lists src/set/shippedSet.test.ts with 1 test passed.
- `node -e "const s=require('./src/set/set.json');console.log(s.items.length,s.dimensions.map(d=>d.name+':'+d.categories.length).join(' '))"` prints `30 Habitat:6 Diet:3`.
- With one item's Habitat answer deleted from src/set/set.json, `npm test` fails and its output holds `kind: 'answer'`, that item's name and `Habitat`; the deletion is then reverted and `npm test` passes again.

**Debrief**

None.
