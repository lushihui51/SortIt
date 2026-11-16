import { expect, test } from "vitest";
import type { Card, Deck } from "../../convex/model/deck";
import { deleteDeckQuestion } from "./deleteQuestion";

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
