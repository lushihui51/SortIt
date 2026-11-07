# ADR 003: One pure reducer holding the board, fed random numbers by its actions

## Status

Active

## Context

PDR 002, PDR 003 and PDR 004 name every act the learner makes on the board: choosing a dimension, selecting a card, starting a drag of a card, placing a card in a zone or the pool, Check, Retry and Reset. Check, Retry and Reset each touch every card on the board, and every act changes what the pool and the zones show.

Every item is in one place at a time, the pool or one zone of the chosen dimension, and its verdict rests on that place: PDR 003 judges a card at Check by whether the zone it lies in is the item's answer in the chosen dimension.

PDR 003 removes a card's correct mark the moment the learner takes hold of it, by starting a drag or by selecting it, and a drag cancelled afterwards keeps no mark. The mark is gone before the learner has decided where the card goes.

PDR 003 has Retry return only the incorrect cards to the pool, in random order, and keep the correct cards in their zones with their marks. The pool shows its cards in random order when the app loads and each time the board is cleared, by Reset or by a change of dimension under PDR 004.

PDR 006 keeps nothing beyond the visit, and a page refresh starts over with an empty board.

ADR 001 writes the app on React. React's StrictMode calls a reducer twice on each action in development, so a reducer whose result depends on anything but its state and its action gives two results, and a test can hold a reducer to an exact result only when every input is in the test's hands.

## Decision

We will hold the board's state in one React reducer with a pure reducer function.

We will have that state hold the chosen dimension or none; the place of every item, one zone of the chosen dimension or the pool; one order holding every item once, in which the pool and every zone show their cards; the mark of each card, correct or incorrect, set at Check and absent otherwise; and the selected card or none.

We will make each act, choosing a dimension, selecting a card, starting a drag of a card, placing a card, Check, Retry and Reset, one action of the reducer.

We will have selecting a card and starting a drag of it each remove the card's mark in the reducer, so that a drag cancelled afterwards leaves no mark behind.

We will have every action that shuffles, loading, Reset, choosing a dimension and Retry, carry a source of random numbers in its payload, from which the reducer draws; the app passes the browser's random source and the tests pass a fixed sequence, and the reducer draws no random number of its own.

We will shuffle the order when the app loads and whenever the board is cleared, and have Retry permute the returned cards among the positions they held and leave every other card in place.

We will compute a card's verdict at Check from its place and the item's answer, and store nothing beyond the state named here.

## Alternatives considered

### One array of items per zone and one for the pool

Rejected because an item can then be in two places or none with nothing failing.

### A place field on each item object

Rejected because the board then mutates the set's data.

### A state library

Rejected because one screen with one reducer needs none.

### State spread across components

Rejected because Check, Retry and Reset each touch every card and would reach into every component.

### Removing the mark on drop or send

Rejected because a cancelled drag then keeps a mark on a card the learner has already disturbed.

### Removing the mark in the dragging component's own state

Rejected because the reducer still holds the mark and it returns on the next render.

### Drawing random numbers inside the reducer

Rejected because the reducer is then impure, StrictMode's two calls give two orders, and no test can assert an order.

### A seed kept in the state

Rejected because every shuffle must thread it through for the same result the payload gives.

### The dispatcher computing the order and passing it

Rejected because Retry's rule about positions then leaves the reducer and is tested only through the screen.

## Consequences

### Positive

- The next developer tests every rule of Check, Retry, Reset and a change of dimension as a reducer case without a browser, and asserts the exact order after every shuffle with a fixed random sequence.
- The next developer never meets an item in two places or none, because each item has exactly one place by construction.
- A learner who takes hold of a correct card and drops it back finds it unmarked where it lies.
- The next developer adds an act by adding one action.

### Negative

- The next developer passes a random source with every shuffling action, where the reducer could have drawn one itself.

### Neutral

- The learner's board lives in memory alone, so a refresh starts over.
