# ADR 014: @dnd-kit/core for dragging alone, cards holding one button

## Status

Active

## Context

ADR 002, which this record replaces, moved a card by dragging it and also by selecting it with a tap, a click or a key and sending it with a second, as app state over native buttons. Each card is a `<button>` whose click selects it, and the labels of the pool and the zones are buttons that send the selected card.

PDR 008 moves a card only by dragging it, at any time. It puts an ⓘ on every card that opens the card in a panel over the board, and has a press anywhere else on a card only start a drag.

PDR 001 serves the current desktop versions of Chrome, Safari and Firefox and a phone held in portrait, so a drag is made by mouse and by touch.

ADR 001 writes the app on React. @dnd-kit/core is at 6.3.1, its stable release, and accepts React 19; @dnd-kit/react is still before its 1.0 release.

dnd-kit's pointer sensor, left at its default, starts a drag on every pointer press. With an activation constraint, it starts a drag only once the pointer has moved a set distance.

A button inside a button is invalid HTML, and browsers and screen readers treat nested buttons inconsistently.

A pointer press on an element reaches the listeners of its ancestors unless the element stops it.

The browser's own drag and drop behaves differently on touch across the served browsers, and gives the app no control over the image dragged.

## Decision

We will implement dragging with @dnd-kit/core at major version 6: one drag context around the board, each card a draggable, and the pool and each zone a droppable.

We will serve mouse and touch with one pointer sensor that starts a drag only once the pointer has moved.

We will confine dnd-kit to the components that bind cards, zones and the pool to it.

We will keep no selected card and send no card: the board's state holds no selection, and the labels of the pool and the zones are plain text.

We will make each card a non-interactive element that carries the drag listeners and holds its ⓘ as its one native button, and have the ⓘ stop a pointer press from reaching the card's listeners.

## Alternatives considered

### The browser's native drag and drop

Rejected because touch behaviour differs across the served browsers and the drag image is not the app's to control.

### @dnd-kit/react

Rejected because it is before its 1.0 release and its API may change under the app.

### Hand-written pointer events

Rejected because hit-testing, scrolling while dragging and the drag preview would be written and maintained by hand.

### Selecting and sending as app state, as ADR 002 decided

Rejected because no learner can reach them under PDR 008.

### The card kept a `<button>`, with its ⓘ inside

Rejected because browsers and screen readers treat nested buttons inconsistently, and a press on the ⓘ can fire the card.

### A pointer sensor with no movement threshold

Rejected because every tap on a card starts and ends a drag, and a press on the ⓘ that slips by a pixel drags the card.

## Consequences

### Positive

- The next developer replaces dnd-kit by changing the components that bind cards, zones and the pool to it, and nothing else.
- The next developer finds one way a card moves, the drag.
- A learner who presses a card's ⓘ opens the card and never drags it.

### Negative

- The next developer cannot exercise a drag in a simulated document, because the pointer sensor needs element geometry that only a browser gives.

### Neutral

- The ⓘ is the one focusable part of a card.
- A learner starts a drag only after moving the card a short distance.
