# ADR 005: GitHub Pages by one Actions workflow of a check job and a deploy job

## Status

Active

## Context

The app is static. PDR 002 puts everything on one screen, and PDR 006 ships one set, keeps nothing between visits and needs no account, so static files serve the whole app and no server stands behind it.

The repository is public at github.com/lushihui51/SortIt, and GitHub Pages is not enabled on it. GitHub Pages serves a repository's site at the owner's github.io address under a path named after the repository, and can take the files from a GitHub Actions workflow, from a committed folder or from a branch.

The requirements name Vercel, Netlify and GitHub Pages as free hosts for static files. Netlify and Vercel each need an account and a project linked to the repository from outside it.

ADR 001 builds the app with Vite and runs the tests under Vitest, with npm scripts for each. ADR 004 relies on a set that fails the validator failing the tests before it merges, and the record rules' citation guard relies on a stale citation failing a test; each holds only where the tests run before a merge, on every pull request.

## Decision

We will build the app to static files with Vite and publish them on GitHub Pages.

We will run one GitHub Actions workflow with two jobs. The check job runs on every pull request and every push to main: it installs with npm, typechecks, runs every test and builds. The deploy job runs only on a push to main and only after the check job passes, and deploys the build output to Pages.

We will set Vite's base path to the repository's name, so that the page is served under the path GitHub Pages gives the repository.

## Alternatives considered

### Netlify or Vercel

Rejected because each needs an account and a project linked outside the repository, where Pages lives with it.

### Pages from a committed build folder or a gh-pages branch

Rejected because built files are then committed and go stale against the source.

### Tests on the developer's machine only

Rejected because a merge from a machine that skipped them deploys a broken set.

### A second workflow file for the checks

Rejected because the deploy then runs whether or not the checks passed, unless the two are wired together.

## Consequences

### Positive

- The learner gets every merge to main that passes the checks within minutes, and a merge that fails them leaves the previous deploy live.
- The next developer finds the checks and the deploy in one file in the repository, with nothing linked outside it.

### Negative

- The engineer enables Pages with GitHub Actions as its source once, and a failing check job blocks a pull request only once the engineer requires it in branch protection.
- The next developer who renames the repository changes the base path with it, because it is the one setting that breaks every asset.

### Neutral
