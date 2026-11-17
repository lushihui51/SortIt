# ADR 019: Clerk's modal close observed through the app's container

## Status

Active

## Context

PDR 015 has the list's address or a deck's address, opened by a learner who has not signed in, show the board of the app's own deck with the sign-in form open. It opens what the address names once they sign in, and leaves them at the app's first address only if they close the form. The app must therefore know that the form closed, and whether the learner signed in.

ADR 008 shows the form through Clerk's own modal, opened by `openSignIn`, loads Clerk's code from Clerk's CDN when the page runs, and rests only on Clerk's typed API. `Account`, in src/account/Account.tsx, is the component that shows the "Sign in" button and makes the call that opens the form.

ADR 017 renders the list and each deck inside one guard, `SignedInOnly`, which reads Convex's `useConvexAuth()`, shows the form while the learner is not authenticated, and replaces the address with `/` once told that the learner closed the form without signing in. Convex confirms the learner's token after the modal has closed, so at the close that follows a sign-in the guard still sees the learner not authenticated.

Clerk closes the modal by setting its own state for it to null, and calls nothing of the app's; the modal's props hold no callback for a close. Clerk renders the modal only while that state is set, so every close, by a press on the backdrop, Escape, the modal's cross or Clerk's navigation after a sign-in, removes the modal from the document.

`getContainer` is a typed prop of the modal, and the modal renders its backdrop and its card inside the element that prop gives. The backdrop is `position: fixed`, and an ancestor with a `transform`, a `filter` or a `contain` confines it.

Clerk's `__internal_addNavigationListener` fires only when Clerk navigates. Clerk navigates through a function the app gives `ClerkProvider`, `stayOnPage` in src/App.tsx.

After a sign-in, Clerk sets its session to `undefined` and emits, then navigates, and sets the new session and emits again only after the navigation returns. The navigation queues the modal's close in a timer, so the close lands while the session is `undefined` or just after it is set, by how long the app's function takes. `useAuth()` reports not loaded while the session is `undefined`, and loaded and signed out for a signed-out learner, whose session is `null`. A close by the backdrop, Escape or the cross leaves the session `null`.

What this record says of Clerk is read from `@clerk/ui` 1.42.6, `@clerk/clerk-js` 6.43.1 and `@clerk/shared`, and is not confirmed by a run in a browser.

ADR 018 tests components in jsdom and adds no browser automation tool, so a test reaches Clerk only through a mock of `@clerk/react`.

## Decision

We will have `Account` give the modal, as `getContainer`, an element of its own that it renders into `document.body` through React's `createPortal`, and learn that the modal has closed when a `MutationObserver` on that element sees it emptied after holding the modal.

We will have `Account` keep an observed close as state, and call the `onSignInClose` it is given only once `useAuth()` reports loaded and signed out while a close is held; a report of signed in drops the held close uncalled.

We will have `onSignInClose` mean, to whatever gives it to `Account`, that the learner closed the form without signing in, so that `SignedInOnly` reads nothing of Clerk.

## Alternatives considered

### A `MutationObserver` on `document.body` for Clerk's `.cl-modalBackdrop`

Rejected because it rests on Clerk's class names where `getContainer` is a typed prop, and it watches every change of the page.

### The container rendered in place, inside the bar that holds "Sign in"

Rejected because a `transform` or a `contain` added later to the bar or above it confines the dimmed screen to the bar.

### Clerk's `__internal_addNavigationListener`

Rejected because it is internal, and never fires for a close by the backdrop or Escape.

### Looking for the modal on a timer

Rejected because it lags the close and runs for as long as the form is open.

### Clerk's `session` read when the observer fires

Rejected because it is right only when the close lands after the session is set, and a miss sends a learner who has just signed in at the list's address to `/`.

### `Account` reporting every close, with `SignedInOnly` deciding from `useConvexAuth()`

Rejected because the guard sees the learner not authenticated at the close after a sign-in, and has to read Clerk's states to wait.

### `stayOnPage` marking a sign-in when Clerk calls it

Rejected because it ties src/App.tsx to `Account` through shared state, and takes any navigation of Clerk's for a sign-in.

### A fixed wait after the close

Rejected because a slow token outlasts it.

## Consequences

### Positive

- The next developer finds how a close is observed in `Account` alone, which names none of Clerk's markup.
- The next developer writes the guard, and any later caller of `Account`, against `onSignInClose`, and reads nothing of Clerk there.
- A learner who signs in at the list's address or a deck's address lands on what it names, whether the modal closes before or after Clerk sets the new session.

### Negative

- A Clerk that stops honouring `getContainer` renders the modal in `document.body`, the observer sees no close, a learner who closes the form at the list's address or a deck's address stays at that address, and no test fails; the engineer's check in a browser is the one guard.
- The next developer keeps the held close and the modal's container alive through the moment `useAuth()` reports not loaded, when `Account` shows nothing.

### Neutral

- The next developer tests a close by stepping the mock of `useAuth` through signed out, not loaded and signed in.
