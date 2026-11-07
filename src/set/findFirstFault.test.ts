import { expect, test } from "vitest";
import { findFirstFault } from "./findFirstFault";
import type { ItemSet } from "./itemSet";

function validSet(): ItemSet {
  return {
    dimensions: [
      { name: "Habitat", categories: ["Ocean", "Forest"] },
      { name: "Diet", categories: ["Herbivore", "Carnivore"] },
    ],
    items: [
      { name: "Shark", answers: { Habitat: "Ocean", Diet: "Carnivore" } },
      { name: "Deer", answers: { Habitat: "Forest", Diet: "Herbivore" } },
    ],
  };
}

test("a set meeting every rule has no fault", () => {
  const set = validSet();
  set.items[0].answers.Size = "Large";
  const before = structuredClone(set);
  expect(findFirstFault(set)).toBeNull();
  expect(set).toEqual(before);
});

test("the set must hold at least one item", () => {
  const set = { ...validSet(), items: [] };
  expect(findFirstFault(set)).toEqual({ kind: "noItem" });
});

test("the set must hold at least one dimension", () => {
  const set = { ...validSet(), dimensions: [] };
  expect(findFirstFault(set)).toEqual({ kind: "noDimension" });
});

test("every dimension must hold at least two categories", () => {
  const set = validSet();
  set.dimensions[1].categories = ["Herbivore"];
  set.items[0].answers.Diet = "Herbivore";
  expect(findFirstFault(set)).toEqual({
    kind: "tooFewCategories",
    dimension: "Diet",
  });
});

test("no two items may bear the same name", () => {
  const set = validSet();
  set.items[1].name = "Shark";
  expect(findFirstFault(set)).toEqual({ kind: "duplicateItem", item: "Shark" });
});

test("no two dimensions may bear the same name", () => {
  const set = validSet();
  set.dimensions[1] = { name: "Habitat", categories: ["Ocean", "Forest"] };
  expect(findFirstFault(set)).toEqual({
    kind: "duplicateDimension",
    dimension: "Habitat",
  });
});

test("no two categories of one dimension may bear the same name", () => {
  const set = validSet();
  set.dimensions[0].categories.push("Ocean");
  expect(findFirstFault(set)).toEqual({
    kind: "duplicateCategory",
    dimension: "Habitat",
    category: "Ocean",
  });
});

test("every item must have exactly one answer in every dimension, drawn from that dimension's categories", () => {
  const set = validSet();
  set.items[1].answers.Diet = "Omnivore";
  expect(findFirstFault(set)).toEqual({
    kind: "answer",
    item: "Deer",
    dimension: "Diet",
  });
  delete set.items[1].answers.Diet;
  expect(findFirstFault(set)).toEqual({
    kind: "answer",
    item: "Deer",
    dimension: "Diet",
  });
});

test("only the first fault found is named", () => {
  const set = validSet();
  set.items[1].name = "Shark";
  delete set.items[1].answers.Diet;
  expect(findFirstFault(set)).toEqual({ kind: "duplicateItem", item: "Shark" });
});
