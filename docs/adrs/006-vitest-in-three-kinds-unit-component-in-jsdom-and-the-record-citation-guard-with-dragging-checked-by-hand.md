# ADR 006: Vitest in three kinds, unit, component in jsdom and the record citation guard, with dragging checked by hand

## Status

Active

## Context

ADR 001 runs the tests under Vitest, by an npm script. The record rules require the repository to hold one test, the record citation guard, whose failure lists every live site that cites a record whose Status is not Active, with that Status, and require AGENTS.md to give the command that runs it.

ADR 003 holds the board in a pure reducer whose shuffling actions carry their source of random numbers, and ADR 004 checks the set with a hand-written validator and runs that validator as a test over the shipped file. Each is a function of its inputs alone and gives an exact result to a call that supplies them, with no browser and no rendered component.

ADR 002 implements selecting a card and sending it, by tap, click or keyboard, as app state over native buttons in one code path, with no dnd-kit sensor, and confines dnd-kit to the components that bind cards, zones and the pool to it. A native button receives a click and a key press in a simulated document such as jsdom.

dnd-kit's pointer sensor starts a drag from pointer events and finds the zone under the pointer by measuring the elements' positions and sizes. A simulated document gives no element a position or a size, so a drag runs only in a browser.

PDR 002 gives the learner three ways to move a card, dragging among them, and PDR 001 serves the current desktop versions of Chrome, Safari and Firefox and a phone held in portrait, so a drag is made by mouse and by touch. PDR 003, PDR 004 and PDR 005 give the acts and the screens around placing: Check enabling only once the pool is empty, a mark on each card and a score, Retry, Reset, a change of dimension, and the error shown in place of the board for a broken set. Each is visible only through the rendered components.

A browser automation tool such as Playwright downloads browsers and runs under a runner and a command of its own beside Vitest. dnd-kit's own repository tests its sensors.

ADR 005 runs every test in the check job on every pull request and every push to main, and the deploy job runs only after the check job passes.

The record rules name a live site as a line in code, AGENTS.md or docs/backlog.md that cites a record by number, and name no other file under docs/. The records and the docket cite records by number too, and must cite records that are not Active: a superseding record names the record it replaces, a superseded record's Status points to its replacement, and the docket lists a PDR that is not Active under a section of its own. A record is cited by its type and number, and a number no record holds names nothing.

The code's folders are not laid out yet, and a later cycle may add a folder.

## Decision

We will run every test under Vitest by one command, which AGENTS.md names as the citation guard's command.

We will test the reducer and the validator as pure functions, by unit tests that call each with its inputs and assert its result.

We will test every act of the learner other than dragging, and the error shown for a broken set, by component tests that render the components in jsdom with React Testing Library and act on them by click and by keyboard.

We will write no automated test of dragging and add no browser automation tool, and we will check the drag path by hand in the served browsers at each cycle's review.

We will write the record citation guard as one Vitest test that reads every tracked file outside docs/, and docs/backlog.md, for a citation of a PDR or an ADR by number; reads docs/adrs/ and docs/pdrs/ for each record's Status and no other file under docs/; and fails listing each citation of a record whose Status is not Active, with that Status, and each citation of a record that no file holds.

## Alternatives considered

### A browser automation tool for the drag path

Rejected because it adds browser downloads and a second runner for one interaction the library itself tests.

### Unit tests of the reducer and the validator only

Rejected because the tap and keyboard paths, Check enabling and the error screen live in components and would go untested.

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

- The next developer runs one command for every test, and finds it in AGENTS.md.
- A stale citation in any tracked file outside docs/, or in the backlog, fails the tests for the next developer whatever folder holds it, and so does a citation of a record no file holds.
- The next developer tests the tap, click and keyboard paths, Check enabling and the error screen without a browser.

### Negative

- The drag path can regress with no test failing, and the engineer checks it by hand in the served browsers at each cycle's review.
- The next developer carries jsdom and React Testing Library as development dependencies.

### Neutral

- The next developer cites a record that is not Active in a record's Status or in the docket without failing the guard, because neither is read as a live site.
