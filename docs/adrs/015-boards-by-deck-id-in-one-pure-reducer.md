# ADR 015: Boards by deck id in one pure reducer

## Status

Active

## Context

ADR 003, which this record replaces, held one board in a reducer inside the board component, made when it mounts and closing over one fixed set. It stored a mark on each card at Check, and removed it when the card was selected or its drag started.

PDR 007 makes Check a switch. While it is on, a card's mark changes the moment the card lands; a no-answer mark shows on a card with no answer under the chosen dimension whether Check is on or off; and the score of the cards judged changes as cards move. Retry returns every incorrect card to the pool in random order and leaves every other card in place, and Check stays on or off across Reset and a change of dimension.

PDR 004 shows the pool in random order when a board is loaded and each time it is cleared, by Reset or by a change of dimension.

PDR 011 makes and deletes cards, categories and dimensions while the board shows. Deleting a category returns its cards to the pool, and deleting the chosen dimension returns the board to no dimension chosen, with every card in the pool.

PDR 013 keeps each deck's board as the learner left it while the page stays open, when they come back by the list of decks or by Forward, and leaves the learner's screen as it was when they sign in. A reload brings back the deck with every card in the pool and no dimension chosen.

ADR 007 gives every deck, card and category an id, and the app's own deck a fixed one.

ADR 017 shows each screen through React Router, which unmounts a screen when the learner leaves it. ADR 016 has the board component render from a board and a dispatch it is given.

React's StrictMode, in development, calls a reducer twice on each action and runs each effect twice on mount. A test holds a reducer to an exact result only when every input is in the test's hands.

A layout effect runs before the browser paints.

## Decision

We will hold every board in one `useReducer` of one component, `BoardsProvider` in src/board/, rendered inside the router and the Clerk and Convex providers, above the routes and outside any branch on whether the learner is signed in, whose state maps each deck's id to its board and lives in memory alone.

We will have each board hold the chosen dimension's id or none, the place of each card by its id, the pool or the zone of a category id, one order of card ids, and whether Check is on, and nothing else.

We will make each act on a board, loading, choosing a dimension, placing a card, Check, Retry and Reset, one action naming the deck id it applies to, and have the reducer, a pure function, apply it to that deck's board alone.

We will have every action that reads the deck carry the deck as it stands, and have the reducer first fit the board to that deck: a card the deck no longer holds leaves the board, a card the board does not hold joins the end of the order in the pool, a card in a zone whose category the chosen dimension no longer holds returns to the pool, and a chosen dimension the deck no longer holds leaves no dimension chosen with every card in the pool. We will fit the board the same way, by one pure function, at every render.

We will compute each card's mark, correct, incorrect or no answer, and the score from the fitted board and the deck wherever they are read, and never store them.

We will give a deck with no board its board by a `load` action carrying the deck, dispatched by a layout effect of its screen before the first paint, which changes nothing for a deck that has a board; and we will give each screen its board, and a dispatch bound to its deck id, through one hook, `useDeckBoard`.

We will have every action that shuffles carry a source of random numbers, from which the reducer draws; the app passes the browser's random source and the tests pass a fixed sequence, and the reducer draws no random number of its own.

We will shuffle the order on `load` and whenever the board is cleared, and have Retry return every card computed incorrect to the pool, permuted among the positions they held, and leave every other card in place.

## Alternatives considered

### The reducer inside the board component, shuffled when it mounts, as ADR 003 decided

Rejected because every Back, Forward or pass through the list unmounts it and loses the sort.

### Each opened deck's screen kept mounted and hidden under React's `<Activity>`

Rejected because the screens leave the router, and their panels, questions and fields are kept with the board.

### A store in a module read by `useSyncExternalStore`

Rejected because it outlives each test, and boards leak from one test into the next.

### The router's location state or `sessionStorage`

Rejected because each survives a reload, and location state is held per history entry, so a deck opened again from the list gets a fresh board.

### A board made by the deck's first action, with no `load`

Rejected because the pool shows the deck's own order, unshuffled, until the learner acts.

### Marks stored in the state, as ADR 003 decided

Rejected because they repeat what the places and the answers already say, and an act that forgets them leaves a stale mark with nothing failing.

### A reducer closing over one deck

Rejected because it is made again at every change of the deck, and an action queued under one deck is applied under another.

### An effect dispatching a change of deck

Rejected because the board renders a deleted card at least once, and a case the effect misses leaves it there.

### One array of cards per zone and one for the pool

Rejected because a card can then be in two places or none with nothing failing.

### Random numbers drawn inside the reducer, or a seed kept in the state

Rejected because the first makes the reducer impure, so StrictMode's two calls give two orders and no test can assert one, and the second threads a seed through every shuffle for the result the payload already gives.

### The dispatcher computing the order

Rejected because Retry's rule on positions then leaves the reducer, and is tested only through the screen.

## Consequences

### Positive

- A learner who comes back to a deck by the list or by Forward, or who signs in or out within the page, finds each board as they left it.
- The next developer tests every rule of PDR 007, and every effect of PDR 011 on the board, as a unit test of the reducer or of the fitting function, and asserts the exact order after every shuffle with a fixed random sequence.
- The next developer adds an act on a deck without touching the board.
- The next developer never meets a card in two places or none, nor a mark left stale.

### Negative

- The next developer passes a source of random numbers with every shuffling action.
- The page holds one board for each deck opened, until a reload.

### Neutral

- A reload starts every board over, since the boards live in memory alone.
