# ADR 012: Late changes refused as the mutation's value, Save answers kept in part, and one hook naming what was not kept

## Status

Active

## Context

PDR 014 leaves out a change kept late that no longer fits the deck as kept, because a name it gives is now taken where it is held, or the card, the category or the dimension it changes is now deleted. It returns the screen to the deck as kept, shows a line naming what was not kept and why, and keeps every other waiting change that still fits. It keeps no change adjusted to fit.

PDR 014 keeps, of a Save answers kept late, the answer of each card the deck still holds in a category the deck still holds, and leaves out the rest as a change that no longer fits.

The line for a change not kept names the thing by its kind and by its name before the change. A Save answers kept in part gives one line for each category it leaves out and one for each card it leaves out. A later change to a thing whose making was not kept gives no line of its own, and the line for the making names the later changes.

ADR 011 writes each act once, as a pure function in `convex/model/deckActs.ts` that returns the changed deck or a refusal, and applies it on the device before sending, again as the mutation's optimistic update, and in the mutation on the deck as kept.

ADR 009 loads every deck through one helper that refuses unless the learner owns it.

ADR 007 gives every card, category and dimension an id that is never reused, so a thing deleted and made again bears a new id.

PDR 010 sets, in one press of Save answers, the answer of every card lying in a zone under the chosen dimension, and PDR 001 names a deck of about 30 cards.

A mutation's return value reaches the call that sent it. Convex drops a mutation's optimistic update once the server's results after it arrive, runs one client's mutations in the order they were sent, and offers no way to withdraw a mutation already queued.

A `ConvexError` thrown by a mutation carries data to the caller, by the same path as every other failure.

## Decision

We will have each act in `convex/model/deckActs.ts` refuse, in place of a changed deck, when a name it gives is taken where it is held, or when a card, a category or a dimension it changes is not in the deck, with a refusal carrying the kind and the name or id at fault.

We will have Save answers, the act `saveAnswers`, take a dimension's id and, for each card in a zone, the card's id and its zone's category id; refuse whole only when the dimension is not in the deck; and otherwise set each answer whose card the deck holds and whose category the dimension holds, and return, beside the changed deck, the ids of the cards and of the categories it left out.

We will have each mutation write nothing on a refusal and return the refusal, or the ids Save answers left out, as its value, and throw only when the owner helper refuses or Convex refuses the write.

We will send every act on a deck through one hook, which keeps the names the act touches as the deck held them when it was sent, and the ids of the things the act makes and of the things it changes, and gives the line PDR 014 shows for each refusal and each id left out that the server returns.

We will have the hook keep a set of things whose making was refused: a making refused puts the thing it would make in the set; a refusal or an id left out whose fault is a thing in the set gives no line, and puts the things its act would make in the set; and the line for a making refused names the later changes once the hook has sent an act that changes that thing.

We will have the hook give, for a Save answers kept in part, one line for each category left out, covering every answer into it, and one line for each card left out whose category the dimension still holds.

## Alternatives considered

### The refusal thrown as a `ConvexError`

Rejected because an expected outcome then travels with every failure, and the hook tells them apart by the error's data.

### The app finding what was left out by comparing the kept deck with its own

Rejected because it cannot tell a change left out from one another device undid, nor say why.

### The act fitting the change to the kept deck

Rejected because PDR 014 keeps no change adjusted to fit.

### Save answers refused whole, like every other act

Rejected because PDR 014 keeps the answers that still fit.

### One mutation per card for Save answers

Rejected because one press becomes up to 30 mutations, and a deleted category is reported by each of its cards.

### The device dropping deleted cards before sending Save answers

Rejected because the deck the device holds is not the deck as kept when the act arrives.

### One line for each refusal

Rejected because every later change to a thing never made reads "It was deleted on another device.", which is false.

### Withdrawing the waiting acts on a thing once its making is refused

Rejected because Convex's client offers no way to withdraw a queued mutation.

## Consequences

### Positive

- A learner whose late change is left out reads which change it was and why, with each thing named as it was when they made the change.
- The next developer adds an act by writing its refusals in `convex/model/deckActs.ts` and sending it through the hook.
- The next developer reads what a Save answers left out from its mutation's value, and a Save answers whose every answer is left out writes nothing.

### Negative

- An act sent past the hook is left out with no line, and nothing fails.
- An act that declares too few of the ids it makes and changes gives a false line saying a thing was deleted on another device, and nothing fails.
- A learner whose deck is deleted on another device while changes to it wait, or whose change Convex itself refuses, loses those changes with no line naming them.

### Neutral

- The next developer declares, for each act, the ids it makes and the ids it changes.
- The hook's set of things not made lasts until a reload.
