# Vocabulary

This file gives the words for every concept the app shows, every act on it and every situation it speaks to, and the code's names for each, side by side.

| Area | Concept | User reads | Where | Code |
| --- | --- | --- | --- | --- |
| Title | The app's name | "Sort It" | The browser tab | the `<title>` of index.html |
| Board | Dimension, one way a deck can be sorted, picked by the learner | "Sort by"; the dimension's name as the deck gives it, as "Habitat" | The picker, as one button per dimension under "Sort by" | `Dimension` in convex/model/deck.ts; `dimension` of `BoardState` in src/board/board.ts; `DimensionPicker` in src/board/DimensionPicker.tsx |
| Board | Prompt shown where the zones will be, before a dimension is chosen | "Choose how to sort to begin" | Where the zones will be, before a dimension is chosen | the prompt in `Board` in src/board/Board.tsx |
| Board | Pool, where unplaced cards wait | "Unsorted" | The pool's label | `Place` of kind `pool` in src/board/board.ts; `Pool` in src/board/Pool.tsx |
| Board | Card, one thing the learner sorts in a deck | the card's name as the deck gives it, as "Penguin" | Each card | `Card` in convex/model/deck.ts; `Card` in src/board/Card.tsx |
| Board | Zone, one category of the chosen dimension, where cards are placed | the category's name as the deck gives it, as "Ocean" | Each zone's label | `Category` in convex/model/deck.ts; `Place` of kind `zone` in src/board/board.ts; `Zone` in src/board/Zone.tsx |
| Board | Check, a switch that shows whether each card in a zone is correct while it is on | "Check" | A switch beside Reset | the `toggleCheck` action of `BoardAction` and `checking` of `BoardState` in src/board/board.ts; the Check switch in `Board` in src/board/Board.tsx |
| Board | Reset, which returns every card to the pool | "Reset" | A button beside the picker | the `reset` action of `BoardAction` in src/board/board.ts; the Reset button in `Board` in src/board/Board.tsx |
| Verdict | Correct mark on a card, a colour and an icon | "Correct", spoken | On a correct card in a zone while Check is on, as a colour, an icon and hidden text | `Mark` `'correct'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | Incorrect mark on a card, a colour and an icon | "Incorrect", spoken | On an incorrect card in a zone while Check is on, as a colour, an icon and hidden text | `Mark` `'incorrect'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | No-answer mark on a card with no answer under the chosen dimension, a colour and an icon | "No answer", spoken | On a card with no answer under the chosen dimension, wherever it lies and whether Check is on or off, as a colour, an icon and hidden text | `Mark` `'noAnswer'` and `markOf` in src/board/board.ts; the mark in `Card` in src/board/Card.tsx |
| Verdict | Score, correct cards over the cards judged | "N of N correct" | Beside the buttons while Check is on and a card lies in a zone | `score` in src/board/board.ts; the score in `Board` in src/board/Board.tsx |
| Verdict | Retry, which returns only the incorrect cards to the pool | "Retry" | A button beside Check while Check is on and a card in a zone is incorrect | the `retry` action of `BoardAction` in src/board/board.ts; the Retry button in `Board` in src/board/Board.tsx |
| Deck | Error shown in place of the board when a card of the app's own deck lacks exactly one answer in a dimension | "This deck cannot be shown: "<Card>" needs exactly one answer for <dimension>." | Not shown yet | `DeckFault` of kind `answer` and `findFirstFault` in src/deck/findFirstFault.ts |
| Editing | ⓘ, which opens the panel of a card | "ⓘ" | The upper right corner of each card | the ⓘ button in `Card` in src/board/Card.tsx |
| Editing | Panel of a card | the name of what it opens as its heading, as "Orca"; "Close", spoken | A panel over the board | `Panel` in src/ui/Panel.tsx |
