# PDR 012: A list of decks starting with a copy

## Status

Active

## Context

A learner keeps several decks of their own, for example one per subject.

PDR 001 promises a board of up to about 30 cards and 6 zones that fits a desktop screen without scrolling, and PDR 008 holds the dimension picker, the pool and the zones on that one screen.

A learner makes, renames and deletes decks as well as sorting them. PDR 011 makes a deck through a field ending the list of decks, and renames or deletes it through the ⓘ on it there.

A learner tells decks apart by what they are about, and PDR 009 keeps every name in a learner's list of decks to one deck.

A learner may already have sorted the app's own deck before having decks of their own. A learner making their first deck has no example of what a deck holds unless the app gives one.

## Decision

We will show a learner their own decks in a list on a screen of its own, each by its name, open a deck's board from it, and let the learner return to the list from the board.

We will have the learner name every deck when making it, and let them change the name at any time.

We will start every learner's list with one deck, a copy of the app's own deck, which is theirs to change or delete.

## Alternatives considered

### A deck picker on the board

Rejected because it takes space from the board and leaves no room for making and deleting decks.

### Numbered decks with optional names

Rejected because the learner has to open the decks to tell them apart.

### The app's own deck always in the list and unchangeable

Rejected because a deck the learner cannot change or remove looks broken in a list of their own.

### An empty list to start

Rejected because the learner starts from a blank page with no example.

## Consequences

### Positive

- The learner sees all their decks at a glance, finds one by what it is about, and sorts on an uncrowded board.
- Every new learner starts with one working deck to sort, study or reshape.

### Negative

- A learner moving from one deck to another passes through the list.
- A learner who has reshaped or deleted their copy of the app's own deck cannot get it back as it was.

### Neutral

- A learner with decks of their own meets the app on two screens, the list of decks and the board.
