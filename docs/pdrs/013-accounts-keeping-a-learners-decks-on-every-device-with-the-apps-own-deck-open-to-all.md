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

PDR 015 gives the list of decks and each deck's board an address of their own, with the browser's Back on a deck's board returning to the list and Forward returning to the deck.

PDR 012 opens any of a learner's decks from the list.

A learner can press Back by mistake.

A learner can leave a deck in the middle of a sort to look at another.

PDR 004 has Reset return every card to the pool, so a learner gets a fresh board of a deck with one press.

Many things a quiz app can offer sit around the sorting: leaderboards, timers, a history of scores and spaced repetition. Each is visible to the learner, and each adds to the app beyond sorting and the decks sorted.

## Decision

We will let a learner make an account, and sign in to it, with a Google account or with an email address and a password.

We will keep every change a signed-in learner makes to their decks as it is made, and bring back the same decks on every device they sign in on.

We will let anyone sort the app's own deck without signing in, and ask a learner to sign in only to keep decks of their own and to make, change or delete anything in them.

We will open the sign-in in a form over the screen the learner is on, and leave them on that screen as it was when they close it.

We will keep each deck's board as the learner left it, with the same dimension chosen, every card where they put it and Check on or off as it was, when they come back to that deck while the page stays open, by the list of decks or by Forward.

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

### A fresh board each time a deck opens

The board would show every card in the pool and no dimension chosen whenever the learner comes back to a deck. Rejected because a mistaken Back loses the learner's sort with no way back.

### The board kept on Back and Forward, and fresh when the deck is opened from the list

Rejected because the learner cannot tell which of the two they will get, and opening the deck again from the list loses their board.

### The dimension kept, with every card back in the pool

Rejected because the learner still loses their sort.

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
- A learner moves between the list and their decks, and presses Back by mistake, without losing a sort while the page stays open.

### Negative

- A learner who wants decks of their own makes an account first.
- A learner with no Google account makes a password and has to remember it.
- A learner who reloads starts their sort over, and loses the board of every deck they opened, not only the one they are on.
- A learner keeps no score and no record of past sorts.

### Neutral

- A learner who comes back to a deck wanting to start over presses Reset.
- A learner meets the app either signed out, with the app's own deck alone, or signed in, with decks of their own.
