# Vocabulary

This file gives the words for every concept the app shows, every act on it and every situation it speaks to, and the code's names for each, side by side.

| Area | Concept | User reads | Where | Code |
| --- | --- | --- | --- | --- |
| Title | The app's name | "Sort It" | The browser tab | the `<title>` of index.html |
| Board | Dimension, the way the set is sorted, picked by the learner | "Sort by"; the dimension's name as the set gives it, as "Habitat" | The picker, as one button per dimension under "Sort by" | `Dimension` in src/set/itemSet.ts; `dimension` of `BoardState` in src/board/board.ts; `DimensionPicker` in src/board/DimensionPicker.tsx |
| Board | Prompt shown where the zones will be, before a dimension is chosen | "Choose how to sort to begin" | Where the zones will be, before a dimension is chosen | the prompt in `Board` in src/board/Board.tsx |
| Board | Pool, where unplaced cards wait | "Unsorted" | The pool's label | `Place` of kind `pool` in src/board/board.ts; `Pool` in src/board/Pool.tsx |
| Board | Card, one item of the set | the item's name as the set gives it, as "Penguin" | Each card | `Item` in src/set/itemSet.ts; `Card` in src/board/Card.tsx |
| Board | Zone, one category of the chosen dimension, where cards are placed | the category's name as the set gives it, as "Ocean" | Each zone's label | one of `Dimension.categories` in src/set/itemSet.ts; `Place` of kind `zone` in src/board/board.ts; `Zone` in src/board/Zone.tsx |
| Board | Selected card, picked by tap, click or keyboard and waiting for a zone | "Selected", spoken | Hidden text on the selected card, read by assistive technology | `selected` of `BoardState` in src/board/board.ts |
| Board | Check, which judges every placement at once | "Check" | Not shown yet | the `check` action of `BoardAction` in src/board/board.ts |
| Board | Hint while Check is disabled because the pool is not empty | "Place every card to check" | Not shown yet | — |
| Board | Reset, which returns every card to the pool | "Reset" | A button beside the picker | the `reset` action of `BoardAction` in src/board/board.ts; the Reset button in `Board` in src/board/Board.tsx |
| Verdict | Correct mark on a card, a colour and an icon | "Correct", spoken | Not shown yet | `Mark` `'correct'` in src/board/board.ts |
| Verdict | Incorrect mark on a card, a colour and an icon | "Incorrect", spoken | Not shown yet | `Mark` `'incorrect'` in src/board/board.ts |
| Verdict | Score, correct cards over all cards | "N of N correct" | Not shown yet | `score` in src/board/board.ts |
| Verdict | Retry, which returns only the incorrect cards to the pool | "Retry" | Not shown yet | the `retry` action of `BoardAction` in src/board/board.ts |
| Set | Error shown in place of the board when an item lacks exactly one answer in a dimension | "This set cannot be shown: "<Item>" needs exactly one answer for <dimension>." | Not shown yet | — |
