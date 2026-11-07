# ADR 001: TypeScript on React, with Vite, Vitest and npm, as the toolchain

## Status

Active

## Context

No code exists yet. The first cycle starts from an empty repository, and every library and tool chosen afterwards is chosen against the language, framework and build tool chosen here.

The app is one page. PDR 002 puts everything the learner does on one screen, and PDR 006 ships one set, keeps nothing between visits and needs no account, so no server and no database stand behind the page, and static files serve it.

The screen is busy. Under PDR 001 the board holds a dimension of up to about 30 items and 6 categories, and under PDR 002 every move of a card changes what the pool and the zones show, so the whole board is redrawn on every act of the learner.

The requirements name dnd-kit as the drag library, and dnd-kit is a React library. A framework other than React would put it out of reach and leave the drag library to be chosen again.

The engineer's machine has Node 24 and npm 11 installed and no other package manager.

The record rules require the repository to hold one test, the record citation guard, so a test runner is needed in the first cycle, before any component is written.

## Decision

We will write the app in TypeScript on React.

We will build the app, and serve it in development, with Vite.

We will run the tests under Vitest.

We will manage the packages with npm.

## Alternatives considered

### Svelte or Vue

Rejected because dnd-kit binds to React, and every later library would be chosen anew for the other framework.

### Plain TypeScript with no framework

Rejected because the board redraws about thirty cards on every move, and that rendering would be written and maintained by hand.

### Next.js or another server framework

Rejected because the app is one static page with no server.

## Consequences

### Positive

- The next developer finds a stock Vite React TypeScript project and runs, tests and builds it with npm scripts.
- The next developer picks the drag library the requirements name, and every later library, from React's ecosystem.

### Negative

- The next developer must know React to change the board.
- A later change of framework costs the next developer every React-bound library with it.

### Neutral
