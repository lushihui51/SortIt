# PDR 004: Reset and a change of dimension clearing the board at once

## Status

Active

## Context

PDR 002 gives a board with a dimension picker, a pool and one zone per category of the chosen dimension, and PDR 003 adds a mark on each card and a score after Check. Starting over means returning the cards to the pool and removing the marks and the score.

The common case for starting over is retrying the same dimension: the learner has checked, or has lost their way, and wants a fresh pile under the same categories.

The categories of one dimension differ from those of another, so a placement made under one dimension has no meaning under another and cannot carry across.

A confirmation before an act that clears the board would protect a full board from one mis-click, at the price of a dialog on every such act.

## Decision

We will have Reset return every card to the pool and remove every mark and the score, leave the chosen dimension chosen, and act at once, without a confirmation.

We will have choosing another dimension clear the board as Reset does and show the new dimension's zones, and we will have choosing the current dimension again do nothing.

## Alternatives considered

### Reset also unchoosing the dimension

Rejected because it adds a step to the common case of retrying the same dimension.

### A confirmation before Reset

Rejected because it puts a dialog on every reset; the cost accepted is that one mis-click can lose a full board.

### A confirmation before a change of dimension while cards are placed

Rejected because it puts a dialog on every change of dimension.

## Consequences

### Positive

- The learner starts over on the same dimension with one action.
- The learner moves between dimensions freely and always starts a dimension from a full pool.

### Negative

- A learner who mis-clicks Reset or another dimension loses a full board, with no way back.

### Neutral
