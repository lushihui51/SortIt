# PDR 010: Answers set by saving the sorted board

## Status

Active

## Context

A learner sets the answers of their own decks themselves: which category of each dimension is each card's answer. The app's own deck is written in the repository, and its answers change only there.

The learner sorts by moving cards from the pool into zones, one zone per category of the chosen dimension (PDR 008). Where a card lies on the board is already a choice of one category for it.

The product owner wants setting answers to take no more effort than sorting.

A deck of the learner's own can hold cards with no answer under a dimension while its answers are being set (PDR 009), and a no-answer mark shows which they are (PDR 007).

A learner may set the answers of a large deck in batches. Reset returns every card to the pool and leaves the chosen dimension chosen (PDR 004), so a learner can sort part of a deck and then clear the board for the next part.

A learner testing themselves on a deck of their own may sort it wrongly, and a press that saves that sort turns the deck's right answers wrong. A learner building a deck saves answers for cards that had none, often and in batches.

## Decision

We will offer Save answers on a learner's own decks and nowhere else.

We will let the learner choose any dimension of their own deck, whether or not every card has an answer in it, and have Save answers make the category of the zone each card lies in that card's answer under the chosen dimension.

We will have Save answers leave the answer of every card in the pool as it was.

We will have Save answers save at once when it changes no existing answer, and, when it would change one or more, first ask the learner, naming how many, and save only if they confirm.

## Alternatives considered

### A form per card

The learner would set each card's answer in each dimension by choosing it on a form. Rejected because thirty cards in two dimensions mean sixty separate choices, unlike the sorting the learner knows.

### Save answers on every deck, with sign-in on pressing it

Rejected because the board the learner arranged is gone once signing in leads to their list of decks.

### Cards in the pool losing their answer

Rejected because a learner who saves after placing a few cards wipes the answers of every other card in that dimension.

### Saving at once, with a brief Undo

Rejected because a learner who misses the message keeps the mistakes with no word on what changed.

### Saving at once, with no question

Rejected because one press can silently turn a deck's right answers wrong.

## Consequences

### Positive

- The learner sets answers by sorting the board and pressing one button.
- The learner sets answers in batches without undoing earlier ones.
- The learner builds answers without pauses, and is warned, with a count, before any existing answer changes.
- A learner trying the app meets no Save answers that cannot work for them.

### Negative

- A learner who saves a mistaken sort, and confirms where asked, makes its mistakes the answers.
- The learner can change a card's answer but never clear it.

### Neutral

- The learner sets answers one dimension at a time, by choosing that dimension and sorting it.
