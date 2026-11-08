# ADR 002: @dnd-kit/core for dragging, with selecting and sending as app state

## Status

Active

## Context

PDR 002 gives the learner three ways to move a card: dragging it from the pool to a zone, between zones or back to the pool; selecting it by a tap or a click and sending it by a second tap or click on a zone or the pool; and the same selecting and sending by keyboard alone. PDR 001 serves the current desktop versions of Chrome, Safari and Firefox and a phone held in portrait, so a drag must work by mouse and by touch.

ADR 001 writes the app on React, and the requirements name dnd-kit as the drag library.

dnd-kit ships two packages. @dnd-kit/core is at 6.3.1, its stable release; it accepts React 19 and has not changed since December 2024. @dnd-kit/react is at 0.5 and still changing.

dnd-kit's pointer sensor, left at its default, starts a drag on every pointer press, so a tap or click on a card would begin a drag and never reach the card as a click. With an activation constraint, a drag starts only once the pointer has moved a set distance or been held a set time.

dnd-kit also offers a keyboard sensor, which drives a drag by keyboard through the same drag path as the pointer.

The browser's own drag and drop behaves differently on touch across the served browsers, and gives the app no control over the image dragged.

## Decision

We will implement dragging with @dnd-kit/core at major version 6: one drag context around the board, each card a draggable, and the pool and each zone a droppable.

We will serve mouse and touch with one pointer sensor that starts a drag only once the pointer has moved, so that a tap or click without movement is not a drag.

We will implement selecting a card by tap, click or keyboard, and sending it to a zone or the pool by a second tap, click or key press, as app state over native buttons, in one code path, with no dnd-kit keyboard sensor.

We will confine dnd-kit to the components that bind cards, zones and the pool to it.

## Alternatives considered

### The browser's native drag and drop

Rejected because touch behaviour differs across the served browsers and the drag image is not the app's to control.

### @dnd-kit/react

Rejected because it is pre-1.0 and its API may change under the app.

### Hand-written pointer events

Rejected because hit-testing, scrolling while dragging and the drag preview would be written and maintained by hand.

### dnd-kit's keyboard sensor for the keyboard path

Rejected because tap and keyboard would then be two code paths for one act, and the tap path is required in any case.

## Consequences

### Positive

- The next developer replaces dnd-kit by changing the components that bind cards, zones and the pool to it, and nothing else.
- The next developer fixes selecting and sending once, and the fix holds for tap, click and keyboard alike.

### Negative

- The next developer cannot exercise the drag path in a simulated document, because the pointer sensor needs pointer events and element geometry that only a browser gives.

### Neutral

- A learner starts a drag only after moving the card a short distance, and a press with less movement selects the card instead.
