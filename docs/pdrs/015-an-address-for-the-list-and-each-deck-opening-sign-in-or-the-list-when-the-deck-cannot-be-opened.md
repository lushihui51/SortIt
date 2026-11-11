# PDR 015: An address for the list and each deck, opening sign-in or the list when the deck cannot be opened

## Status

Active

## Context

PDR 012 shows a learner's decks in a list on a screen of its own and opens a deck's board from it, so a learner with decks of their own moves between two screens.

A browser shows the page's address in its address bar, its history and the learner's bookmarks, and its Back and Forward buttons move between addresses.

A learner keeps an address as a bookmark or an open tab, and can pass it to someone else.

PDR 012 lets the learner rename a deck at any time.

Spaces and most symbols in an address show as codes.

PDR 013 brings a learner back to the deck they were on when they reload its board.

PDR 013 lets a learner who has not signed in sort only the app's own deck, and opens the sign-in in a form over the screen the learner is on.

The list's address and a deck's address can each outlive the learner's sign-in.

Signing out brings the learner to the board of the app's own deck, so the browser's Back after signing out reaches the address the learner signed out from.

A deck's address can outlive the deck: PDR 011 deletes a deck, and under PDR 013 the learner can do it from any device. An address can also name another learner's deck.

## Decision

We will give the list of decks and each deck's board an address of its own, so that the browser's Back on a deck's board returns to the list and Forward returns to the deck.

We will make a deck's address its name followed by a fixed code, open the deck by the code alone, and show the new name in the address after a rename.

We will have the list's address or a deck's address, opened by a learner who has not signed in, show the board of the app's own deck with the sign-in form open, open the list or the deck it names once they sign in, and leave them on the app's own deck, at the app's first address, if they close the form.

We will have a deck's address that a signed-in learner cannot open, because the deck is deleted or is another learner's, bring them to their list of decks with a line at the top saying the deck cannot be opened, and make the address the list's.

## Alternatives considered

### One address for the whole app, with the device remembering the open deck

Rejected because Back on a board leaves the app, and no deck can be bookmarked on its own.

### One address for the list and one for any deck, without saying which deck

Rejected because two bookmarks of two decks open the same one.

### A code alone in a deck's address

Rejected because the learner cannot tell which deck an address belongs to.

### The deck's name alone in its address

Rejected because a rename breaks every bookmark and open tab of the deck, and spaces and symbols show as codes.

### The app's own deck with no form, for a learner who has not signed in

Rejected because the learner meets the app's own deck where they expected their own, with nothing saying why, and has to find their way to their list or their deck again after signing in.

### A screen of its own asking the learner to sign in

Rejected because it adds a screen, its wording and a press, and the learner sees nothing of the app until they choose.

### The list with no line, for a deck that cannot be opened

Rejected because the learner cannot tell whether the app failed, the deck was deleted or the address was wrong.

### A screen of its own for a deck that cannot be opened

Rejected because it adds a screen and a press before the learner reaches their decks.

## Consequences

### Positive

- The learner moves between the list and a deck's board with Back and Forward, as on most sites.
- A learner bookmarks a deck, or keeps it in a tab, and opens it straight onto its board, even after renaming it.
- The learner reads in an address which deck it opens.
- A learner whose bookmark of the list or of a deck outlives their sign-in signs in once and lands on what it names.
- A learner whose deck cannot be opened reads why, with all their decks in front of them.
- Nothing of a learner's deck shows to anyone else who opens its address, not even whether it exists.

### Negative

- A learner who closes the sign-in form that an address opened finds their list or their deck again by hand after signing in.
- A learner cannot share a deck by passing on its address.

### Neutral

- A learner who signs out and presses Back meets the sign-in form again.
- Every deck's address ends in a code of letters and digits after the deck's name.
