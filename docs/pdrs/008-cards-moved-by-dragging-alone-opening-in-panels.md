# PDR 008: Cards moved by dragging alone, opening in panels

## Status

Active

## Context

The learner sorts the cards of a deck into the categories of a dimension they pick. A deck of animals, for instance, can be sorted by Habitat into Ocean, Forest and Desert, or by Diet into Herbivore, Carnivore and Omnivore, and the same cards fall into different piles under each dimension. The sorting happens on one screen, the board.

A deck can hold more than one dimension, so no placement means anything until the learner has picked one. Picking a dimension is the learner's first act on the board, and the board before that act is the learner's first view of the deck.

PDR 001 serves current desktop browsers and a phone held in portrait. A learner on a phone depends on touch for every act.

A learner who uses only a keyboard cannot drag at all. Such learners are rare among those the app serves.

A drag on a touch screen sometimes fumbles: the card stays where it was or lands short, and the learner drags it again. A fumbled drag can also register as a tap on the card.

The product owner wants each card to open, so that the learner can change it on a deck of their own now and read more about it later.

PDR 002, which this record replaces, let the learner move cards until they had the board checked, a moment that belonged to one check of the whole board. PDR 007 makes Check a switch the learner turns on and off at any time, with marks that follow each card to wherever it lies, so the board has no such moment.

## Decision

We will show one screen holding a dimension picker, a pool in which every card of the deck appears, and, once a dimension is chosen, one zone for each category of that dimension, each labelled with the category's name.

We will show, before a dimension is chosen, every card in the pool and the dimension picker and no zone, and we will let no card be placed until a dimension is chosen.

We will let the learner move a card only by dragging it: from the pool into any zone, from one zone to another, or from a zone back to the pool, in any order and at any time.

We will put a small ⓘ on every card, which opens the card in a panel over the board, and we will have a press anywhere else on a card only start a drag.

## Alternatives considered

### One card at a time

The app would show one card and ask for its category before showing the next. Rejected because the learner cannot compare cards or revisit a placement before the end.

### Cards dealt into zones at the start

The app would place every card in a zone and let the learner correct the placements. Rejected because the learner cannot tell their own placements from the app's, and a card correct by chance teaches nothing.

### The first dimension chosen in advance

The app would open with the first dimension chosen and its zones shown. Rejected because the learner may never notice that other dimensions exist.

### An empty board until a dimension is chosen

The app would show nothing but the dimension picker until a dimension is chosen. Rejected because the learner learns nothing about the deck before choosing.

### Moving cards only until the board is checked

The learner would move cards until they had the board checked, and no longer. Rejected because Check is a switch the learner turns on at any time, and no single check ends the sort.

### A tap, a click or the keyboard to select a card and send it

The learner would also select a card by a tap, a click or a key and send it to a zone, or back to the pool, by a second. Rejected because opening a card takes the tap, and a learner whose drag fumbles on a phone drags again.

### A tap anywhere on a card opening it

Rejected because a fumbled drag opens it.

### A double tap opening a card

Rejected because nothing on screen tells the learner it exists.

### An Edit switch

The learner would turn on a switch that lets every card open for changes. Rejected because it adds a control and hides the card's later details behind it.

## Consequences

### Positive

- The learner sees the whole deck at once, places cards in any order, and can change any placement at any time.
- The learner's first view of a deck shows the pile and the choice of how to sort it.
- The learner sees on every card how to open it, and opens a card only on purpose.
- A fumbled drag never opens a card, since a press anywhere but its ⓘ only drags it.

### Negative

- The learner places every card themselves, with no placement made for them.
- The learner chooses a dimension before placing any card.
- A learner who uses only a keyboard cannot sort.
- A learner whose drag fumbles drags the card again, with no other way to move it.

### Neutral

- The learner moves every card in one act, a drag.
