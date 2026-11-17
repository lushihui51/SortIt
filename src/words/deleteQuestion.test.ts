import { expect, test } from "vitest";
import type { Card, Category, Deck, Dimension } from "../../convex/model/deck";
import {
  deleteCardQuestion,
  deleteCategoryQuestion,
  deleteDeckQuestion,
  deleteDimensionQuestion,
} from "./deleteQuestion";

function deckOf(name: string, count: number): Deck {
  const cards: Card[] = Array.from({ length: count }, (_, index) => ({
    id: `card-${index}`,
    name: `Card ${index}`,
    answers: {},
  }));
  return { id: "deck-1", name, dimensions: [], cards };
}

test('a deck of several cards reads: Delete the deck "<Deck>"? N cards and their answers will be lost.', () => {
  expect(deleteDeckQuestion(deckOf("Animals", 12))).toBe(
    'Delete the deck "Animals"? 12 cards and their answers will be lost.',
  );
  expect(deleteDeckQuestion(deckOf("Animals", 2))).toBe(
    'Delete the deck "Animals"? 2 cards and their answers will be lost.',
  );
});

test('a deck of one card reads: Delete the deck "<Deck>"? 1 card and their answers will be lost.', () => {
  expect(deleteDeckQuestion(deckOf("History", 1))).toBe(
    'Delete the deck "History"? 1 card and their answers will be lost.',
  );
});

test('a deck with no card reads: Delete the deck "<Deck>"?', () => {
  expect(deleteDeckQuestion(deckOf("Biology revision", 0))).toBe(
    'Delete the deck "Biology revision"?',
  );
});

const water: Category = { id: "cat-water", name: "Water" };
const land: Category = { id: "cat-land", name: "Land" };
const habitat: Dimension = {
  id: "dim-habitat",
  name: "Habitat",
  categories: [water, land],
};
const diet: Dimension = {
  id: "dim-diet",
  name: "Diet",
  categories: [{ id: "cat-meat", name: "Meat" }],
};

/** A deck of one card for each entry of `habitats`, which is that card's answer under Habitat, or null for no answer. */
function deckAnswering(habitats: (string | null)[]): Deck {
  const cards: Card[] = habitats.map((category, index) => ({
    id: `card-${index}`,
    name: `Card ${index}`,
    // Every card also holds Water's id under Diet, so a question that counted answers under another dimension would read a wrong count.
    answers:
      category === null
        ? { [diet.id]: water.id }
        : { [habitat.id]: category, [diet.id]: water.id },
  }));
  return { id: "deck-1", name: "Animals", dimensions: [habitat, diet], cards };
}

test('a card reads: Delete the card "<Card>"? Its answers will be lost.', () => {
  const card: Card = { id: "card-1", name: "Orca", answers: {} };
  expect(deleteCardQuestion(card)).toBe(
    'Delete the card "Orca"? Its answers will be lost.',
  );
});

test(`a category that several cards have reads: Delete the category "<Category>"? N cards' answers will be lost.`, () => {
  const deck = deckAnswering([water.id, land.id, water.id, null, water.id]);
  expect(deleteCategoryQuestion(deck, habitat, water)).toBe(
    `Delete the category "Water"? 3 cards' answers will be lost.`,
  );
  const two = deckAnswering([land.id, land.id, water.id]);
  expect(deleteCategoryQuestion(two, habitat, land)).toBe(
    `Delete the category "Land"? 2 cards' answers will be lost.`,
  );
});

test(`a category that one card has reads: Delete the category "<Category>"? 1 card's answer will be lost.`, () => {
  const deck = deckAnswering([land.id, water.id, null]);
  expect(deleteCategoryQuestion(deck, habitat, water)).toBe(
    `Delete the category "Water"? 1 card's answer will be lost.`,
  );
});

test('a category that no card has reads: Delete the category "<Category>"?', () => {
  expect(
    deleteCategoryQuestion(deckAnswering([land.id, null]), habitat, water),
  ).toBe('Delete the category "Water"?');
  expect(deleteCategoryQuestion(deckAnswering([]), habitat, water)).toBe(
    'Delete the category "Water"?',
  );
});

test('a dimension of several categories or of none reads: Delete the dimension "<Dimension>"? N categories and their answers will be lost.', () => {
  expect(deleteDimensionQuestion(habitat)).toBe(
    'Delete the dimension "Habitat"? 2 categories and their answers will be lost.',
  );
  const empty: Dimension = { id: "dim-size", name: "Size", categories: [] };
  expect(deleteDimensionQuestion(empty)).toBe(
    'Delete the dimension "Size"? 0 categories and their answers will be lost.',
  );
});

test('a dimension of one category reads: Delete the dimension "<Dimension>"? 1 category and their answers will be lost.', () => {
  expect(deleteDimensionQuestion(diet)).toBe(
    'Delete the dimension "Diet"? 1 category and their answers will be lost.',
  );
});
