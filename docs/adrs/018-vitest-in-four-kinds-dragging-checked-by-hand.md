# ADR 018: Vitest in four kinds, dragging checked by hand

## Status

Active

## Context

ADR 006, which this record replaces, ran three kinds of test under Vitest, and its component tests acted on the board by click and by keyboard, placing cards by selecting and sending them. ADR 014 removes selecting and sending, and the app now has Convex functions.

ADR 001 runs the tests under Vitest, by an npm script. The record rules require the repository to hold one test, the record citation guard, whose failure lists every live site that cites a record whose Status is not Active, with that Status, and require AGENTS.md to give the command that runs it.

ADR 015 fits each board by a pure reducer and a pure fitting function, ADR 007 checks the app's own deck with a hand-written validator, and ADR 011 writes each act on a deck as a pure function in `convex/model/deckActs.ts`. Each gives an exact result to a call that supplies its inputs, with no browser and no rendered component.

ADR 014 places a card only through dnd-kit's pointer sensor, which finds the zone under the pointer by measuring the elements' positions and sizes. jsdom gives no element a position or a size, so no drag runs there.

ADR 016 has the board render from a deck, a board and a dispatch it is given, with an object of acts for a learner's own deck.

PDR 007, PDR 010 and PDR 011 put marks, a score, Retry, Save answers, fields and panels on the board, and PDR 009 shows an error in place of the board for a broken app's own deck. Each is visible only through the rendered components.

ADR 009 checks each deck's owner through one helper, which fails silently in a function that skips it. ADR 013 gives a learner the copy of the app's own deck by a mutation that adds nothing on a second call.

`convex-test` runs Convex functions against an in-memory backend inside Vitest, in the `edge-runtime` environment, with an identity set per call by `withIdentity`. Vitest runs several projects, each in an environment of its own, under one command.

A browser automation tool such as Playwright downloads browsers and runs under a runner of its own beside Vitest, and with Clerk and Convex it needs signed-in test accounts. dnd-kit's own repository tests its sensors.

ADR 010 runs every test in the check job on every pull request and every push to main, before the deploy job.

The record rules name a live site as a line in code, AGENTS.md or docs/backlog.md that cites a record by number, and name no other file under docs/. The records and the docket cite records that are not Active, and a number no record holds names nothing. A later cycle may add a folder to the code.

## Decision

We will run every test under Vitest by one command, which AGENTS.md names as the citation guard's command.

We will test the board's reducer and its fitting function, the validator of the app's own deck and each act in `convex/model/deckActs.ts` as pure functions, by unit tests that call each with its inputs and assert its result.

We will test every act of the learner other than dragging, and the error shown for a broken app's own deck, by component tests that render the components in jsdom with React Testing Library from a board built by the reducer's own actions, cards placed included, and assert what shows and what is dispatched.

We will test the Convex functions with `convex-test`, in a Vitest project of their own for `convex/` in the `edge-runtime` environment, calling each through its in-memory backend as a learner set by `withIdentity` and asserting what it returns and what the tables hold, with the owner helper tested by a call from another learner refused and `startLearner` by a second call adding nothing.

We will write no automated test of dragging and add no browser automation tool, and we will check the drag path by hand in the served browsers at each cycle's review.

We will write the record citation guard as one Vitest test that reads every tracked file outside docs/, and docs/backlog.md, for a citation of a PDR or an ADR by number; reads docs/adrs/ and docs/pdrs/ for each record's Status and no other file under docs/; and fails listing each citation of a record whose Status is not Active, with that Status, and each citation of a record that no file holds.

## Alternatives considered

### A browser automation tool for the drag path

Rejected because it adds browser downloads and a second runner, and needs signed-in test accounts with Clerk and Convex.

### Firing dnd-kit's drag end by hand

Rejected because the tests then rest on dnd-kit's internals.

### A prop for an initial state used only by tests

Rejected because a component of the app then carries a prop only tests use.

### Unit tests only

Rejected because the marks, the score, the fields and the error screen live in components and go untested.

### No test of the Convex functions

Rejected because a broken owner check lets any signed-in learner change another's deck with nothing failing.

### A local Convex backend run in the check job

Rejected because it is a second process and a deployment for tests the in-memory backend runs.

### The citation guard as a shell script

Rejected because it is then a second runner and command beside Vitest.

### The guard reading every tracked file

Rejected because the records and the docket must cite records that are not Active, and the guard would carry an exception list keyed to their layout.

### The guard reading a fixed list of paths

Rejected because a citation in a folder added later passes unseen.

### The guard reading every file under docs/ but the records and the docket

Rejected because the record rules name no file under docs/ but the backlog a live site.

### The guard passing a citation of a record no file holds

Rejected because a mistyped number then cites nothing and nothing fails.

## Consequences

### Positive

- The next developer runs every test with one command, found in AGENTS.md, with no deployment.
- Every rule of PDR 007 shown on screen has a component test.
- A Convex function that lets another learner through the owner check fails a test.
- A stale citation, or a citation of a record no file holds, in any tracked file outside docs/ or in the backlog, fails the tests whatever folder holds it.

### Negative

- The drag path, a broken drop handler included, can regress with no test failing, and the engineer checks it by hand in the served browsers at each cycle's review.
- A behaviour only Convex's real backend shows, such as its limits, goes untested.
- The next developer carries jsdom, React Testing Library, `convex-test` and `edge-runtime` as development dependencies.

### Neutral

- The next developer cites a record that is not Active in a record's Status or in the docket without failing the guard, because neither is read as a live site.
