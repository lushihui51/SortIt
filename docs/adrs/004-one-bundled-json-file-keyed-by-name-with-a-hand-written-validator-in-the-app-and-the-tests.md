# ADR 004: One bundled JSON file keyed by name, with a hand-written validator in the app and the tests

## Status

Active

## Context

PDR 005 names the rules a set must meet, in the names the learner sees: every item has exactly one answer in every dimension, drawn from that dimension's categories; the set holds at least one item and one dimension; every dimension holds at least two categories; and no two items, no two dimensions and no two categories of one dimension bear the same name. Every name is unique within its scope, so a name picks out one thing.

PDR 005 has the app show, for a set that breaks a rule, in place of the board, that the set cannot be shown and one sentence naming the first fault and the thing at fault by name. docs/vocabulary.md gives the words of that sentence.

PDR 006 ships one set and no editor for sets. The set is edited by hand in one data file in the repository, and the first set is written during the build and checked by the product owner.

The requirements sketch a shape in which each dimension and each item carries an id beside its name, and an item's answers are keyed by the dimension's id.

ADR 001 writes the app in TypeScript and builds it with Vite. Vite bundles a JSON file the code imports, and TypeScript checks a JSON import's shape where it is assigned to a typed value. A JSON parser keeps the last of two equal keys in one object and raises no error.

## Decision

We will keep the set in one JSON file in the source tree, imported by the app and bundled by Vite, and check its shape at compile time by assigning the import to the set's TypeScript type.

We will shape the set as dimensions, each with a name and a list of category names, and items, each with a name and answers mapping each dimension's name to one category name of that dimension.

We will give nothing in the set an id, and key every dimension, category and item by its name.

We will check the set with a hand-written validator when the app starts, against these rules and no other: at least one item and one dimension, at least two categories in every dimension, no two items, no two dimensions and no two categories of one dimension with one name, and for every item exactly one answer in every dimension that is one of that dimension's categories.

We will show, for the first fault the validator finds, in place of the board, the vocabulary's sentence for that fault, naming the thing at fault by its name.

We will run the same validator as a test over the shipped file, so that a set that fails it fails the tests before it merges.

## Alternatives considered

### A TypeScript module as the data file

Rejected because the hand-editor then writes TypeScript.

### A JSON file fetched at run time

Rejected because it adds a loading state and loses the compile-time shape check, for a file that is in the repository.

### A schema library

Rejected because its messages reach the vocabulary's text only through a mapping, and the shape is four fields.

### An id on each dimension, category and item, with answers keyed by id

Rejected because the id is a second spelling the author keeps in step with the name, a duplicated id is a fault the product rules do not name and the learner cannot see, and a rename is the only act it makes cheaper.

### Validation at build time only

Rejected because the error is shown in the app.

## Consequences

### Positive

- The author writes each thing's name once in one file, and learns from the test, or from the app, which thing is at fault, in the words the learner reads.
- The author cannot write two answers for one dimension, because the answers map one dimension to one category.
- The next developer writes no error message of their own, because every fault the validator finds is one the vocabulary gives a sentence for.
- The author who renames a category in its dimension and not in every item's answers is stopped by the answer fault until the rename is complete.

### Negative

- The author who types a dimension key twice in one item's answers keeps the last value and gets no error from the app; only a JSON editor's duplicate-key warning catches it.
- The author renames a dimension or a category in every place its name appears.
- The next developer who introduces ids later migrates the one data file.

### Neutral
