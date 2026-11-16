# ADR 011: One document per deck, changed by pure acts

## Status

Active

## Context

ADR 007 gives every deck one shape, `Deck`, in which every card, dimension and category has an id and a card's answers are keyed by dimension id.

ADR 009 keeps the learners' decks in Convex, makes every change to a deck a mutation with an optimistic update, and loads every deck through one helper that checks its owner.

A Convex mutation runs serializably and commits all its writes or none. Convex reruns an optimistic update whenever the query results it changes are updated.

A Convex document holds at most 1 MiB, 16 levels of nesting and 8192 elements in an array. A record's key in a document is any non-empty ASCII string not starting with "$" or "_", which every id ADR 007 makes is.

PDR 001 names a deck of about 30 cards and 6 zones as the size a desktop board holds.

PDR 009 holds the names of cards, of dimensions and of a dimension's categories unique within a deck, and the names of a learner's decks unique among them. It refuses a name as the learner types, keeps what they typed and changes nothing.

PDR 014 shows every change at once, whatever the connection. One deck can be changed from several devices, and a change can wait offline a long time before it is kept.

PDR 011 deletes a dimension with its categories and every answer in them.

## Decision

We will keep each deck of a learner as one document in the Convex table `decks`, holding the deck's own id, its owner's Clerk user id, by which the table is indexed, its name, its dimensions with their categories, and its cards with their answers keyed by dimension id, in the shape of `Deck`.

We will write each act on a learner's deck once, as one pure function in `convex/model/deckActs.ts` that takes a `Deck` and the act's arguments and returns either the changed deck or a refusal.

We will make each act one mutation, taking the deck's id and the act's arguments and never the whole deck, which loads the deck, applies the act and writes the deck back.

We will have the app apply the act before sending its mutation, showing a refusal without sending, and apply it again as the mutation's optimistic update.

## Alternatives considered

### A table each for decks, dimensions, categories, cards and answers

Rejected because the board joins five tables, deleting a dimension cascades across three, and an optimistic update edits several query results in step, so a missed one leaves a stray row with nothing failing.

### A deck's name in a document apart from its contents

Rejected because every rename and every new deck then writes two documents, to save reading the decks whole on the list.

### Mutations replacing the whole deck

Rejected because one device's change overwrites another's, and a change queued offline replays a stale deck.

### The name rules checked only in the mutation

Rejected because a learner without a connection sees no refusal until it returns, and the name they typed is gone by then.

### An optimistic update written apart from the mutation

Rejected because the two drift, and the screen shows a change other than the one kept until the server's result replaces it.

## Consequences

### Positive

- The next developer finds a whole deck in one document, in the app's own shape.
- A learner's change on one device never overwrites a change made on another.
- A learner without a connection reads a refused name as they type, and keeps what they typed.
- The next developer writes each act once and tests its rules under Vitest.
- A learner sees at once what will be kept, as long as the kept deck has not changed meanwhile.

### Negative

- A learner's deck holds at most 8192 cards and 1 MiB in all, and a change past either is refused by Convex and not kept.
- The list of decks reads every deck whole to show their names.

### Neutral

- The next developer reads the whole deck in every mutation before changing it.
