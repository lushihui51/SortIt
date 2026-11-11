# PDR 013: Accounts keeping a learner's decks on every device, with the app's own deck open to all

## Status

Active

## Context

PDR 006, which this record replaces, shipped one deck and kept nothing beyond the visit: the app had no accounts, and a page refresh started over with an empty board and no dimension chosen. Decks of a learner's own now give the app something to keep.

A learner now keeps decks of their own: PDR 012 shows them in a list that starts with a copy of the app's own deck, and PDR 011 has the learner make, change and delete the cards, dimensions, categories and decks in them.

A learner's decks are their own work, and the learner needs them on whichever device they use.

Something must tell one learner's decks from another's. An account does it by a sign-in. A personal link would do it by whoever holds the link, and a link can be lost or passed on. A file the learner saves would do it by whoever holds the file, and a file stays on the device it was saved on.

A first-time learner has not yet seen what the app does.

The app's own deck is the same for every learner, and changes only in the repository.

Some learners have a Google account and some have none.

A learner who has not signed in keeps their board only as long as the page stays open. A sign-in on a page of its own would send the learner away from the app, and returning from it would reload the app.

A board kept across a reload would come back as it was left, possibly days later. A learner's deck is the same on every device, while a board kept on one device would differ from a board kept on another.

Many things a quiz app can offer sit around the sorting: leaderboards, timers, a history of scores and spaced repetition. Each is visible to the learner, and each adds to the app beyond sorting and the decks sorted.

## Decision

We will let a learner make an account, and sign in to it, with a Google account or with an email address and a password.

We will keep every change a signed-in learner makes to their decks as it is made, and bring back the same decks on every device they sign in on.

We will let anyone sort the app's own deck without signing in, and ask a learner to sign in only to keep decks of their own and to make, change or delete anything in them.

We will open the sign-in in a form over the screen the learner is on, and leave them on that screen as it was when they close it.

We will have a reload of a deck's board bring back the board of that same deck, with every card in the pool and no dimension chosen, and keep no board beyond the page.

We will keep no score or history of sorts, and offer no leaderboards, no timers and no spaced repetition.

## Alternatives considered

### A personal link with no account

The learner would reach their decks through a link of their own. Rejected because a lost link loses the decks, and anyone the link reaches can change them.

### A file the learner saves and opens again

Rejected because nothing follows the learner on its own, and changes made on one device are missing on another.

### Sign-in before anything

Rejected because a first-time learner must make an account before seeing what the app does.

### An Apple account, or a link or code sent by email

Rejected by the product owner's choice of ways to sign in.

### A page of its own for signing in

Rejected because returning from it reloads the app, and a learner who has not signed in loses their board.

### A reload bringing back the list of decks

Rejected because the learner loses their place in the app as well as their sort.

### The board kept as it was across a reload

Rejected because it can come back stale days later, and it differs from one device to another while the deck is the same everywhere.

### Any of the features around the sorting

Rejected because the app is kept to sorting and to the decks the learner sorts.

## Consequences

### Positive

- A signed-in learner finds their decks, with every change they made, on every device they sign in on.
- A first-time learner sorts the app's own deck at once, without making an account.
- A learner signs in without leaving the screen they were on, and keeps the board they were sorting.
- A learner who reloads a deck's board stays in that deck and never meets a stale board.

### Negative

- A learner who wants decks of their own makes an account first.
- A learner with no Google account makes a password and has to remember it.
- A learner who reloads starts their sort over.
- A learner keeps no score and no record of past sorts.

### Neutral

- A learner meets the app either signed out, with the app's own deck alone, or signed in, with decks of their own.
