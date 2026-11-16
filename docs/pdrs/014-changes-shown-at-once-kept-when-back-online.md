# PDR 014: Changes shown at once, kept when back online

## Status

Active

## Context

PDR 013 keeps every change a signed-in learner makes to their decks as it is made, and brings back the same decks on every device they sign in on.

A learner's connection can drop, for a moment or for longer, and a learner building a deck makes many changes in a row.

While a change waits to be kept, the learner cannot tell from the screen alone whether it has been kept.

PDR 013 starts the sort over when the learner reloads a deck's board.

One deck can be changed from several devices, and another device can rename or delete things in it while one device's changes wait.

PDR 009 holds the names of cards, of dimensions and of a dimension's categories unique within a deck, and the names of a learner's decks unique among them, and PDR 011 lets the learner delete a card, a category or a dimension. A change kept late can therefore give a name another device has given meanwhile, or change something another device has deleted.

PDR 010 has Save answers set, in one press, the answer of every card lying in a zone under the chosen dimension.

A learner sets a large deck's answers in batches, clearing the board by Reset between them.

Each answer a Save answers sets belongs to one card and one category.

A learner may be in the middle of dragging a card when a late change is kept.

## Decision

We will show every change a learner makes to their decks at once, whatever the connection, and keep the changes still waiting as soon as the connection returns, without reloading the page and with the board left as the learner left it.

We will show a line at the top of the board or of the list of decks while one or more changes are not yet kept, and take it away once every change is kept.

We will keep no change that is still waiting when the learner closes the page.

We will leave out a change kept late that no longer fits the deck as kept, because its name is now taken where it is held or the card, category or dimension it changes is now deleted, return the screen to the deck as kept, and show a line at the top naming what was not kept and why, while keeping every other waiting change that still fits.

We will keep, of a Save answers kept late, the answer of each card the deck still holds in a category the deck still holds, and leave out the rest as a change that no longer fits.

## Alternatives considered

### Undoing a change that cannot be kept at once, with a word saying so

Rejected because every change made during a drop has to be redone by hand.

### Locking the deck while the connection is down

Rejected because the learner cannot tell whether their last change was kept, and a short drop stops them mid-build.

### Reloading the page when the connection returns

Rejected because it starts over the sort the learner was working on.

### Leaving out a change that no longer fits, with no line

Rejected because the learner's change disappears unnoticed.

### Keeping a change that no longer fits, adjusted to fit

Rejected because the deck would hold names the learner never typed, and a deletion made on purpose would come back.

### A Save answers kept late left out whole when any card or category it answers is deleted

Rejected because one card deleted on another device loses the answers of every other card in the batch, and a learner who has cleared the board for the next batch sorts the lost ones again.

### A box over the board naming what was not kept

Rejected because it interrupts the learner, possibly mid-drag.

### The typed name back in its field with the refusal under it

Rejected by the product owner's choice of the line.

## Consequences

### Positive

- A learner keeps working through a dropped connection and loses nothing they made while the page stays open, except a change another device has meanwhile made unfit.
- A learner sees from a line whether any change is still waiting.
- A learner whose late change is left out reads which change it was and why.
- A learner whose Save answers is kept late loses only the answers to cards and categories deleted meanwhile.
- The learner never finds in a deck a repeated name, a name they did not type, or something they deleted come back, whatever order changes arrive in.

### Negative

- A learner who closes the page while changes wait loses them.
- A learner whose late change is left out redoes it by hand.
- A learner can find fewer answers changed than the question before Save answers named.

### Neutral

- A learner sees a change on screen before it is kept, and sees it undone when it no longer fits.
