# ADR 013: A learners table giving each learner one copy

## Status

Active

## Context

PDR 012 starts every learner's list of decks with one deck, a copy of the app's own deck, which is theirs to change or delete. A learner who deletes the copy cannot get it back as it was.

ADR 009 keeps the learners' decks in Convex and tells each learner by their Clerk user id. A Convex mutation runs serializably and commits all its writes or none.

ADR 007 turns the app's own deck into a `Deck` whose ids are its things' names, and gives every thing of a learner's deck an id made on the device by `crypto.randomUUID()`.

How a Convex function reads the bundled JSON file of the app's own deck, or makes a random id, is not known.

A learner can sign in for the first time on two devices at once.

Clerk can call a webhook when an account is made, which needs an HTTP endpoint and a signing secret.

## Decision

We will keep, in the Convex table `learners`, one row keyed by Clerk user id for each learner given the copy of the app's own deck.

We will have a signed-in learner's app, when it starts, build a copy of the app's own deck as a `Deck` with ids made on the device and call the mutation `startLearner`, which adds the learner's row and the copy in one transaction when the learner has no row, and does nothing otherwise.

## Alternatives considered

### The copy given whenever a learner has no deck

Rejected because a learner who deletes every deck gets it back.

### The copy built in Convex

Rejected because it rests on the two unknowns, how a function reads the bundled file and how it makes a random id.

### A Clerk webhook on a new account

Rejected because it needs an HTTP endpoint and a signing secret, and the list can show empty before the webhook arrives.

## Consequences

### Positive

- A learner who signs in for the first time on two devices at once gets one copy.
- A learner who deletes every deck keeps an empty list.
- The next developer reads whether a learner has started from one table, never from their decks.

### Negative

- Every start of a signed-in learner's app sends one mutation, which does nothing after the first.

### Neutral

- The copy's ids are made on the device of the learner's first sign-in.
