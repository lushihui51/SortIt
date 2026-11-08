# PDR 005: Rules a set must meet, with an error naming its first fault

## Status

Active

## Context

The set is written by hand in one data file in the repository. Whoever edits it gives each item its answer in each dimension, and a hand-edited file can hold a mistake: an item with no answer for a dimension, or an answer that is not one of the dimension's categories.

A hand-edited file can hold other mistakes too: a set with no item or no dimension, a dimension with one category or none, or two items, two dimensions or two categories of one dimension given the same name. One slip in the file can bring further faults with it.

PDR 002 shows every item as a card and every category of the chosen dimension as a zone, each by its name, and PDR 003 judges each card by whether the zone it lies in is the item's answer and counts the correct cards into a score. The verdict and the score rest on each card having one right answer. A dimension of one category gives a board with one zone and no choice to make, and two cards bearing one name are two cards the learner cannot tell apart.

PDR 001 keeps the board working for a set beyond the named sizes, so the size of a set is never a fault of it.

Some items could arguably fall under more than one category of a dimension. An animal might live both in the ocean and on land. Either the set allows two answers, or whoever writes the set decides one.

The error for a broken set is read in the app, by whoever opens it, and the fix is made in the file.

## Decision

We will require every item to have exactly one answer in every dimension, drawn from that dimension's categories.

We will require the set to hold at least one item and at least one dimension, every dimension to hold at least two categories, and no two items, no two dimensions and no two categories of one dimension to bear the same name.

We will show, for a set that breaks any of these rules, in place of the board, that the set cannot be shown, followed by one sentence naming the fault and the thing at fault by name; for an item lacking exactly one answer, that is the item and the dimension.

We will name the first fault found and no other.

## Alternatives considered

### Several correct categories for one item

Rejected because the verdict becomes "one of these" and the score loses its meaning.

### A missing answer that skips the item for that dimension

Rejected because the learner sees different piles under different dimensions and cannot tell why.

### Skipping bad items silently

Rejected because a broken set looks like a smaller set.

### One message for every fault

The app would show the same words whatever the fault. Rejected because whoever edits the set learns nothing about what to fix.

### Listing every fault at once

Rejected because one slip and the faults it brings with it show as a wall of lines.

### Showing the board wherever it still works

The app would show the board for a set whose fault lies in one dimension or in two names. Rejected because the learner meets a zone they cannot sort into or two cards they cannot tell apart, with no word on why.

## Consequences

### Positive

- The learner never meets a card with no right answer or two, a dimension with no choice to make, or two cards they cannot tell apart.
- A learner who opens a broken set reads one message of one shape whatever the fault, naming the fault and the thing at fault in the words of the set, so whoever edits the set knows what to fix.

### Negative

- A learner who opens a broken set gets no board at all, not even for the dimensions that are fine.
- A learner meets an item that could belong to two categories as having one, chosen by whoever wrote the set.
- A learner who opens a set with several faults reads only the first, and whoever edits the set finds the next only after fixing it.

### Neutral
