# PDR 011: Making by a field where it goes, changing by its panel, and deleting after a question

## Status

Active

## Context

A learner builds decks of their own in the app: their cards, their dimensions and each dimension's categories. The app's own deck is written in the repository, and changes only there.

The learner sorts on the board, which shows the dimension picker, the pool and one zone per category of the chosen dimension, and every card carries an ⓘ that opens it in a panel over the board (PDR 008).

A learner sets the answers of a deck of their own by sorting its board and saving it (PDR 010), so the deck's cards, dimensions and categories are needed where the learner sorts.

A learner building a deck adds many cards in a row. A new dimension starts with no category and no answers.

Choosing another dimension clears the board (PDR 004), so anything reached only by choosing its dimension first costs the learner their board.

A learner keeps several decks and chooses one from a list of their decks by name.

A deletion takes answers with it: a card takes its answers in every dimension, a category takes the answers of every card that had it, a dimension takes its categories and all their answers, and a deck takes every card, dimension and answer in it. Lost answers come back only by sorting and saving them again, unlike the placements Reset clears, which the learner makes again in moments.

A learner deletes far less often than they sort or build.

## Decision

We will let a learner make a card, a dimension, a category or a deck by typing its name into a field that ends where it goes and pressing Enter: a card joins the pool with no answer in any dimension, a dimension joins the dimension picker and is chosen, a category joins the zones of the chosen dimension, and a deck joins the list of decks and its board opens.

We will put an ⓘ on every dimension and every zone of a learner's own deck and on every deck in the list of decks, and have it, like the ⓘ of every card of a learner's own deck, open a panel in which the learner changes that thing's name or deletes it.

We will offer these fields and these changes on a learner's own decks and the list of decks, and nowhere else.

We will ask before every deletion, naming the thing deleted and how much is lost with it, and delete only if the learner confirms.

We will have deleting a category remove its zone and return its cards to the pool with no answer under that dimension, and deleting a dimension remove it from the dimension picker and, if it was chosen, return the board to its state before a dimension is chosen, with every card in the pool.

## Alternatives considered

### A separate editing screen

Rejected because the learner goes back and forth between it and the board to add a card and set its answer, or to build a dimension and sort into it.

### A dialog per new card

Rejected because ten cards take thirty presses.

### One ⓘ for the chosen dimension and all its categories

Rejected because changing another dimension first means choosing it, which clears the board.

### A button with a dialog for a new deck, and a menu on each deck

Rejected because the learner would meet two patterns for the same acts.

### Deleting at once, with a brief Undo

Rejected because a learner who misses the message loses the thing and its answers for good.

### Deleting at once, with no question

Rejected because one mis-press loses answers that, unlike the placements Reset clears, cannot be placed again.

### Refusing to delete a category until its cards are moved out

Rejected because removing one zone would take many moves.

## Consequences

### Positive

- The learner builds a deck, and each dimension of it, on the board where they sort it.
- The learner makes, renames and deletes anything in the app in one way.
- The learner reads before each deletion what goes and how much is lost with it, and loses nothing to a slip of the finger.
- The learner deletes a category or a dimension, and every answer it carries, with one confirmation.

### Negative

- The learner answers a question before every deletion, even one that loses no answer.
- A learner who adds a dimension while sorting another loses their board, since the new dimension is chosen at once.
- The learner sorts their own decks on a board that carries more fields and more ⓘ than the board of the app's own deck.

### Neutral

- A learner who deletes a category finds its cards back in the pool with no answer under that dimension.
