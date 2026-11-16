# 008 — Sign-in and hosting

Waits for: 005, no interface but through 006, and the files src/App.tsx, src/board/Board.tsx, src/board/Board.test.tsx and docs/vocabulary.md, which this cycle takes as 006 leaves them; 006, docs/vocabulary.md, src/index.css, src/board/Board.css and src/board/Board.test.tsx as it leaves them, src/board/Card.css as it leaves it, with no z-index on a resting card and 2 on a dragged one, `Board` and `BoardProps` in src/board/Board.tsx, `BoardsProvider` in src/board/BoardsProvider.tsx, `AppDeckScreen` in src/screens/AppDeckScreen.tsx and `App` in src/App.tsx; 007, the convex/ folder with its functions, the two Vitest projects of vite.config.ts, and package.json and package-lock.json as it leaves them

Canvas: https://claude.ai/artifact/1EbiDExQQK2SmoDBoQXzCm

## Goal

Outcome: A learner signs in or makes an account in Clerk's form hung under "Sign in" at the top of the board, sees their account button once signed in, whose menu shows their email address and "Sign out", and signs out to the app's own deck, with the app built for the root of the engineer's domain and Convex deployed by the same workflow.

Scope: The cycle covers Clerk's and Convex's providers around the app, Convex told of Clerk's tokens, the "Sign in" button and the popover holding Clerk's form, the account button with its menu and "Sign out", the app built at the base path `/`, and the workflow deploying Convex and the page together. It leaves out the router, the list of decks, every call of a Convex function from the app, and the copy of index.html to 404.html.

Judgement: The engineer runs `npx convex dev` and `npm run dev` against a Clerk development instance that allows signing in with Google and with an email address and a password and issues tokens for Convex under the name `convex`, with its publishable key in `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY` and its issuer domain set on the Convex development deployment as `CLERK_JWT_ISSUER_DOMAIN`. Signed out, "Sign in" stands at the end of the board's bar; pressing it hangs Clerk's form under it, and pressing it again takes the form away; the form hangs over the right of the board, which stays undimmed, with Clerk's own words and "Secured by Clerk". The engineer sorts some cards, makes an account in the form with an email address and a password, and finds the board as they left it, the address unchanged and the account button in place of "Sign in"; its menu shows their email address and "Sign out", and signing out leaves the board as it was with "Sign in" back. Without reloading, the engineer then signs in with Google and finds the board as they left it again. The engineer reads .github/workflows/check-and-deploy.yml, and after the docket's branch reaches main finds the app at the root of the domain.

## Records

- PDR 013: Accounts keeping a learner's decks on every device, with the app's own deck open to all
- ADR 008: Clerk for signing the learner in, with its sign-in component in a popover of the app's own
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

The app runs inside Clerk's and Convex's providers, and a learner who is not signed in sees "Sign in" at the end of the board's bar, which opens and closes Clerk's sign-in form in a popover under it, without a backdrop and without a change of address.

**Dependencies**

None.

**Files**

- package.json
- package-lock.json
- convex/auth.config.ts, new
- src/App.tsx
- src/account/Account.tsx, new
- src/account/Account.css, new
- src/account/Account.test.tsx, new
- src/board/Board.tsx
- src/board/Board.test.tsx
- src/board/Board.css
- src/screens/AppDeckScreen.tsx
- src/index.css
- docs/vocabulary.md

**Details**

- The task must install `@clerk/react` as a dependency (ADR 008).
- `App` must render `ClerkProvider`, inside it `ConvexProviderWithClerk` from `convex/react-clerk` given one `ConvexReactClient` and Clerk's `useAuth`, inside it `BoardsProvider`, and inside it `AppDeckScreen` (ADR 009, ADR 015).
- The app must read Clerk's publishable key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` and Convex's address from `import.meta.env.VITE_CONVEX_URL`.
- convex/auth.config.ts must name Clerk as Convex's one provider of identities, taking Clerk's issuer domain from the Convex environment variable `CLERK_JWT_ISSUER_DOMAIN` and the application id `convex`. Guidance: Convex's page on Clerk gives the file's form.
- The task must create this component, which with its test is the one file of src/ besides src/App.tsx that imports `@clerk/react`:

```tsx
// src/account/Account.tsx
/** "Sign in" with Clerk's form while the learner is signed out; nothing while Clerk is loading or the learner is signed in. */
export default function Account(): ReactElement | null;
```

- `Board` must take what stands at the end of its bar as a prop and import nothing of Clerk (ADR 016):

```tsx
// src/board/Board.tsx, added to BoardProps
/** Shown at the end of the bar, after the score. */
account?: ReactNode;
```

- `AppDeckScreen` must pass `<Account />` as `account`.
- While the learner is signed out, `Account` must render a `<button type="button">` reading "Sign in", with the look of the bar's Reset button at every width, given by a class of its own in src/account/Account.css that takes the same custom properties and leaves out Reset's push to the right, whose `aria-expanded` tells whether the form is open. Pressing it opens the form, and pressing it again closes the form.
- The form must be Clerk's `<SignIn />` component with `routing="virtual"` and Google's sign-in in a popup, rendered in a popover of the app's own: an element placed by the app's CSS under the "Sign in" button, over the right of the board, with no backdrop, so the board stays undimmed and in view around it (ADR 008). The popover must be placed as drawing 7 shows: its right edge at the board's right padding and its top edge 10px below the bar's bottom edge. It is placed against the bar, not against the button: where the bar wraps and "Sign in" stands elsewhere in it, the popover keeps this place. src/account/Account.css must place the popover against its nearest positioned ancestor and name no class of the board, and src/board/Board.css must make the board's bar that ancestor (`position: relative`), so that another screen's bar can hold `Account` the same way. It must have `role="dialog"`, be named by the "Sign in" button through `aria-labelledby`, and have no border, background, radius or shadow of its own, since Clerk's card draws them.
- The form must also close once the learner is signed in. While the learner is signed in, `Account` renders nothing in this task.
- No step of signing in or of making an account may reload the page or change the address: making an account happens in the same form in the popover, and after signing in the learner must be on the same screen with the board as they left it (PDR 013, ADR 008).
- `ClerkProvider` must be given, for pushing the address and for replacing it alike, one function of src/App.tsx, `stayOnPage(to: string): void`, which replaces the current entry of the browser's history with `to` through `window.history.replaceState` and loads nothing. `SignIn` must be handed the current address as the address to go to after signing in and after making an account, so that Clerk's move changes neither the address nor the history (ADR 008).
- A press outside the popover leaves the form open.
- The popover must lie above the board's resting cards, under a card being dragged and under the scrim of a panel, by a z-index that is a custom property in src/index.css: above a resting card, which bears none once cycle 006 is built, and below the 2 of a dragged card, `.card-dragging` in src/board/Card.css.
- On a screen too narrow for Clerk's card with the board's padding on each side, the popover is no wider than the bar, so nothing of it passes the screen's edge; Clerk's card keeps inside it the width Clerk gives it, the task sizing nothing of Clerk's markup; and the popover's top edge stays 10px below the bar's bottom edge however many rows the bar takes. The popover keeps its right edge at the bar's right edge at every width, and Clerk's card stands at the popover's right.
- Guidance: the popover is as wide as its content and no wider than the bar, which needs no breakpoint and no width of Clerk's written in src/account/Account.css.
- Every word inside the form must be Clerk's own: the task passes no `localization` and hides or rewords nothing of the form through `appearance`, and "Secured by Clerk" shows under it.
- src/account/Account.test.tsx must mock `@clerk/react`, and no test reaches Clerk or Convex (ADR 008).
- docs/vocabulary.md must hold these two rows, each character for character, added as the table's last rows:

```
| Account | Sign in | "Sign in" | A button at the top of the board while signed out | the Sign in button in `Account` in src/account/Account.tsx |
| Account | Sign-in form, for signing in or making an account | Clerk's own words for signing in and making an account, as "Continue with Google"; "Secured by"; Clerk's logo | A form under "Sign in" at the top of the board while signed out | Clerk's `SignIn` in `Account` in src/account/Account.tsx |
```

- Guidance: `SignIn` takes the address to go to after signing in, and a prop that puts making an account in the same component; the current address and that prop keep Clerk from loading a page.
- Guidance: the Escape key closes the form, focus moves into the form when it opens, and returns to "Sign in" when it closes.
- src/index.css takes each new size as a custom property, as the popover's 10px.
- Guidance: the `ConvexReactClient` is made once, at module level in src/App.tsx.
- Guidance: before the app is run, the engineer turns on Clerk's integration with Convex, which issues tokens under the name `convex`, puts `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` and sets `CLERK_JWT_ISSUER_DOMAIN` on the Convex development deployment; the tests need none of the three.

**Out of scope**

- The account button, its menu and "Sign out": T2.
- The inside of the form as drawing 7 draws it, its heading, its fields and its buttons: never; Clerk's component renders it.
- Opening the form from an address, or replacing the address when it closes: a later cycle.
- A call of any Convex function from src/: a later cycle.
- Clerk's `openSignIn`, a page of its own for signing in, or `routing="hash"`: never (ADR 008).
- A backdrop behind the popover: never.
- The cross drawing 7 shows at the popover's upper right corner: an unsettled decision.
- What cycle 006 ruled out of drawing 7 stays out: the italic letter i in a bordered circle that it draws for the ⓘ.
- The box drawing 7 draws around the form, with its border, radius, shadow and grey foot: never; Clerk's card draws its own.
- The name drawing 7 gives the dialog, "Sign in to Sort It": never; the dialog is named by the "Sign in" button.
- The blue ring drawing 7 shows around "Sign in": never as the look of the open form; "Sign in" shows the focus outline every other control shows when the keyboard focuses it.

**Done when**

- These tests in src/account/Account.test.tsx pass:
  - `shows nothing while Clerk is loading`
  - `shows Sign in while the learner is signed out`
  - `pressing Sign in shows Clerk's sign-in form after it and pressing it again removes the form`
  - `the sign-in form is a dialog named by the Sign in button`
  - `the sign-in form is Clerk's SignIn with virtual routing`
- The test `shows what it is given as account at the end of the bar` in src/board/Board.test.tsx passes.
- Every other test passes under `npm test`.
- `git grep --untracked -l "@clerk/react" -- src` prints exactly `src/App.tsx`, `src/account/Account.test.tsx` and `src/account/Account.tsx`.
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
- src/index.css
- docs/vocabulary.md

**Details**

- While the learner is signed in, `Account` must render, in place of "Sign in", one `<button type="button">` whose accessible name is "Account" and whose `aria-expanded` tells whether its menu is open.
- The account button must show the learner's profile picture when Clerk says they have one, and otherwise the first letter of their email address, in upper case, in the circle drawing 1 shows. The picture must fill the circle, cropped to cover it, with an empty `alt`. On a screen at most 720px wide the circle and "Sign out" are 44px high, and the circle 44px wide. The account button shows the focus outline every other control shows when the keyboard focuses it.
- Pressing the account button must open a menu under it that shows the email address the learner is signed in with and one `<button type="button">` reading "Sign out". The menu is a plain element with no ARIA role of its own, laid over the board in the place T1 gives the sign-in form: its top edge 10px below the bar's bottom edge and its right edge at the board's right padding, wherever the bar's wrapping puts the account button. It lies where T1 puts the sign-in form among the page's layers, by the same custom property: above the board's resting cards, under a card being dragged and under the scrim of a panel. It holds the email address and, under it, "Sign out", in one column with the padding of the board's regions, the email address aligned to the column's start and "Sign out" at the column's start at its own width; it is as wide as its content and never wider than the screen less the board's padding on each side, a long email address wraps, and the board's gap stands between the email address and "Sign out". Pressing the account button again closes it, and so does signing out; a press outside it leaves it open. "Sign out" has the look of the bar's Reset button at every width, leaving out Reset's push to the right as "Sign in" does, and the email address is plain text in the label colour.
- "Sign out" must sign the learner out through Clerk without reloading the page and with the address left as it is, with no entry added to the browser's history, by handing Clerk's `signOut` the current address as the address to go to afterwards, which `stayOnPage` then replaces with itself. Afterwards `Account` shows "Sign in" and the board is as the learner left it (ADR 015).
- docs/vocabulary.md must hold these three rows, each character for character, added as the table's last rows. The account button's Where names only the screen this cycle builds:

```
| Account | Account button, the learner's profile picture or the first letter of their email address in a circle | the learner's profile picture, or the first letter of their email address, as "S"; "Account", spoken | The top of the board while signed in | the account button in `Account` in src/account/Account.tsx |
| Account | Email address signed in with | the learner's email address | The menu the account button opens | the menu in `Account` in src/account/Account.tsx |
| Account | Sign out | "Sign out" | The menu the account button opens | the Sign out button in `Account` in src/account/Account.tsx |
```

- Guidance: Clerk's user holds whether they have a picture, the picture's address and their primary email address.
- Guidance: the Escape key closes the menu and returns the focus to the account button. Opening the menu moves the focus nowhere, and after "Sign out" the task moves the focus nowhere.
- The circle's fill and its letter take the colours a pressed control has in src/index.css, and each new size of this task, the circle's 34px among them, is a custom property there.
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
