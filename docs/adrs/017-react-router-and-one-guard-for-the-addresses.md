# ADR 017: React Router and one guard for the addresses

## Status

Active

## Context

PDR 015 gives the list of decks and each deck's board an address of its own, with the browser's Back on a deck's board returning to the list and Forward returning to the deck. A deck's address is its name followed by a fixed code; the deck opens by the code alone, and the address shows the new name after a rename.

PDR 015 has the list's address or a deck's address, opened by a learner who has not signed in, show the board of the app's own deck with the sign-in form open, open what it names once they sign in, and leave them at the app's first address if they close the form. A deck's address that a signed-in learner cannot open brings them to their list of decks, with a line saying the deck cannot be opened.

PDR 013 opens the sign-in in a form over the screen the learner is on, and ADR 008 shows that form through Clerk's own modal, which writes nothing to the address. ADR 019 has `Account`, the component that opens the form, report through `onSignInClose` only a close by a learner who has not signed in.

ADR 010 serves the app at the root of a domain on GitHub Pages, which answers a path it holds no file for with the site's 404.html.

ADR 007 makes a deck's id on the device by `crypto.randomUUID()`, of hex digits and hyphens. A deck made offline has no Convex document id until its change is kept.

ADR 009 refuses, through one helper, any deck the learner does not own.

ADR 015 keeps one board for the app's own deck, wherever it shows.

React Router, in declarative mode, maps paths to screens inside a `BrowserRouter`, and handles Back, Forward, links and replacing the address. Spaces and most symbols in an address show as codes.

Convex's `useConvexAuth()` reports loading while the client resolves the learner's sign-in and waits for Convex to confirm their token, and authenticated once Convex has confirmed it. On page load, a Convex query runs with no identity until then. Clerk's `useAuth()`, `<SignedIn>` and `<SignedOut>` read Clerk's session alone.

## Decision

We will take the app's screen from the address's path through React Router in declarative mode, with `BrowserRouter` around the app: `/` shows the board of the app's own deck, `/decks` a signed-in learner's list of decks, and `/decks/<name>-<code>` a deck's board, and any other path is replaced by `/`.

We will make a deck's address from its name, with each run of characters other than letters and digits made one hyphen, followed by its id with the hyphens removed as the code.

We will have a deck's screen open the deck by the code alone, through a Convex query that returns nothing when the owner helper refuses or no deck holds that id, and replace the address with the deck's own whenever the name in it differs.

We will render the routes of the list and of a deck inside one component, `SignedInOnly`, which reads `useConvexAuth()`: while it reports loading, it renders nothing; while the learner is not authenticated, it renders the screen of the app's own deck, as `/` does, with the sign-in form open and the address left as it is, and replaces the address with `/` when `Account` reports that the learner closed the form without signing in; once the learner is authenticated, it renders the route's screen.

We will have the build copy index.html to 404.html, so that GitHub Pages serves the app at every path.

## Alternatives considered

### Hash routing

Rejected because every address shows "#/" before the deck's name and code.

### A router written on the browser's History API

Rejected because Back, Forward, links and replacing the address are each the app's to write and test.

### A short code of the app's own for each deck

Rejected because it is a second id, kept unique by hand.

### Convex's document id in the address

Rejected because a deck made offline has none until its change is kept.

### Each screen checking sign-in itself

Rejected because a screen added later that skips it sends its queries with no identity, and their empty results read as nothing held.

### Clerk's `useAuth()`, `<SignedIn>` and `<SignedOut>`

Rejected because they read Clerk's session and not whether Convex has confirmed the learner's token, so a deck's query run before then finds no deck and sends a signed-in learner to the list with the line that the deck cannot be opened.

### A redirect to `/` with the address to return to in its query string

Rejected because the address shows `/` while the form is open, and Back holds an entry the learner never chose.

### Clerk's redirect to sign in

Rejected because PDR 013 opens the form over the screen the learner is on.

## Consequences

### Positive

- The next developer adds a screen as one route, and guards it by putting the route inside `SignedInOnly`.
- A learner's bookmark of a deck keeps working after a rename, because the name in the address is never read.
- A signed-in learner who reloads a deck lands on it, never on the list with a false line.

### Negative

- A signed-in learner who reloads the list or a deck sees nothing for a moment before the screen.
- A route left outside `SignedInOnly` runs its queries signed out, and nothing fails.
- A build without 404.html breaks every address but `/` on the live site, and no test fails.

### Neutral

- A deck's address ends in 32 letters and digits.
