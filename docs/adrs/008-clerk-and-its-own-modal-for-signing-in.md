# ADR 008: Clerk and its own modal for signing in

## Status

Active

## Context

PDR 013 lets a learner make an account, and sign in to it, with a Google account or with an email address and a password. Anyone sorts the app's own deck without signing in, and a learner signs in only to keep decks of their own.

PDR 013 opens the sign-in in a form over the screen the learner is on, and leaves them on that screen as it was when they close it. The form shows centred over that screen, which is dimmed behind it and neither usable nor scrollable until the form closes, and a press on the dimmed screen closes the form. PDR 015 opens it the same way when a learner who has not signed in opens the list's address or a deck's address.

The address stays the same through every step of signing in or of making an account. PDR 015 has the browser's Back on a deck's board return to the list of decks.

Once signed in, the learner sees an account button whose menu shows only the email address they are signed in with and "Sign out".

Clerk signs a learner in by Google or by an email address and a password on its free plan, with Google's sign-in in a popup. Its React package, `@clerk/react`, gives a `ClerkProvider` around the app, and the signed-in learner's id from Clerk's session.

Clerk's `openSignIn` shows its form in a modal centred over a dimmed page, which keeps each step of signing in in React state and writes nothing to the address. The modal draws its own backdrop, locks the page's scroll, makes the page behind it inert, and closes on a press on the backdrop. Its `<SignIn />` component renders where it is mounted. Under every value of its `routing` prop but `path`, `virtual` included, the component moves between steps by setting the address's hash, so each step after the first changes the address and adds an entry to the browser's history.

The modal shows making an account inside itself unless Clerk's combined flow is on. The combined flow is on when the modal is given `withSignUp`, or when `ClerkProvider` is given a relative `signInUrl` and no `signUpUrl`, and it then builds "Sign up" from `signInUrl`, which is a page Clerk hosts unless set.

After a sign-in or a new account, the modal sends the learner to the current address unless it is given another.

`@clerk/react` loads `@clerk/clerk-js` at major version 6 and `@clerk/ui` at major version 1 from Clerk's CDN when the page runs, and package-lock.json fixes neither, so a change in Clerk's modal reaches learners with no commit and no deploy of the app. `ClerkProvider` takes `ui`, which bundles `@clerk/ui` into the build, and `Clerk`, which bundles `@clerk/clerk-js`.

What this record says of the modal, of the mounted component and of how Clerk's code loads is read from `@clerk/react` 6.18.8, `@clerk/ui` 1.42.6, `@clerk/clerk-js` 6.43.1 and `@clerk/shared`, and is not confirmed by a run in a browser.

Clerk runs in production only on a domain whose DNS records its owner can change.

The engineer's other app, Flashy, signs its users in through Clerk, with a "Sign in" button, an account button and a menu of its own, and tests its components with a mock of `@clerk/react`.

ADR 018 tests components in jsdom and adds no browser automation tool, so a test reaches Clerk only through a mock of `@clerk/react`, and no test runs Clerk's own code.

## Decision

We will check who the learner is with Clerk, through `@clerk/react` and its `ClerkProvider`, and take the learner's id from Clerk's session.

We will have the learner sign in, or make an account, only through Clerk's own modal, opened by `openSignIn` of `useClerk()` for the "Sign in" button and for a form an address opens alike, with Google's sign-in in a popup.

We will keep the modal out of Clerk's combined flow, giving the modal no `withSignUp` and `ClerkProvider` no `signInUrl`.

We will load `@clerk/clerk-js` and `@clerk/ui` from Clerk's CDN when the page runs, as `@clerk/react` does by default, and bundle neither.

We will rest, for the sign-in form, only on Clerk's typed API, and name none of Clerk's markup, class names or internals.

We will make the "Sign in" button, the account button and its menu components of the app's own.

## Alternatives considered

### Firebase Authentication or Supabase Auth

Rejected by the engineer's choice of Clerk, already proven in Flashy.

### Auth0

Rejected by the same choice.

### A sign-in form of the app's own, on Clerk's `useSignIn` and `useSignUp`

Rejected because every step of signing in that Clerk can produce, its errors and email code checks included, becomes the app's to write and test.

### Clerk's `<SignIn />` mounted in a popover or a modal of the app's own, under `routing="virtual"` or `routing="hash"`

Rejected because each step after the first changes the address and adds an entry to the history, and Back walks through the steps.

### `<SignInButton mode="modal">` around the app's button

Rejected because a form an address opens has no press and still calls `openSignIn`, so one form has two ways of opening, each with props to keep in step.

### `openSignIn` with `withSignUp`

Rejected because "Sign up" then leaves the app for a page Clerk hosts.

### `@clerk/ui` bundled through `ui`

Rejected because every fix to the sign-in form then waits for the engineer to raise the package, the bundle grows, and `@clerk/clerk-js` still loads from the CDN.

### Both packages bundled

Rejected because every security fix to signing in then waits for the engineer.

## Consequences

### Positive

- The next developer reuses Flashy's sign-in pattern and its mock of `@clerk/react`.
- The next developer opens the form by one call, and writes no popover, placement or z-index for it.
- A learner signs in or makes an account with the address unchanged, and their Back never walks through the steps of signing in.
- A learner gets Clerk's fixes to the sign-in form, security fixes included, with no change to the repository.

### Negative

- The engineer owns a domain whose DNS records they can change before any learner can sign in for real.
- A `withSignUp` or a `signInUrl` added later sends a learner who presses "Sign up" to a page Clerk hosts, and no test fails.
- A break in Clerk's modal reaches learners with no commit and no deploy, with nothing in the repository showing when, and the engineer's check in a browser is the one guard.

### Neutral

- Every learner id the app keeps is a Clerk user id.
- The next developer finds the form's look and its place in Clerk's hands, and changes neither by the app's CSS.
