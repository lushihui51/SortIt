# ADR 010: GitHub Pages at the engineer's own domain, with Convex deployed by the same workflow

## Status

Active

## Context

ADR 005, which this record replaces, published the app on GitHub Pages at the owner's github.io address, under a path named after the repository, with Vite's base path set to the repository's name, by one GitHub Actions workflow of a check job and a deploy job. The app now signs learners in and keeps their decks in a backend.

Clerk, with which ADR 008 signs the learner in, runs in production only on a domain whose DNS records its owner can change, and a host's own address, such as the owner's github.io address, takes no such records.

GitHub Pages serves a repository's site at the root of a custom domain or subdomain set on the repository. Vite builds the page's asset paths from its base path.

ADR 009 keeps the decks in Convex, whose functions run in a deployment of Convex's own. `npx convex deploy --cmd` runs a build with `VITE_CONVEX_URL` set to the production deployment, and then pushes the functions to it. `CONVEX_DEPLOY_KEY` names the deployment in CI. `npx convex dev` runs a development deployment and pushes the functions as they change.

Clerk's publishable key is built into the page and is not secret. GitHub hides a repository secret from the workflow's logs, and shows a repository variable.

A page left open keeps calling the Convex functions after a newer page and newer functions are deployed.

ADR 001 builds the app with Vite and runs the tests under Vitest, by npm scripts. ADR 007 runs the validator of the app's own deck as a test, and the record rules' citation guard is a test; each protects main only where the tests run before a merge.

Netlify, Vercel and Cloudflare Pages each need an account and a project linked to the repository from outside it.

## Decision

We will build the app to static files with Vite and publish them on GitHub Pages at the root of a domain or subdomain the engineer owns, with Vite's base path set to `/`.

We will run one GitHub Actions workflow with two jobs, a check job and a deploy job.

We will have the check job run on every pull request and every push to main, and install with npm, typecheck the app, the tests and `convex/`, run every test and build.

We will have the deploy job run only on a push to main and only after the check job passes, run `npx convex deploy` with the build as its command, taking `CONVEX_DEPLOY_KEY` from a repository secret and Clerk's publishable key from a repository variable, and then deploy the build output to Pages.

## Alternatives considered

### The owner's github.io address, as ADR 005 decided

Rejected because Clerk cannot run in production there.

### Netlify, Vercel or Cloudflare Pages

Rejected by the engineer's choice of GitHub Pages, which keeps the checks and the deploy in the repository with no other account.

### Pages from a committed build folder or a gh-pages branch

Rejected because built files are then committed and go stale against the source.

### Convex deployed by hand

Rejected because the page and the functions then go live apart, and drift with nothing failing.

### A second workflow for Convex or for the checks

Rejected because a deploy then runs whether or not the checks passed, unless the two are wired together.

### Tests on the developer's machine only

Rejected because a merge from a machine that skipped them deploys a broken deck.

## Consequences

### Positive

- The learner gets every merge to main that passes the checks, page and functions together, and a merge that fails them leaves the previous deploy live.
- The next developer finds the checks and both deploys in one file in the repository.
- The next developer can rename the repository without breaking an asset.

### Negative

- The engineer renews the domain outside the repository, or the app and its sign-in go down.
- The engineer enables Pages with GitHub Actions as its source, sets the domain on the repository, adds one secret and one variable, and requires the check job in branch protection, each once.
- The next developer keeps every Convex function accepting the calls of the previous page, because the functions go live a moment before the page and a page left open keeps calling them.

### Neutral

- The next developer runs `npx convex dev` beside the dev server in development.
