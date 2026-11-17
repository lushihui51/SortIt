import type { Card, Category, Deck, Dimension } from "../../convex/model/deck";

/** The question before a deck is deleted. */
export function deleteDeckQuestion(deck: Deck): string {
  const asked = `Delete the deck "${deck.name}"?`;
  const count = deck.cards.length;
  if (count === 0) return asked;
  const cards = count === 1 ? "1 card" : `${count} cards`;
  return `${asked} ${cards} and their answers will be lost.`;
}

/** The question before a card is deleted. */
export function deleteCardQuestion(card: Card): string {
  return `Delete the card "${card.name}"? Its answers will be lost.`;
}

/** The question before a category is deleted. `dimension` is the category's dimension, a dimension of `deck`. */
export function deleteCategoryQuestion(
  deck: Deck,
  dimension: Dimension,
  category: Category,
): string {
  const asked = `Delete the category "${category.name}"?`;
  const count = deck.cards.filter(
    (card) => card.answers[dimension.id] === category.id,
  ).length;
  if (count === 0) return asked;
  if (count === 1) return `${asked} 1 card's answer will be lost.`;
  return `${asked} ${count} cards' answers will be lost.`;
}

/** The question before a dimension is deleted. */
export function deleteDimensionQuestion(dimension: Dimension): string {
  const count = dimension.categories.length;
  const categories = count === 1 ? "1 category" : `${count} categories`;
  return `Delete the dimension "${dimension.name}"? ${categories} and their answers will be lost.`;
}
