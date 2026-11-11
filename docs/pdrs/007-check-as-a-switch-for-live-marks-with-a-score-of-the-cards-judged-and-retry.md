# PDR 007: Check as a switch for live marks, with a score of the cards judged and Retry

## Status

Active

## Context

The learner sorts by placing each card by hand from a pool into zones, one zone per category of the chosen dimension, and moves any card again whenever they like. A verdict tells the learner whether a card lies in the zone of its category.

Learners differ in when they want a verdict. Some want to commit to a sort of the whole deck before seeing any verdict. Others want to see a verdict as soon as a card lands, and to place the cards they are unsure of by trying.

PDR 003, which this record replaces, enabled Check only once the pool was empty and judged the whole board at once. A learner unsure of a card had to guess it before getting any verdict.

A deck the learner builds can hold a card with no answer under a dimension while its answers are being set, and the learner building it needs to see which cards still lack one.

A card with no answer under the chosen dimension has no right zone, so no placement of it can be judged, and a mark saying it has no answer gives away no verdict.

Some learners cannot tell apart the colours a mark would use. The learner reads a verdict on the board, where the cards lie.

A score that changes as a card moves tells the learner whether that card is right, whether or not any mark is showing.

A card in the pool has no placement to judge. A score that counts such cards along with the wrong ones mixes "not placed" with "wrong".

PDR 001 names a dimension of up to about 30 cards as the size a desktop board holds, so a count of correct cards is concrete to the learner in a way a percentage of a small deck is not.

After a verdict, the learner's next step is to fix what was wrong. A learner who sorts without verdicts and then asks for one can find many wrong cards at once.

PDR 004 has Reset return every card to the pool and remove every verdict mark and the score, and has choosing another dimension clear the board the same way. Both give the learner a fresh board to sort.

## Decision

We will make Check a switch the learner turns on and off at any time, and leave every card free to move whether it is on or off.

We will show, while Check is on, on every card in a zone that has an answer under the chosen dimension whether it is correct or incorrect where it lies now, and change that mark the moment the card lands elsewhere; no card in the pool shows correct or incorrect, and while Check is off no card does.

We will show on every card with no answer under the chosen dimension a no-answer mark, wherever it lies and whether Check is on or off, and never show it correct or incorrect.

We will show each mark by a colour and an icon together.

We will show on an incorrect card only that it is incorrect, never the category it belongs to.

We will show a score only while Check is on: the count of correct cards over the count of cards judged, which are the cards in a zone with an answer under the chosen dimension, beside the board, changing the moment a card enters a zone, leaves one or moves between zones.

We will offer Retry while Check is on and at least one card in a zone is incorrect. Retry returns every incorrect card to the pool, in random order, and leaves every other card where it lies.

We will leave Check on or off as it was when the learner presses Reset or chooses another dimension.

## Alternatives considered

### Check only once the pool is empty

The learner would get verdicts only once every card is placed, and all at once. Rejected because the learner must guess every card they are unsure of before getting any verdict.

### A no-answer mark only while Check is on

Rejected because a learner building a deck with Check off sees no sign of what is left to do.

### Check as a one-off verdict, each mark lost when its card is taken hold of

Rejected because the learner presses Check again after every move to see where they stand.

### Colour alone for the mark

Rejected because a learner who cannot tell the colours apart cannot read it.

### A results list apart from the board

Rejected because the learner has to map the list back to the cards.

### Naming the right category on each incorrect card

Rejected because the learner is told the answer at once and nothing is left to try.

### A card with no answer counted as incorrect

Rejected because the score would blame the learner for an answer the deck lacks.

### A score of correct cards over all cards

Rejected because two wrong cards with the rest unplaced read the same as a board of wrong cards.

### A score of correct cards over cards judged, with a count still to sort

Rejected because the pool already shows what remains, and a second figure adds words to read.

### No score while cards remain in the pool

Rejected because the learner has to count the marks themselves.

### A percentage for the score

Rejected because a percentage is less concrete than a count for a small deck.

### A score always visible

Rejected because, with Check off, the learner reads each card's verdict from the score changing as the card moves.

### No score

Rejected because the learner has to count the marks themselves.

### Retry while Check is off

Rejected because which cards leave the board would give away the verdict the learner chose not to see.

### No Retry

Rejected because a learner with many wrong cards moves them one by one or places every card again.

### Retry clearing the whole board

Rejected because it would do what Reset does.

### Reset and a change of dimension turning Check off

Rejected because a learner who wants live marks has to turn Check on again after every fresh board, and may place cards before noticing.

## Consequences

### Positive

- The learner chooses between sorting with live verdicts and sorting without them, and switches between the two at any time.
- A learner unsure of a card can place it and see at once whether it is right.
- The learner reads every verdict on the card it concerns, with or without colour.
- The learner reads a score that matches the marks on the board exactly, and that speaks only of cards that can be right or wrong.
- A learner building a deck sees at all times which cards still need an answer.
- With Check off, the learner meets nothing on the board that gives a verdict away.
- The learner clears every wrong card with one press and keeps every right one in place.
- The learner chooses their way of sorting once, and the app keeps to it on every fresh board.

### Negative

- A learner with Check on can sort by trial and error, and nothing in the app asks them to commit to a whole sort before a verdict.
- A learner who wants to be told the right category is not told it and finds it by trying.
- A learner who left Check on sees marks on a fresh board as soon as they place a card.
- A learner sorting a deck with cards that lack an answer gets no verdict on those cards wherever they place them.

### Neutral

- The learner reads three marks on cards, correct, incorrect and no answer, each by a colour and an icon together.
- The learner gets verdicts by turning Check on and keeps getting them until they turn it off, where once they pressed Check once on a full board.
