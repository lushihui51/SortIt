import { expect, test } from "vitest";
import type { AppDeckFile } from "./appDeckFile";
import { appDeckId, toDeck } from "./toDeck";

function file(): AppDeckFile {
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

test("toDeck gives the deck the fixed id and an empty name, and each dimension, category and card its name as its id, in the file's order", () => {
  expect(appDeckId).toBe("app");
  expect(toDeck(file())).toEqual({
    id: "app",
    name: "",
    dimensions: [
      {
        id: "Habitat",
        name: "Habitat",
        categories: [
          { id: "Ocean", name: "Ocean" },
          { id: "Forest", name: "Forest" },
        ],
      },
      {
        id: "Diet",
        name: "Diet",
        categories: [
          { id: "Herbivore", name: "Herbivore" },
          { id: "Carnivore", name: "Carnivore" },
        ],
      },
    ],
    cards: [
      {
        id: "Shark",
        name: "Shark",
        answers: { Habitat: "Ocean", Diet: "Carnivore" },
      },
      {
        id: "Deer",
        name: "Deer",
        answers: { Habitat: "Forest", Diet: "Herbivore" },
      },
    ],
  });
});

test("toDeck keeps each answer that names a dimension and drops an answer that names none", () => {
  const given = file();
  // Size is no dimension of the file; Omnivore is no category of Diet, and
  // an answer's value is kept unchecked.
  given.cards[0].answers = { Size: "Large", Diet: "Omnivore" };
  const [shark, deer] = toDeck(given).cards;
  expect(shark.answers).toEqual({ Diet: "Omnivore" });
  expect(deer.answers).toEqual({ Habitat: "Forest", Diet: "Herbivore" });
});

test("toDeck leaves the file it is given unchanged", () => {
  const given = file();
  given.cards[0].answers.Size = "Large";
  const before = structuredClone(given);
  toDeck(given);
  expect(given).toEqual(before);
});
