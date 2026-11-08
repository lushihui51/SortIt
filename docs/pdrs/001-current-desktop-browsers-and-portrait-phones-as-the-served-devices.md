# PDR 001: Current desktop browsers and portrait phones as the served devices

## Status

Active

## Context

The app is used in a browser: the learner opens one page, picks a dimension and places each card of the set in a zone. The page must work wherever the learner opens it, and the board must hold every card and every zone of the chosen dimension.

The requirements name the devices the app must serve: the current versions of Chrome, Safari and Firefox on a desktop, and a phone held in portrait. A desktop screen is wide enough to show a pool of cards and a row of zones side by side. A phone in portrait is a narrow column, and a board that fits a desktop screen does not fit a phone screen at once.

The requirements also name the size the board must hold on a desktop screen without scrolling getting in the learner's way: a dimension of up to about 30 items and 6 categories. The first set is hand-written and small, and stays within those sizes.

The set is edited by hand, so a later set may hold more items or more categories than the named sizes, and a learner may open the app on a phone, where no board of that size fits at once.

## Decision

We will serve the current desktop versions of Chrome, Safari and Firefox, and a phone held in portrait.

We will lay out the board so that a dimension of up to about 30 items and 6 categories fits a desktop screen, and the learner sorts it without scrolling getting in their way.

We will keep the board working for a set beyond those sizes, and on a phone, and let it scroll.

## Alternatives considered

### Refusing a set beyond the sizes

The app would show an error for a set with more than about 30 items or 6 categories in a dimension. Rejected because whoever writes a set of 31 items would meet an error where a crowded board would still work.

### Desktop only

The app would serve desktop browsers and nothing else. Rejected because a learner on a phone would be turned away.

## Consequences

### Positive

- A learner on a current desktop browser sees the whole board of a dimension within the sizes without scrolling.
- A learner on a phone can sort the set.
- No learner is refused for their device, and no set is refused for its size.

### Negative

- A learner on a phone, or with a set beyond the sizes, scrolls while sorting and may not see the pool and every zone at once.

### Neutral

- The learner is promised a board that fits without scrolling only on a desktop and only within the sizes.
