# PDR 009: Rules each deck must meet, with an error for the app's own deck and a refused name for a learner's

## Status

Active

## Context

The app's own deck is written by hand in one data file in the repository. Whoever edits it gives each card its answer in each dimension, and a hand-edited file can hold a mistake: a card with no answer for a dimension, or an answer that is not one of the dimension's categories.

A hand-edited file can hold other mistakes too: a deck with no card or no dimension, a dimension with one category or none, or two cards, two dimensions or two categories of one dimension given the same name. One slip in the file can bring further faults with it.

The error for a broken app's own deck is read in the app, by whoever opens it, and the fix is made in the file.

A learner also builds decks of their own in the app, naming each deck, card, dimension and category as they make it. While it is being built, such a deck holds no card, no dimension, a dimension of fewer than two categories, or cards with no answer in a dimension.

PDR 008 shows every card of a deck, and every category of the chosen dimension as a zone, each by its name. Two cards bearing one name are two cards the learner cannot tell apart, and so are two zones or two dimensions of one name; a card or a zone with no name shows nothing to tell it by.

A learner's decks are listed by their names, so two decks of one name are told apart only by opening them.

PDR 007 judges each card by whether the zone it lies in is its answer, and counts the correct cards over the cards judged. It marks a card with no answer under the chosen dimension as having none and leaves it out of the score. A verdict rests on a card having at most one right answer.

A dimension of one category gives a board with one zone and no choice to make.

Some cards could arguably fall under more than one category of a dimension. An animal might live both in the ocean and on land. Either a deck allows two answers, or whoever writes the deck decides one.

PDR 001 keeps the board working for a deck beyond the named sizes, so the size of a deck is never a fault of it.

## Decision

We will require every card of the app's own deck to have exactly one answer in every dimension, drawn from that dimension's categories, and the app's own deck to hold at least one card and at least one dimension, with at least two categories in every dimension.

We will require, in every deck, that no two cards, no two dimensions and no two categories of one dimension bear the same name, and that no two decks of one learner do.

We will show, for the app's own deck when it breaks any of these rules, in place of the board, that the deck cannot be shown, followed by one sentence naming the fault and the thing at fault by name; for a card lacking exactly one answer, that is the card and the dimension.

We will name the first fault found and no other.

We will hold a learner's own decks to these names as the learner types: we will refuse a name that another thing of the same kind already bears where it is held, and an empty name, say why, keep what the learner typed, and leave everything as it was.

We will open every deck of a learner's own on its board, whatever it holds, and give each of its cards at most one answer in each dimension.

## Alternatives considered

### Several correct categories for one card

Rejected because the verdict becomes "one of these" and the score loses its meaning.

### A missing answer in the app's own deck that skips the card for that dimension

Rejected because the learner sees different piles under different dimensions and cannot tell why.

### Skipping bad cards silently

Rejected because a broken deck looks like a smaller deck.

### One message for every fault

The app would show the same words whatever the fault. Rejected because whoever edits the deck learns nothing about what to fix.

### Listing every fault at once

Rejected because one slip and the faults it brings with it show as a wall of lines.

### Showing the board of the app's own deck wherever it still works

The app would show the board for a deck whose fault lies in one dimension or in two names. Rejected because the learner meets a zone they cannot sort into or two cards they cannot tell apart, with no word on why.

### The rules and the error of the app's own deck for every deck

Every deck would have to meet the rules of the app's own deck before its board shows. Rejected because every new deck would show an error in place of the board needed to build it.

### Repeated names in a learner's deck or among their decks

Rejected because the learner would meet two cards, two zones or two dimensions they cannot tell apart, and two decks of one name could be told apart only by opening them.

### Empty names

Rejected because the board could show a card with no name or a zone with no label.

## Consequences

### Positive

- The learner never meets a card of the app's own deck with no right answer or two, or a dimension of it with no choice to make.
- The learner never meets, in any deck, two cards, two dimensions or two categories of one dimension they cannot tell apart, nor, in a deck of their own, a card, a dimension or a zone with no name.
- Every name in a learner's list of decks points to one deck.
- A learner who opens the app's own deck while it is broken reads one message of one shape whatever the fault, naming the fault and the thing at fault in the words of the deck, so whoever edits the deck knows what to fix.
- The learner is never locked out of a deck of their own while building it.
- A learner whose name is refused reads why, and keeps what they typed.

### Negative

- A learner who opens the app's own deck while it is broken gets no board at all, not even for the dimensions that are fine.
- A learner meets a card that could belong to two categories as having one, chosen by whoever wrote the deck.
- A learner who opens the app's own deck while it has several faults reads only the first, and whoever edits the deck finds the next only after fixing it.
- A learner may sort a dimension of their own deck that holds one category and gives no choice to make, and may meet cards in it that no verdict judges.
- A learner whose name is refused has to find another for the thing they are making or renaming.

### Neutral

- The app's own deck is refused whole when it breaks a rule, while a learner's deck is refused one name at a time and never whole.
