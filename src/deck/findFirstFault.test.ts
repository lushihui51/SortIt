import { expect, test } from "vitest";
import type { AppDeckFile } from "./appDeckFile";
import { findFirstFault } from "./findFirstFault";

function validDeck(): AppDeckFile {
  return {
    dimensions: [
      { name: "Habitat", categories: ["Ocean", "Forest"] },
      { name: "Diet", categories: ["Herbivore", "Carnivore"] },
    ],
    cards: [
      { name: "Shark", answers: { Habitat: "Ocean", Diet: "Carnivore" } },
      { name: "Deer", answers: { Habitat: "Forest", Diet: "Herbivore" } },
    ],
  };
}

test("a deck meeting every rule has no fault", () => {
  const deck = validDeck();
  deck.cards[0].answers.Size = "Large";
  const before = structuredClone(deck);
  expect(findFirstFault(deck)).toBeNull();
  expect(deck).toEqual(before);
});

test("the deck must hold at least one card", () => {
  const deck = { ...validDeck(), cards: [] };
  expect(findFirstFault(deck)).toEqual({ kind: "noCard" });
});

test("the deck must hold at least one dimension", () => {
  const deck = { ...validDeck(), dimensions: [] };
  expect(findFirstFault(deck)).toEqual({ kind: "noDimension" });
});

test("every dimension must hold at least two categories", () => {
  const deck = validDeck();
  deck.dimensions[1].categories = ["Herbivore"];
  deck.cards[0].answers.Diet = "Herbivore";
  expect(findFirstFault(deck)).toEqual({
    kind: "tooFewCategories",
    dimension: "Diet",
  });
});

test("no two cards may bear the same name", () => {
  const deck = validDeck();
  deck.cards[1].name = "Shark";
  expect(findFirstFault(deck)).toEqual({
    kind: "duplicateCard",
    card: "Shark",
  });
});

test("no two dimensions may bear the same name", () => {
  const deck = validDeck();
  deck.dimensions[1] = { name: "Habitat", categories: ["Ocean", "Forest"] };
  expect(findFirstFault(deck)).toEqual({
    kind: "duplicateDimension",
    dimension: "Habitat",
  });
});

test("no two categories of one dimension may bear the same name", () => {
  const deck = validDeck();
  deck.dimensions[0].categories.push("Ocean");
  expect(findFirstFault(deck)).toEqual({
    kind: "duplicateCategory",
    dimension: "Habitat",
    category: "Ocean",
  });
});

test("every card must have exactly one answer in every dimension, drawn from that dimension's categories", () => {
  const deck = validDeck();
  deck.cards[1].answers.Diet = "Omnivore";
  expect(findFirstFault(deck)).toEqual({
    kind: "answer",
    card: "Deer",
    dimension: "Diet",
  });
  delete deck.cards[1].answers.Diet;
  expect(findFirstFault(deck)).toEqual({
    kind: "answer",
    card: "Deer",
    dimension: "Diet",
  });
});

test("only the first fault found is named", () => {
  const deck = validDeck();
  deck.cards[1].name = "Shark";
  delete deck.cards[1].answers.Diet;
  expect(findFirstFault(deck)).toEqual({
    kind: "duplicateCard",
    card: "Shark",
  });
});
