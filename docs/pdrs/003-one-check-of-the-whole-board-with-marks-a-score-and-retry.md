# PDR 003: One Check of the whole board, with marks, a score and Retry

## Status

Active

## Context

PDR 002 gives the learner a board on which they place every card by hand, in any order, and change any placement until they have the board checked. The quiz is about committing to a sort of the whole set: the learner's claim is the whole board, not any one card.

Some learners cannot tell apart the colours a mark would use. The learner reads a verdict on the board, where the cards lie.

A set holds up to about 30 items, under PDR 001, so a count of correct cards is concrete to the learner in a way a percentage of a small set is not.

After a verdict, the learner's next step is to fix what was wrong. The learner can try again, and each try narrows the choice for a card. No deadline is set that would cut a second try out of the first release.

A try after a verdict puts the returned cards back among the cards judged correct, and every card on the board was placed by the learner's hand. A card moved after its verdict may come to lie where the verdict no longer holds. A learner may take hold of a card by accident, and a drag once started may be cancelled.

## Decision

We will enable Check only once the pool is empty, and judge every placement at once.

We will show, after Check, on each card where it lies, whether it is correct or incorrect, by a colour and an icon together.

We will show on an incorrect card only that it is incorrect, never the category it belongs to.

We will show, after Check, the score beside the board as the count of correct cards over the count of all cards.

We will offer Retry after a check. Retry returns only the incorrect cards to the pool, in random order, and removes their marks and the score; correct cards stay in their zones with their marks, and Check enables again once the pool is empty.

We will let the learner, after Retry, move a card marked correct as they can any other card. The card loses its correct mark the moment the learner takes hold of it, whether by starting a drag or by selecting it, and it is judged again at the next Check wherever it then lies, the same zone included.

## Alternatives considered

### Check at any time, with unplaced cards counted wrong

Rejected because the score then mixes "not placed" with "wrong".

### Judging each drop as it lands

Rejected because the sort becomes trial and error and nothing is committed.

### Colour alone for the mark

Rejected because a colour-blind learner cannot read it.

### A results list apart from the board

Rejected because the learner has to map the list back to the cards.

### Naming the right category on each incorrect card

Rejected because the learner is told the answer at once and nothing is left to try.

### A percentage for the score

Rejected because a percentage is less concrete than a count for a small set.

### No score

Rejected because the learner has to count the marks.

### Leaving Retry out

Rejected because the learner must redo every placement, correct ones included, to fix one mistake.

### Correct cards held in place after Retry

Correct cards would stay where they lie, beyond the learner's reach, until Reset or a change of dimension clears the board. Rejected because every card on the board stays the learner's to move.

### A moved correct card keeping its mark

Rejected because a card marked correct could then lie in a zone where it is wrong.

### Removing the mark only when the card is dropped or sent

Rejected because a cancelled drag would keep a mark on a card the learner has already disturbed.

## Consequences

### Positive

- The learner decides every card before seeing any verdict.
- The learner reads the verdict of every card at a glance, with or without colour.
- The learner gets one number per check that says how many they got right out of how many.
- The learner finds an incorrect card's category by trying again, and works only on the cards they got wrong.
- The learner may rearrange the whole board after Retry, right answers included.
- The learner sees a correct mark on a card only while the card lies where it was judged, so every mark on the board can be trusted.

### Negative

- The learner gets no verdict on a partial sort and places every card before any feedback.
- A learner who wants to be told the right category is not told it and finds it by trying.
- A learner who takes hold of a correct card by accident sees its mark go and must place the card again.

### Neutral
