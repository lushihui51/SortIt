# Cycle 001: Toolchain, guard and workflow

## Goal

Outcome: The repository holds a Vite React TypeScript project whose one test command runs the record citation guard, whose page is titled "Sort It", and whose GitHub Actions workflow checks every pull request and deploys main to GitHub Pages.

Scope: The cycle covers the project scaffold under npm with React, TypeScript, Vite and Vitest; the npm scripts for development, typecheck, test and build; Vite's base path for GitHub Pages; the page title; the record citation guard as one Vitest test and the Commands section of AGENTS.md; and one workflow of a check job and a deploy job. It leaves out every component of the board, the set and its validator, component tests and their jsdom setup, and every stylesheet, and it leaves enabling Pages on the repository to the engineer.

Judgement: The engineer clones the cycle's branch fresh, runs `npm ci`, `npm test` and `npm run build`, and sees every test pass with the guard among them and static files under dist/ whose asset paths start with /SortIt/. The engineer appends a line citing a record no file holds to a tracked file outside docs/ and sees `npm test` fail listing that file and that citation, then removes the line. The engineer opens the dev server and sees a blank page in a tab titled "Sort It". The engineer reads the workflow file for the two jobs and sees the check job pass on the cycle's pull request. The deploy itself runs only after the docket's branch merges to main with Pages enabled, and is not part of this judgement.

## Records

- ADR 001: TypeScript on React, with Vite, Vitest and npm, as the toolchain
- ADR 005: GitHub Pages by one Actions workflow of a check job and a deploy job
- ADR 006: Vitest in three kinds, unit, component in jsdom and the record citation guard, with dragging checked by hand

## Tasks

### T1 — Project scaffold with the record citation guard

**Status**

- [ ]

**Goal**

The repository builds and serves a blank page titled "Sort It", typechecks, and passes one npm test command that runs the record citation guard, whose command AGENTS.md gives.

**Dependencies**

None.

**Files**

- package.json (new)
- package-lock.json (new)
- .gitignore (new)
- index.html (new)
- vite.config.ts (new)
- tsconfig.json (new)
- tsconfig.app.json (new)
- tsconfig.node.json (new)
- src/main.tsx (new)
- src/App.tsx (new)
- src/vite-env.d.ts (new)
- src/recordCitationGuard.test.ts (new)
- AGENTS.md
- docs/vocabulary.md

**Details**

- The project must be managed by npm and hold React, React DOM, TypeScript, Vite and Vitest at their current releases, with @vitejs/plugin-react, @types/react, @types/react-dom and @types/node as the only other development dependencies (ADR 001). Never add ESLint, Prettier, a CSS framework, a preprocessor or any other tool.
- Guidance: scaffold with `npm create vite@latest` and the `react-ts` template in a folder outside the repository, copy the files this task lists into the repository, and leave the rest behind.
- package.json must hold the name `sort-it`, `"private": true`, `"type": "module"`, and exactly these scripts:

  ```json
  "dev": "vite",
  "typecheck": "tsc -b",
  "test": "vitest run",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
  ```

- vite.config.ts must be the one configuration file for Vite and for Vitest, must use the React plugin, and must set `base: '/SortIt/'` (ADR 005). Vitest must run in its default `node` environment. Guidance: import `defineConfig` from `vitest/config` so that a `test` key typechecks.
- index.html must hold `<title>Sort It</title>` (LPD2: the app is named "Sort It"), the `root` div and the script tag for src/main.tsx, and never a favicon link or any other visible text.
- src/main.tsx must render `App` inside `StrictMode` into `root` and import no stylesheet. src/App.tsx must export as default a component `App` that returns `null`.
- Nothing of the template's demo must remain: no src/App.css, no src/index.css, no src/assets/, no public/, no README.md, and no ESLint configuration or ESLint dependency.
- .gitignore must ignore `node_modules` and `dist`.
- The guard, src/recordCitationGuard.test.ts, must be one Vitest test that does the following (ADR 006):
  1. Runs `git ls-files -z` at the repository root, `process.cwd()`, and keeps every path that does not start with `docs/`, plus `docs/backlog.md`.
  2. Reads each kept file as UTF-8 text and finds every match of `/\b(ADR|PDR) (\d{3})\b/g`.
  3. Reads the Status of every record: for each file in docs/adrs/ and docs/pdrs/ whose name matches `/^(\d{3})-.*\.md$/`, the type is ADR or PDR by the folder, the number is the name's first three digits, and the Status is the first non-blank line after the line `## Status`.
  4. Collects one line `<path>: <TYPE> <NNN> names no record` for every citation with no record of that type and number, and one line `<path>: <TYPE> <NNN> is <status>` for every citation of a record whose Status is not exactly `Active`.
  5. Passes only when no line was collected, and fails with the collected lines, one per line, as its message. Guidance: `expect(lines.join('\n')).toBe('')` makes Vitest print the lines.
- Never write a record citation, a record type followed by a space and three digits, in the guard's source, its test name included, or in any other file of this task.
- The Commands section of AGENTS.md must hold these four lines and no others:

  ```markdown
  - `npm test` runs every test, the record citation guard among them.
  - `npm run dev` serves the app for development.
  - `npm run typecheck` typechecks the app and the tests.
  - `npm run build` typechecks and builds the static files into dist/.
  ```

- In docs/vocabulary.md, the Title row's Where cell must read `The browser tab` and its Code cell must read `` the `<title>` of index.html ``.

**Out of scope**

- A stylesheet, the board and the set: a later cycle.
- jsdom, React Testing Library and a `test.environment` setting: the cycle that writes the first component test.
- The workflow: T2.
- A README: an unsettled decision.
- ESLint, Prettier or any linter: never; ADR 001 names the toolchain.
- Running the guard anywhere but under `npm test`: never; ADR 006 gives it one command.

**Done when**

- `npm ci` exits 0.
- `npm run typecheck` exits 0 and prints nothing after npm's own lines.
- `npm test` passes and its summary reads `Test Files  1 passed (1)` and `Tests  1 passed (1)`.
- After `git add -A`, since `git ls-files` lists the index, with the line `// ADR 099` appended to src/App.tsx, `npm test` fails and its output contains `src/App.tsx: ADR 099 names no record`.
- With the line `// ADR 001` appended to src/App.tsx instead, and the Status line of docs/adrs/001-typescript-on-react-with-vite-vitest-and-npm-as-the-toolchain.md changed to `Deprecated by a trial`, `npm test` fails and its output contains `src/App.tsx: ADR 001 is Deprecated by a trial`; both edits are then reverted and `npm test` passes again.
- `npm run build` exits 0 and `grep -o 'src="/SortIt/assets/[^"]*"' dist/index.html` prints exactly one line.
- `npm run dev`, opened in a browser at the URL it prints: the tab reads "Sort It" and the page shows nothing.
- `test ! -e README.md && test ! -e public && test ! -e src/App.css && test ! -e src/index.css && test ! -e src/assets && echo gone` prints `gone`.
- `sed -n '/^# Commands/,/^# Hard rules/p' AGENTS.md` prints the Commands heading, a blank line, the four lines of the Details, a blank line and the Hard rules heading.

**Debrief**

None.

### T2 — Check and deploy workflow

**Status**

- [ ]

**Goal**

Every pull request and every push to main runs a check job of install, typecheck, test and build, and a push to main that passes it deploys the build to GitHub Pages.

**Dependencies**

- T1: the npm scripts `typecheck`, `test` and `build`.

**Files**

- .github/workflows/check-and-deploy.yml (new)

**Details**

- There must be one workflow file, named `Check and deploy` in its `name` key, and never a second workflow file (ADR 005).
- It must trigger on `pull_request` for every branch and on `push` to `main` only, and must set `permissions: contents: read` at the workflow level.
- The `check` job must run on `ubuntu-latest` with these steps in this order: check out the repository; set up Node 24 with the npm cache; `npm ci`; `npm run typecheck`; `npm test`; `npm run build`; upload `dist` as the Pages artifact, this last step only when `github.event_name == 'push'`.
- The `deploy` job must have `needs: check` and `if: github.event_name == 'push'`, must hold `permissions` of `pages: write` and `id-token: write`, must run in the environment `github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`, and must have one step, with id `deployment`, that deploys the uploaded artifact to Pages.
- Never add a step that commits, pushes or writes anywhere but the runner.
- Guidance: use actions/checkout, actions/setup-node, actions/upload-pages-artifact and actions/deploy-pages at the current major version of each, read from each action's repository. A `concurrency` group named `pages` with `cancel-in-progress: false` keeps two deploys from racing.

**Out of scope**

- Enabling Pages with Actions as its source, and requiring the check job in branch protection: the engineer, outside the repository.
- A Netlify or Vercel configuration: never; ADR 005 chose Pages.
- A second workflow for the checks: never; ADR 005 chose one.
- A dependency cache beyond npm's: an unsettled decision.

**Done when**

- `npx --yes js-yaml .github/workflows/check-and-deploy.yml > /dev/null && echo parsed` prints `parsed`.
- `grep -nE "npm ci|npm run typecheck|npm test|npm run build|upload-pages-artifact|deploy-pages" .github/workflows/check-and-deploy.yml` prints six lines, in that order.
- `grep -c "needs: check" .github/workflows/check-and-deploy.yml` prints `1`.
- `grep -c "github.event_name == 'push'" .github/workflows/check-and-deploy.yml` prints `2`.
- The check job passes on the cycle's pull request; the engineer observes this, the builder cannot.

**Debrief**

None.
