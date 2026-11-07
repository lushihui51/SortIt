import { expect, test } from "vitest";
import { findFirstFault } from "./findFirstFault";
import { shippedSet } from "./shippedSet";

test("the shipped set meets every rule a set must meet", () => {
  expect(findFirstFault(shippedSet)).toBeNull();
});
