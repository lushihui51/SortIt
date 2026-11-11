# ADR 008: Clerk for signing the learner in, with its sign-in component in a popover of the app's own

## Status

Active

## Context

PDR 013 lets a learner make an account, and sign in to it, with a Google account or with an email address and a password. Anyone sorts the app's own deck without signing in, and a learner signs in only to keep decks of their own.

PDR 013 opens the sign-in in a form over the screen the learner is on, and leaves them on that screen as it was when they close it. The form hangs under the "Sign in" button, over the board, which stays undimmed, and PDR 015 opens it the same way when a learner who has not signed in opens the list's address or a deck's address.

PDR 015 has the browser's Back on a deck's board return to the list of decks.

Once signed in, the learner sees an account button whose menu shows only the email address they are signed in with and "Sign out".

Clerk signs a learner in by Google or by an email address and a password on its free plan, with Google's sign-in in a popup. Its React package, `@clerk/react`, gives a `ClerkProvider` around the app, and the signed-in learner's id from Clerk's session.

Clerk's `openSignIn` shows its form centred over a dimmed page. Its `<SignIn />` component renders where it is mounted. The component's `routing` prop takes `virtual`, under which no step of signing in writes to the address, and `hash`, under which each step adds an entry to the browser's history.

Clerk runs in production only on a domain whose DNS records its owner can change.

The engineer's other app, Flashy, signs its users in through Clerk, with a "Sign in" button, an account button and a menu of its own, and tests its components with a mock of `@clerk/react`.

## Decision

We will check who the learner is with Clerk, through `@clerk/react` and its `ClerkProvider`, and take the learner's id from Clerk's session.

We will have the learner sign in, or make an account, through Clerk's `<SignIn />` component, rendered in a popover of the app's own under the "Sign in" button with no backdrop, with `routing="virtual"` so that no step of signing in writes to the address, and with Google's sign-in in a popup.

We will make the "Sign in" button, the account button and its menu components of the app's own.

## Alternatives considered

### Firebase Authentication or Supabase Auth

Rejected by the engineer's choice of Clerk, already proven in Flashy.

### Auth0

Rejected by the same choice.

### A sign-in form of the app's own

Rejected because every step of signing in that Clerk can produce, its errors and email code checks included, becomes the app's to handle.

### Clerk's `openSignIn`, restyled through its `appearance` to drop the backdrop and move the form

Rejected because the form's place then rests on Clerk's own markup, which a Clerk update changes with nothing failing.

### `routing="hash"`

Rejected because each step of signing in adds an entry to the history, and Back walks through the steps.

## Consequences

### Positive

- The next developer reuses Flashy's sign-in pattern and its mock of `@clerk/react`.
- The next developer places the sign-in form by the app's own CSS, and a Clerk update leaves it where it is.
- A learner's Back never walks through the steps of signing in.

### Negative

- The engineer owns a domain whose DNS records they can change before any learner can sign in for real.

### Neutral

- Every learner id the app keeps is a Clerk user id.
