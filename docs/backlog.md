# Backlog

Canvas: https://claude.ai/artifact/6dphuHA8nGiktfiES8z7q4

- B6 What a deck must satisfy and what the learner sees when it does not: every card has exactly one answer in every dimension, drawn from that dimension's categories, and a deck that breaks this shows a clear error in place of the board.
  - Reason: the requirements assume one category per card per dimension and ask whether more than one is allowed; the error is what the learner sees instead of a broken quiz.
  - Owner: /product-decide
- B16 How does the learner tell at once whether a thing on a screen is a deck, a dimension, a category or a card?
  - Reason: decks, dimensions, categories and cards each carry an "ⓘ" and a name, and the learner may not tell at a glance which kind of thing they are about to change or delete.
  - Owner: /product-decide
- B17 What does assistive technology speak for the ⓘ on a card, a dimension, a zone and a deck?
  - Reason: every ⓘ shows "ⓘ" alone, so assistive technology speaks the same for each, and a learner who uses it cannot tell which card, dimension, zone or deck an ⓘ opens.
  - Owner: /product-decide
- B18 What does the learner meet when the deck they are on is deleted from another device, and what becomes of their changes to it still waiting to be kept?
  - Reason: one deck is changed from any device, and a deck can be deleted. A waiting change that no longer fits the deck as kept is not kept and is named in a line, but a learner on the board of a deck deleted meanwhile has no screen decided for them.
  - Owner: /product-decide
- B19 What does the learner read, in place of the board, for each fault of the app's own deck other than a card lacking exactly one answer: no card, no dimension, a dimension of fewer than two categories, two cards of one name, two dimensions of one name, and two categories of one name in a dimension?
  - Reason: PDR 009 shows one sentence naming the fault and the thing at fault, and the vocabulary gives that sentence for one fault of seven.
  - Owner: /product-decide
- B20 What name does the learner's copy of the app's own deck bear in their list of decks?
  - Reason: PDR 012 starts every learner's list with a copy of the app's own deck and has the learner name every deck they make, and no item names the copy.
  - Owner: /product-decide
- B21 Which act commits a new name the learner types in the panel of a deck, a card, a dimension or a category, and does the panel stay open once the name is kept?
  - Reason: PDR 011 has the learner change a thing's name in its panel, and no item says which act commits the typed name or what the panel shows afterwards.
  - Owner: /product-decide
- B22 What does the learner read or hear on the cross that closes the sign-in form?
  - Reason: drawing 1 shows a cross at the upper right corner of the sign-in form, and no item gives its word.
  - Owner: /product-decide
  - Drawings: 1
- B23 Which parts of the app may call Convex: the screen of a learner's deck alone, or also the guard, the screen of the app's own deck, the list of decks and the hook that sends every act?
  - Reason: ADR 016 has only the screen of a learner's deck call Convex, while ADR 017 has the guard `SignedInOnly` read Convex's `useConvexAuth()`, and the list of decks reads the learner's decks and the hook sends every act through Convex.
  - Owner: /code-decide
- B24 Does the learner read why a name is refused at each letter they type, or only once they press Enter?
  - Reason: PDR 009 holds a learner's names to the rules as the learner types, and ADR 011 has a refused name read as they type. PDR 011 makes a thing only when the learner types its name into a field and presses Enter, and no item says whether a name is refused before Enter.
  - Owner: /product-decide
