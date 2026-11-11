# ADR 009: Convex for keeping the learners' decks, with one helper checking each deck's owner

## Status

Active

## Context

PDR 013 keeps every change a signed-in learner makes to their decks as it is made, and brings back the same decks on every device they sign in on.

PDR 014 shows every change at once, whatever the connection, and keeps the changes still waiting as soon as the connection returns, without reloading the page. It shows a line at the top of the board or of the list of decks while one or more changes are not yet kept.

PDR 015 shows nothing of a learner's deck to anyone else who opens its address, not even whether it exists.

The app is static files served by GitHub Pages, with no server of its own (ADR 010).

ADR 008 tells who the learner is with Clerk, and takes the learner's id from Clerk's session.

Convex's client queues mutations through a dropped connection and retries them, runs each exactly once, applies a mutation's optimistic update to its query results while the mutation waits, and reports the mutations in flight.

`ConvexProviderWithClerk` passes Clerk's token to Convex, and inside a Convex function `ctx.auth.getUserIdentity()` gives the learner's identity, which carries their Clerk user id.

Convex's free plan has hard caps, and refuses changes once one is reached.

Supabase's client keeps no queue of changes through a dropped connection, and Supabase pauses a free project after a week of low use.

## Decision

We will keep the learners' decks in Convex, reached through `ConvexProviderWithClerk` inside `ClerkProvider`.

We will have every Convex function check the learner by `ctx.auth.getUserIdentity()`, and have every deck owned by the Clerk user id that identity carries.

We will have every Convex function that reads or changes a deck load it through one helper, which finds the deck by its id and refuses unless the learner's Clerk user id is the deck's owner.

We will make every change to a deck a Convex mutation with an optimistic update, and show the line PDR 014 shows while changes wait for as long as Convex reports a mutation in flight.

## Alternatives considered

### Supabase

Rejected because the queue PDR 014 needs would be the app's own to write, and a free project is paused after a week of low use.

### A server of the app's own

Rejected because it needs a host beyond GitHub Pages, and the same queue.

### The owner check written in each function

Rejected because one function that misses it lets any signed-in learner read or change another's deck with nothing failing.

## Consequences

### Positive

- A learner's changes show at once and are kept when the connection returns, through a queue the app does not write.
- The next developer adds a function on a deck by calling the one helper, and writes the owner check nowhere else.

### Negative

- A learner's changes are refused and not kept once the app reaches a hard cap of Convex's free plan.
- A function that skips the helper lets any signed-in learner read or change another's deck, and nothing fails.

### Neutral

- The next developer writes each change to a deck as one Convex mutation with its optimistic update, and finds the server side in `convex/`.
