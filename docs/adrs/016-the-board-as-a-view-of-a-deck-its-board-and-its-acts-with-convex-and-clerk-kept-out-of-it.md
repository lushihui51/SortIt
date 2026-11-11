# ADR 016: The board as a view of a deck, its board and its acts, with Convex and Clerk kept out of it

## Status

Active

## Context

PDR 010 offers Save answers on a learner's own decks and nowhere else, and PDR 011 puts the fields that make cards, dimensions and categories, and the ⓘ on dimensions and zones, on a learner's own decks alone.

PDR 013 lets anyone sort the app's own deck without signing in.

ADR 009 keeps a learner's decks in Convex, reached through Convex's provider inside Clerk's (ADR 008). ADR 011 makes each change to a deck one act, sent as a mutation.

ADR 015 holds every board in one provider above the routes, and gives each screen its board and a dispatch through one hook.

ADR 018 renders components in jsdom for its component tests.

## Decision

We will have the board component render from a `Deck`, a fitted board and a dispatch it is given, and, for a learner's own deck only, an object of the acts that change the deck; given no acts, as for the app's own deck, it shows no field, no ⓘ on a dimension or a zone, and no Save answers.

We will have only the screen of a learner's deck call Convex, and have the board and its parts import nothing of Convex or Clerk.

## Alternatives considered

### A board calling Convex itself behind a flag

Rejected because every component test needs a mock of Convex, and the board of a learner who has not signed in sits in a provider it never uses.

### Two board components, one for each kind of deck

Rejected because every rule of sorting is written twice, and the two drift apart with nothing failing.

## Consequences

### Positive

- The next developer tests every act on the board and every field in jsdom, with a plain deck and stub acts.
- The next developer writes each rule of sorting once, for both kinds of deck.

### Negative

- The next developer passes each act from the deck's screen down through the board's props.

### Neutral
