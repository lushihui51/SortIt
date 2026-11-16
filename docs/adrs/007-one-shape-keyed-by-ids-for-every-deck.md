# ADR 007: One shape keyed by ids for every deck

## Status

Active

## Context

ADR 004, which this record replaces, kept one shipped set in a bundled JSON file and keyed every dimension, category and item by its name, with no id anywhere. The app now holds, beside the app's own deck, decks a learner makes and changes, and every deck reaches the same board.

PDR 011 lets the learner rename a card, a dimension, a category or a deck at any time, and delete any of them. A deletion frees the name, and PDR 009 lets the learner give it again to a new thing. A card's answers refer to dimensions and categories, and the board refers to cards and categories for every card's place.

PDR 014 shows every change at once, whatever the connection. A card, a dimension, a category or a deck the learner makes offline is on the screen, and can be placed, before any server has seen it.

A learner's decks are kept in Convex (ADR 009). Convex gives a document made by an optimistic update a temporary id, and replaces it with the kept id once the server has the document.

Convex functions share code through modules in a folder under `convex/`, such as `convex/model`, and the app imports any module of the repository by a relative path. Whether a Convex function can import a module outside `convex/` is not known.

The browser's `crypto.randomUUID()` makes a random id of hex digits and hyphens on the device, in every browser PDR 001 serves.

PDR 009 holds the app's own deck to rules a learner's deck is not held to: every card has exactly one answer in every dimension, drawn from that dimension's categories; the deck holds at least one card and one dimension; and every dimension holds at least two categories. In every deck, no two cards, no two dimensions and no two categories of one dimension bear one name.

For the app's own deck when it breaks a rule, PDR 009 shows in place of the board that the deck cannot be shown, and one sentence naming the first fault and the thing at fault by its name, in words docs/vocabulary.md gives.

The app's own deck is edited by hand in one data file in the repository. ADR 001 builds the app with Vite, which bundles a JSON file the code imports, and TypeScript checks a JSON import's shape where it is assigned to a typed value. A JSON parser keeps the last of two equal keys in one object and raises no error.

## Decision

We will give every deck, the app's own and a learner's, one shape, the type `Deck` in `convex/model/deck.ts`: an id, a name, its dimensions, each with an id, a name and its categories, each with an id and a name, and its cards, each with an id, a name and answers mapping a dimension's id to one category id of that dimension.

We will read a card with no entry for a dimension as having no answer in it.

We will refer to every card, dimension, category and deck by its id, within a deck and from the board, and use a name only to show it and to apply the rules on names.

We will give each card, dimension, category and deck a learner makes an id made on the device by `crypto.randomUUID()` when it is made, and never change or reuse it.

We will keep the app's own deck in one JSON file in the source tree, imported by the app and bundled by Vite, with no id in it: its dimensions, each with a name and a list of category names, and its cards, each with a name and answers mapping each dimension's name to one category name of that dimension. We will check its shape at compile time by assigning the import to its TypeScript type.

We will check the app's own deck with a hand-written validator when the app starts, against the rules PDR 009 holds it to and no other, and show, for the first fault found, in place of the board, the vocabulary's sentence for that fault, naming the thing at fault by its name.

We will run the same validator as a test over the file, so that a deck that fails it fails the tests before it merges.

We will turn the app's own deck, once it passes, into a `Deck`, each thing's name serving as its id and the deck's id a fixed one.

## Alternatives considered

### Every thing keyed by its name, as ADR 004 decided

Rejected because a rename rewrites every answer and every place under it, and a category deleted and made again under its old name takes back the cards that lay in the old one.

### Convex's document ids

Rejected because a thing made offline has none until its change is kept, and a place keyed by its temporary id is lost when the id is replaced.

### Ids in the app's own deck's file

Rejected because the author keeps each id in step with its name by hand, and a duplicated id is a fault no rule names.

### The deck's types in src/

Rejected because the Convex functions would import them from outside `convex/`.

### A TypeScript module as the data file

Rejected because the author then writes TypeScript.

### A JSON file fetched at run time

Rejected because it adds a loading state and loses the compile-time shape check, for a file that is in the repository.

### A schema library for the validator

Rejected because its messages reach the vocabulary's sentences only through a mapping.

### Validation at build time only

Rejected because the error is shown in the app.

## Consequences

### Positive

- The next developer renames a card, a dimension, a category or a deck by changing one field, and no answer or place under it changes.
- A learner who deletes a category and makes one of the same name finds the new one empty.
- The next developer follows a thing the learner made offline by the same id before and after its change is kept.
- The next developer writes the board once for both kinds of deck, since both take one shape.
- The author writes each name of the app's own deck once, in one file, and learns from the test or the app which thing is at fault, in the words the learner reads.

### Negative

- The author who types a dimension's name twice in one card's answers keeps the last value and gets no error from the app.
- The author renames a dimension or a category of the app's own deck in every place its name appears.

### Neutral

- The next developer imports the deck's types into the app from `convex/model/`.
- The next developer matches things by name only in the validator and in the rules on names.
