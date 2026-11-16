import { expect, test } from "vitest";
import { deckAddress, deckIdOf } from "./deckAddress";

const id = "3f2b8c1e-9a4d-4e6f-8b21-0c5d7e9fa1b3";
const code = "3f2b8c1e9a4d4e6f8b210c5d7e9fa1b3";

test("deckAddress gives /decks/, the name with each run of other characters made one hyphen, a hyphen and the id without its hyphens", () => {
  expect(deckAddress({ id, name: "Biology revision" })).toBe(
    `/decks/Biology-revision-${code}`,
  );
  expect(deckAddress({ id, name: "Year 9: cells & tissues!" })).toBe(
    `/decks/Year-9-cells-tissues--${code}`,
  );
  expect(deckAddress({ id, name: "  a -- b  " })).toBe(`/decks/-a-b--${code}`);
});

test("deckAddress keeps letters and digits of any script and the letters' case", () => {
  expect(deckAddress({ id, name: "Ökologie Été" })).toBe(
    `/decks/Ökologie-Été-${code}`,
  );
  expect(deckAddress({ id, name: "生物 ٣ Δέλτα" })).toBe(
    `/decks/生物-٣-Δέλτα-${code}`,
  );
});

test("deckIdOf gives back the id of the deck an address was made from, whatever name stands before the code", () => {
  const segment = (name: string) =>
    deckAddress({ id, name }).slice("/decks/".length);
  expect(deckIdOf(segment("Biology revision"))).toBe(id);
  expect(deckIdOf(segment("生物 ٣ Δέλτα"))).toBe(id);
  expect(deckIdOf(`An-old-name-${code}`)).toBe(id);
  expect(deckIdOf(`${"0".repeat(32)}-${code}`)).toBe(id);
  expect(deckIdOf(code)).toBe(id);
});

test("deckIdOf gives null for a segment that ends in no code of 32 hex digits", () => {
  expect(deckIdOf("")).toBeNull();
  expect(deckIdOf("Biology-revision")).toBeNull();
  expect(deckIdOf(`Biology-${code.slice(1)}`)).toBeNull();
  expect(deckIdOf(`Biology-${code.toUpperCase()}`)).toBeNull();
  expect(deckIdOf(`Biology-${code.slice(0, 31)}g`)).toBeNull();
  expect(deckIdOf(`Biology-${id}`)).toBeNull();
  expect(deckIdOf(`Biology-${code}-`)).toBeNull();
});
