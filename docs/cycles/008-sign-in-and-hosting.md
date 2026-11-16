# 008 — Sign-in and hosting

Waits for: 005, no interface but through 006, and the files src/App.tsx, src/board/Board.tsx, src/board/Board.test.tsx and docs/vocabulary.md, which this cycle takes as 006 leaves them; 006, docs/vocabulary.md, src/index.css, src/board/Board.css and src/board/Board.test.tsx as it leaves them, src/board/Card.css as it leaves it, with no z-index on a resting card and 2 on a dragged one, `Board` and `BoardProps` in src/board/Board.tsx, `BoardsProvider` in src/board/BoardsProvider.tsx, `AppDeckScreen` in src/screens/AppDeckScreen.tsx and `App` in src/App.tsx; 007, the convex/ folder with its functions, the two Vitest projects of vite.config.ts, and package.json and package-lock.json as it leaves them

Canvas: https://claude.ai/artifact/1EbiDExQQK2SmoDBoQXzCm

## Goal

Outcome: A learner signs in or makes an account in Clerk's form, which "Sign in" at the top of the board opens centred over the dimmed board and which leaves the address unchanged through every step, sees their account button once signed in, whose menu shows their email address and "Sign out", and signs out to the app's own deck, with the app built for the root of the engineer's domain and Convex deployed by the same workflow.

Scope: The cycle covers Clerk's and Convex's providers around the app, Convex told of Clerk's tokens, the "Sign in" button and Clerk's own modal that it opens, the account button with its menu and "Sign out", the app built at the base path `/`, and the workflow deploying Convex and the page together. It leaves out the router, the list of decks, the sign-in form opened by an address and the report of its close, every call of a Convex function from the app, and the copy of index.html to 404.html.

Judgement: The engineer runs `npx convex dev` and `npm run dev` against a Clerk development instance that allows signing in with Google and with an email address and a password and issues tokens for Convex under the name `convex`, with its publishable key in `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY` and its issuer domain set on the Convex development deployment as `CLERK_JWT_ISSUER_DOMAIN`. Signed out, "Sign in" stands at the end of the board's bar; pressing it shows Clerk's form centred over the dimmed board, with Clerk's own words and "Secured by Clerk"; while the form shows, the board behind it can be neither used nor scrolled, and a press on the dimmed board closes the form. The engineer sorts some cards, makes an account in the form with an email address and a password, and finds the address unchanged at every step, and afterwards the board as they left it, the browser's history holding no step of signing in, and the account button in place of "Sign in"; its menu shows their email address and "Sign out", and signing out leaves the board as it was with "Sign in" back. Without reloading, the engineer then signs in with Google and finds the board as they left it again. The engineer reads .github/workflows/check-and-deploy.yml, and after the docket's branch reaches main finds the app at the root of the domain.

## Records

- PDR 013: Accounts keeping a learner's decks on every device, with the app's own deck open to all
- ADR 008: Clerk for signing the learner in, with its own modal as the sign-in form
- ADR 009: Convex for keeping the learners' decks, with one helper checking each deck's owner
- ADR 010: GitHub Pages at the engineer's own domain, with Convex deployed by the same workflow
- ADR 015: One map of boards by deck id above the routes, each fitted to its deck by a pure reducer
- ADR 016: The board as a view of a deck, its board and its acts, with Convex and Clerk kept out of it
- ADR 018: Vitest in four kinds, unit, component in jsdom, Convex functions under convex-test and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Clerk and Convex providers, "Sign in" and the sign-in form

**Status**

- [ ]

**Goal**

The app runs inside Clerk's and Convex's providers, and a learner who is not signed in sees "Sign in" at the end of the board's bar, which opens Clerk's sign-in form in Clerk's own modal, centred over the dimmed board, without a change of address.

**Dependencies**

None.

**Files**

- package.json
- package-lock.json
- convex/auth.config.ts, new
- convex/tsconfig.json
- src/App.tsx
- src/account/Account.tsx, new
- src/account/Account.css, new
- src/account/Account.test.tsx, new
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/screens/AppDeckScreen.tsx
- docs/vocabulary.md

**Details**

- The task must install `@clerk/react` as a dependency (ADR 008).
- `App` must render `ClerkProvider`, inside it `ConvexProviderWithClerk` from `convex/react-clerk` given one `ConvexReactClient` and Clerk's `useAuth`, inside it `BoardsProvider`, and inside it `AppDeckScreen` (ADR 009, ADR 015).
- The app must read Clerk's publishable key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` and Convex's address from `import.meta.env.VITE_CONVEX_URL`.
- `ClerkProvider` must be given no `signInUrl`, so that making an account happens inside Clerk's modal, and neither `ui` nor `Clerk`, so that Clerk's code loads from Clerk's CDN when the page runs (ADR 008).
- convex/auth.config.ts must name Clerk as Convex's one provider of identities, taking Clerk's issuer domain from the Convex environment variable `CLERK_JWT_ISSUER_DOMAIN` and the application id `convex`. Guidance: Convex's page on Clerk gives the file's form.
- convex/tsconfig.json must list node's types, `"types": ["node"]` in its `compilerOptions`, as tsconfig.app.json and tsconfig.node.json do, so that `process.env` typechecks in convex/auth.config.ts under `npm run typecheck`.
- The task must create this component, which with its test is the one file of src/ besides src/App.tsx that imports `@clerk/react`:

```tsx
// src/account/Account.tsx
/** "Sign in", which opens Clerk's sign-in form, while the learner is signed out; nothing while Clerk is loading or the learner is signed in. */
export default function Account(): ReactElement | null;
```

- `Board` must take what stands at the end of its bar as a prop and import nothing of Clerk (ADR 016):

```tsx
// src/board/Board.tsx, added to BoardProps
/** Shown at the end of the bar, after the score. */
account?: ReactNode;
```

- `AppDeckScreen` must pass `<Account />` as `account`.
- While the learner is signed out, `Account` must render a `<button type="button">` reading "Sign in", with the look of the bar's Reset button at every width, the focus outline Reset shows when the keyboard focuses it and its least size on a screen at most 720px wide included, given by a class of its own in src/account/Account.css that takes the same custom properties and leaves out Reset's push to the right. It stands at the end of the bar, where drawing 7 shows it.
- Pressing "Sign in" must open the form through `openSignIn` of Clerk's `useClerk()`, with Google's sign-in in a popup, and the learner must sign in or make an account through nothing else of Clerk. The call must be given no `withSignUp` (ADR 008).
- The form is Clerk's own modal. It must show centred over the screen the learner is on, with that screen dimmed behind it and neither usable nor scrollable until the form closes, as drawing 7 shows it over the board; a press anywhere on the dimmed screen must close the form; and the address must stay the same through every step of signing in or of making an account. Clerk's modal does each of these by itself (ADR 008): the task must render no dialog, backdrop or popover of its own, write no CSS for the form, pass no `appearance`, and name none of Clerk's markup or class names.
- No step of signing in or of making an account may reload the page or change the address: making an account happens in the same modal, and after signing in the learner must be on the same screen with the board as they left it (PDR 013, ADR 008).
- `ClerkProvider` must be given, for pushing the address and for replacing it alike, one function of src/App.tsx, `stayOnPage(to: string): void`, which replaces the current entry of the browser's history with `to` through `window.history.replaceState` and loads nothing, so that Clerk's move after a sign-in or a new account reloads nothing and adds no entry to the history.
- Guidance: after a sign-in or a new account the modal sends the learner to the address they are at unless it is given another, so the call of `openSignIn` needs no address.
- Clerk closes its modal once the learner is signed in, and the task closes nothing. While the learner is signed in, `Account` renders nothing in this task.
- Every word inside the form must be Clerk's own: the task passes no `localization`, and "Secured by Clerk" shows under the form.
- src/account/Account.test.tsx must mock `@clerk/react`, and no test reaches Clerk or Convex (ADR 008).
- The task's tests mock Clerk (ADR 018), so the builder never sees Clerk's modal. Its evidence for the form is the test that a press on "Sign in" calls `openSignIn`; the form's place, the dimmed screen behind it and the unchanged address are the engineer's to check in a browser, and the Debrief says so.
- docs/vocabulary.md must hold these two rows, each character for character, added as the table's last rows:

```
| Account | Sign in | "Sign in" | A button at the top of the board while signed out | the Sign in button in `Account` in src/account/Account.tsx |
| Account | Sign-in form, for signing in or making an account | Clerk's own words for signing in and making an account, as "Continue with Google"; "Secured by"; Clerk's logo | A form centred over the dimmed board while signed out | Clerk's modal, opened by `openSignIn` in `Account` in src/account/Account.tsx |
```

- Guidance: among the props `openSignIn` takes is one that chooses the flow of a sign-in through another service, a popup among its values.
- Guidance: the `ConvexReactClient` is made once, at module level in src/App.tsx.
- Guidance: before the app is run, the engineer turns on Clerk's integration with Convex, which issues tokens under the name `convex`, puts `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` and sets `CLERK_JWT_ISSUER_DOMAIN` on the Convex development deployment; the tests need none of the three.

**Out of scope**

- The account button, its menu and "Sign out": T2.
- The form as drawing 7 draws it, its box, its cross, its heading, its fields, its buttons and its foot, and the dimming of the board behind it: never; Clerk's modal renders each (ADR 008).
- Words of the app's own on the cross of Clerk's modal: an unsettled decision.
- Opening the form from an address, a container of the app's own for the modal, learning that the form has closed, or replacing the address when it closes: a later cycle.
- A call of any Convex function from src/: a later cycle.
- Clerk's `<SignIn />` mounted in a popover or a modal of the app's own, `<SignInButton>`, a sign-in form of the app's own, or `openSignIn` with `withSignUp`: never (ADR 008).
- A page of its own for signing in: never (PDR 013).
- `@clerk/ui` or `@clerk/clerk-js` bundled into the build: never (ADR 008).
- What cycle 006 ruled out of drawing 7 stays out: the italic letter i in a bordered circle that it draws for the ⓘ.

**Done when**

- These tests in src/account/Account.test.tsx pass:
  - `shows nothing while Clerk is loading`
  - `shows Sign in while the learner is signed out`
  - `pressing Sign in opens Clerk's sign-in form through openSignIn`
  - `openSignIn is given no withSignUp`
- The test `shows what it is given as account at the end of the bar` in src/board/Board.test.tsx passes.
- Every other test passes under `npm test`.
- `git grep --untracked -l "@clerk/react" -- src` prints exactly `src/App.tsx`, `src/account/Account.test.tsx` and `src/account/Account.tsx`.
- `git grep --untracked -l -E "signInUrl|<SignIn" -- src` prints nothing.
- Each of the two rows of the Details is a line of docs/vocabulary.md.
- `npm run typecheck` exits with status 0.

**Debrief**

None.

### T2 — Account button, its menu and "Sign out"

**Status**

- [ ]

**Goal**

A signed-in learner sees, in place of "Sign in", their profile picture or the first letter of their email address in a circle, which opens a menu showing their email address and "Sign out", and signing out leaves them on the board of the app's own deck with "Sign in" back.

**Dependencies**

- T1: `Account` in src/account/Account.tsx and its tests' mock of `@clerk/react`; the `account` prop of `Board`; `stayOnPage` in src/App.tsx, given to `ClerkProvider`.

**Files**

- src/account/Account.tsx
- src/account/Account.css
- src/account/Account.test.tsx
- src/board/Board.css
- src/index.css
- docs/vocabulary.md

**Details**

- While the learner is signed in, `Account` must render, in place of "Sign in", one `<button type="button">` whose accessible name is "Account" and whose `aria-expanded` tells whether its menu is open.
- The account button must show the learner's profile picture when Clerk says they have one, and otherwise the first letter of their email address, in upper case, in the circle drawing 1 shows. The picture must fill the circle, cropped to cover it, with an empty `alt`. On a screen at most 720px wide the circle and "Sign out" are 44px high, and the circle 44px wide. The account button shows the focus outline every other control shows when the keyboard focuses it.
- Pressing the account button must open a menu under it that shows the email address the learner is signed in with and one `<button type="button">` reading "Sign out". The menu is a plain element with no ARIA role of its own, laid over the board: its top edge 10px below the bar's bottom edge and its right edge at the board's right padding, wherever the bar's wrapping puts the account button. src/account/Account.css must place the menu against its nearest positioned ancestor and name no class of the board, and src/board/Board.css must make the board's bar that ancestor (`position: relative`), so that another screen's bar can hold `Account` the same way. Among the page's layers the menu lies above the board's resting cards, under a card being dragged and under the scrim of a panel, by a z-index that is a custom property of its own in src/index.css: above a resting card, which bears none, and below the 2 of a dragged card, `.card-dragging` in src/board/Card.css. It holds the email address and, under it, "Sign out", in one column with the padding of the board's regions, the email address aligned to the column's start and "Sign out" at the column's start at its own width; it is as wide as its content and never wider than the screen less the board's padding on each side, a long email address wraps, and the board's gap stands between the email address and "Sign out". Pressing the account button again closes it, and so does signing out; a press outside it leaves it open. "Sign out" has the look of the bar's Reset button at every width, leaving out Reset's push to the right as "Sign in" does, and the email address is plain text in the label colour.
- "Sign out" must sign the learner out through Clerk without reloading the page and with the address left as it is, with no entry added to the browser's history, by handing Clerk's `signOut` the current address as the address to go to afterwards, which `stayOnPage` then replaces with itself. Afterwards `Account` shows "Sign in" and the board is as the learner left it (ADR 015).
- docs/vocabulary.md must hold these three rows, each character for character, added as the table's last rows. The account button's Where names only the screen this cycle builds:

```
| Account | Account button, the learner's profile picture or the first letter of their email address in a circle | the learner's profile picture, or the first letter of their email address, as "S"; "Account", spoken | The top of the board while signed in | the account button in `Account` in src/account/Account.tsx |
| Account | Email address signed in with | the learner's email address | The menu the account button opens | the menu in `Account` in src/account/Account.tsx |
| Account | Sign out | "Sign out" | The menu the account button opens | the Sign out button in `Account` in src/account/Account.tsx |
```

- Guidance: Clerk's user holds whether they have a picture, the picture's address and their primary email address.
- Guidance: the Escape key, pressed while the focus is on the account button or inside the menu, closes the menu and returns the focus to the account button; the menu listens for it on those two alone and never on `document`, so the Escape that closes a panel closes no menu. Opening the menu moves the focus nowhere, and after "Sign out" the task moves the focus nowhere.
- The circle's fill and its letter take the colours a pressed control has in src/index.css, and each new size of this task, the circle's 34px and the menu's 10px among them, is a custom property there.
- Every learner has an email address, since each way of signing in gives one (PDR 013). While Clerk has not yet given the signed-in learner's details, `Account` renders nothing. Should Clerk give a signed-in learner no email address, the circle shows no letter and the menu holds "Sign out" alone.
- Guidance: the menu takes the look of the board's regions, white with their border and radius.

**Out of scope**

- The "Back to the list of decks" button, the ⓘ on each dimension and on each zone's label, the dashed fields, "Save answers", and the name field and Delete in the panel that drawing 1 shows: a later cycle, and the name field an unsettled decision.
- What cycle 006 ruled out of drawing 1 stays out: the italic letter i in a bordered circle, the ⓘ with no background, and the blue ring around the ⓘ of the open card.
- The account button on the list of decks: a later cycle.
- Going to another address on signing out: a later cycle.
- Clerk's own `UserButton`: never (ADR 008).

**Done when**

- These tests in src/account/Account.test.tsx pass:
  - `shows the account button in place of Sign in while the learner is signed in`
  - `the account button shows the profile picture of a learner who has one`
  - `the account button shows the first letter of the email address, in upper case, of a learner with no picture`
  - `pressing the account button opens a menu with the email address and Sign out, and pressing it again closes the menu`
  - `Sign out signs the learner out through Clerk`
- Every other test passes under `npm test`.
- Each of the three rows of the Details is a line of docs/vocabulary.md.

**Debrief**

None.

### T3 — Build at the root and Convex deployed by the workflow

**Status**

- [ ]

**Goal**

The app builds for the root of a domain, and the one workflow's deploy job, after the check job passes on a push to main, deploys the Convex functions with the build as their command and then deploys the build to Pages.

**Dependencies**

- T1: the environment variable `VITE_CLERK_PUBLISHABLE_KEY` the build reads.

**Files**

- vite.config.ts
- .github/workflows/check-and-deploy.yml

**Details**

- vite.config.ts must set the base path to `/` (ADR 010).
- The check job must keep its triggers and its steps of install, typecheck, test and build, and must no longer upload the Pages artifact.
- The deploy job must keep running only on a push to main and only after the check job passes, and its steps must be, in this order: check out the repository; set up Node 24 with the npm cache; `npm ci`; `npx convex deploy --cmd 'npm run build'`; upload dist as the Pages artifact; deploy to Pages (ADR 010).
- The step that runs `npx convex deploy` must take `CONVEX_DEPLOY_KEY` from the repository secret `CONVEX_DEPLOY_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` from the repository variable `VITE_CLERK_PUBLISHABLE_KEY`, and no other step takes either.
- The deploy job must keep its environment and its concurrency group as they are today, and its permissions must be `contents: read`, `pages: write` and `id-token: write`, the first for the step that checks out the repository.
- The builder cannot run the workflow. Its evidence is the file, and the build's paths.
- The checks of the cycle's Judgement that need a browser, a second device or the engineer's accounts are the engineer's. The builder's evidence for the Judgement is the tests this cycle names, and its Debrief says so.

**Out of scope**

- The domain itself, the repository's secret and variable, Pages' settings and branch protection: never; the engineer sets each once.
- Copying index.html to 404.html in the build: a later cycle.
- A second workflow, or a deploy of Convex by hand: never (ADR 010).

**Done when**

- After `npm run build`, `grep -c "/SortIt/" dist/index.html` prints `0`, and `grep -c -E "(src|href)=\"/assets/" dist/index.html` prints a number above 0.
- `grep -c "upload-pages-artifact" .github/workflows/check-and-deploy.yml` prints `1`, and that line stands in the deploy job after the line holding `npx convex deploy --cmd 'npm run build'`.
- `grep -c "CONVEX_DEPLOY_KEY: \${{ secrets.CONVEX_DEPLOY_KEY }}" .github/workflows/check-and-deploy.yml` prints `1`, and `grep -c "VITE_CLERK_PUBLISHABLE_KEY: \${{ vars.VITE_CLERK_PUBLISHABLE_KEY }}" .github/workflows/check-and-deploy.yml` prints `1`.
- Every test passes under `npm test`.

**Debrief**

None.
