import type { Deck } from "../../convex/model/deck";

/** The question before a deck is deleted. */
export function deleteDeckQuestion(deck: Deck): string {
  const asked = `Delete the deck "${deck.name}"?`;
  const count = deck.cards.length;
  if (count === 0) return asked;
  const cards = count === 1 ? "1 card" : `${count} cards`;
  return `${asked} ${cards} and their answers will be lost.`;
}
