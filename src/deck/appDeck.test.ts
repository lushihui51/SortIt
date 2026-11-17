import { expect, test } from "vitest";
import { appDeckFile } from "./appDeck";
import { findFirstFault } from "./findFirstFault";

test("the app's own deck meets every rule it must meet", () => {
  expect(findFirstFault(appDeckFile)).toBeNull();
});
