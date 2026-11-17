import { expect, test } from "vitest";
import { refusalWords } from "./refusalWords";

test('a deck name already used reads: You already have a deck called "<Deck>".', () => {
  expect(
    refusalWords({ refused: "nameTaken", kind: "deck", name: "History" }),
  ).toBe('You already have a deck called "History".');
});

test("an empty deck name reads: A deck needs a name.", () => {
  expect(refusalWords({ refused: "noName", kind: "deck" })).toBe(
    "A deck needs a name.",
  );
});

test('a card name already used reads: The deck "<Deck>" already has a card called "<Card>".', () => {
  expect(
    refusalWords(
      { refused: "nameTaken", kind: "card", name: "Orca" },
      "Animals",
    ),
  ).toBe('The deck "Animals" already has a card called "Orca".');
  expect(
    refusalWords({ refused: "nameTaken", kind: "card", name: "Orca" }),
  ).toBe('The deck "" already has a card called "Orca".');
});

test("an empty card name reads: A card needs a name.", () => {
  expect(refusalWords({ refused: "noName", kind: "card" }, "Animals")).toBe(
    "A card needs a name.",
  );
});

test('a dimension name already used reads: The deck "<Deck>" already has a dimension called "<Dimension>".', () => {
  expect(
    refusalWords(
      { refused: "nameTaken", kind: "dimension", name: "Habitat" },
      "Animals",
    ),
  ).toBe('The deck "Animals" already has a dimension called "Habitat".');
  expect(
    refusalWords({ refused: "nameTaken", kind: "dimension", name: "Habitat" }),
  ).toBe('The deck "" already has a dimension called "Habitat".');
});

test("an empty dimension name reads: A dimension needs a name.", () => {
  expect(
    refusalWords({ refused: "noName", kind: "dimension" }, "Animals"),
  ).toBe("A dimension needs a name.");
});

test('a category name already used reads: The dimension "<Dimension>" already has a category called "<Category>".', () => {
  expect(
    refusalWords(
      { refused: "nameTaken", kind: "category", name: "Ocean" },
      "Habitat",
    ),
  ).toBe('The dimension "Habitat" already has a category called "Ocean".');
  expect(
    refusalWords({ refused: "nameTaken", kind: "category", name: "Ocean" }),
  ).toBe('The dimension "" already has a category called "Ocean".');
});

test("an empty category name reads: A category needs a name.", () => {
  expect(refusalWords({ refused: "noName", kind: "category" }, "Habitat")).toBe(
    "A category needs a name.",
  );
});
