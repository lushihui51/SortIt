# PDR 006: One set and nothing kept beyond the visit

## Status

Active

## Context

The first release is kept short: one page for sorting one set. The set lives in one hand-edited data file in the repository, and there is no second set and no one to write one.

PDR 002 gives the screen before a dimension is chosen: every card in the pool, the dimension picker and no zone. A page refresh is an act of the browser, and the app chooses what the learner meets after it, the board as it was or that first screen.

A board kept in the browser across a refresh would also come back after days, and the learner would have no way to tell a fresh board from a stale one.

Many things a quiz app can offer sit around the sorting itself: accounts, saved progress, leaderboards, an editor for sets, more than one set, timers, a history of scores and spaced repetition. Each is visible to the learner, and each adds to the build.

## Decision

We will ship one set, and no accounts, no saved progress, no leaderboards, no in-app editor for sets, no timers, no scoring history and no spaced repetition.

We will have a page refresh start over with an empty board and no dimension chosen.

## Alternatives considered

### Remembering the board in the browser across a refresh

Rejected because the learner can meet a stale board from an earlier day with no way to tell.

### Any of the left-out features in the first release

Rejected because the first release is kept short.

## Consequences

### Positive

- The learner never meets a stale board from an earlier visit.

### Negative

- A learner who refreshes the page loses their board and starts again.
- The learner has one set to sort and keeps no score or progress between visits.

### Neutral

- The learner gets a board to sort and nothing that outlives the visit.
