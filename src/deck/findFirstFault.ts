import type { AppDeckFile } from "./appDeckFile";

export type DeckFault =
  | { kind: "noCard" }
  | { kind: "noDimension" }
  | { kind: "tooFewCategories"; dimension: string }
  | { kind: "duplicateCard"; card: string }
  | { kind: "duplicateDimension"; dimension: string }
  | { kind: "duplicateCategory"; dimension: string; category: string }
  /** The card's answers hold no entry for the dimension, or one that is not a category of it. */
  | { kind: "answer"; card: string; dimension: string };

/**
 * Returns the first fault of the deck, or null when it has none. Faults are
 * looked for kind by kind in the order DeckFault lists them, and within a kind
 * in file order. A key in a card's answers that names no dimension is not a
 * fault.
 */
export function findFirstFault(deck: AppDeckFile): DeckFault | null {
  if (deck.cards.length === 0) return { kind: "noCard" };
  if (deck.dimensions.length === 0) return { kind: "noDimension" };

  for (const dimension of deck.dimensions) {
    if (dimension.categories.length < 2)
      return { kind: "tooFewCategories", dimension: dimension.name };
  }

  const card = firstRepeat(deck.cards.map((each) => each.name));
  if (card !== undefined) return { kind: "duplicateCard", card };

  const dimension = firstRepeat(deck.dimensions.map((each) => each.name));
  if (dimension !== undefined) return { kind: "duplicateDimension", dimension };

  for (const dimension of deck.dimensions) {
    const category = firstRepeat(dimension.categories);
    if (category !== undefined)
      return { kind: "duplicateCategory", dimension: dimension.name, category };
  }

  for (const card of deck.cards) {
    for (const dimension of deck.dimensions) {
      if (
        !Object.hasOwn(card.answers, dimension.name) ||
        !dimension.categories.includes(card.answers[dimension.name])
      )
        return { kind: "answer", card: card.name, dimension: dimension.name };
    }
  }

  return null;
}

function firstRepeat(names: string[]): string | undefined {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) return name;
    seen.add(name);
  }
  return undefined;
}
