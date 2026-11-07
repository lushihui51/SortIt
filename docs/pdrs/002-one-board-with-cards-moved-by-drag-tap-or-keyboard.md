# PDR 002: One board with cards moved by drag, tap or keyboard

## Status

Active

## Context

The learner sorts one fixed set of items into the categories of a dimension they pick. A set of animals, for instance, can be sorted by Habitat into Ocean, Forest and Desert, or by Diet into Herbivore, Carnivore and Omnivore, and the same items fall into different piles under each dimension. The app is one screen, and everything the learner does happens on it.

The set has more than one dimension, so no placement means anything until the learner has picked one. Picking a dimension is the learner's first act, and the screen before that act is the learner's first view of the app.

PDR 001 serves current desktop browsers and a phone held in portrait. A learner on a phone depends on touch for every act, and a learner who uses only a keyboard cannot drag at all.

## Decision

We will show one screen holding a dimension picker, a pool in which every item of the set appears as a card, and, once a dimension is chosen, one zone for each category of that dimension, each labelled with the category's name.

We will show, before a dimension is chosen, every card in the pool and the dimension picker and no zone, and we will let no card be placed until a dimension is chosen.

We will let the learner drag a card from the pool into any zone, from one zone to another, or from a zone back to the pool, in any order, until they have the board checked.

We will let the learner select a card by a tap or a click and send it to a zone, or back to the pool, by a second tap or click there, and we will let the learner do the same by keyboard alone.

## Alternatives considered

### One item at a time

The app would show one card and ask for its category before showing the next. Rejected because the learner cannot compare items or revisit a placement before the end.

### Cards dealt into zones at the start

The app would place every card in a zone and let the learner correct the placements. Rejected because the learner cannot tell their own placements from the app's, and a card correct by chance teaches nothing.

### The first dimension chosen in advance

The app would open with the first dimension chosen and its zones shown. Rejected because the learner may never notice that other dimensions exist.

### An empty board until a dimension is chosen

The app would show nothing but the dimension picker until a dimension is chosen. Rejected because the learner learns nothing about the set before choosing.

### Dragging only

The learner would move a card by dragging and in no other way. Rejected because a learner on a phone depends on touch dragging working, and a learner using only a keyboard cannot play at all.

## Consequences

### Positive

- The learner sees the whole set at once, places cards in any order, and can change any placement before checking.
- The learner's first view shows the pile and the choice of how to sort it.
- A learner on any served device, and one using only a keyboard, can sort the whole set.

### Negative

- The learner places every card themselves, with no placement made for them.
- The learner chooses a dimension before placing any card.

### Neutral

- A learner who taps or uses the keyboard moves a card in two acts, choosing the card and then its place, where a drag is one.
