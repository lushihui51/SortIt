import { expect, test } from "vitest";
import { saveAnswersQuestion } from "./saveAnswersQuestion";

test('several cards read: Change the answers of N cards for the dimension "<Dimension>"?', () => {
  expect(saveAnswersQuestion(3, "Habitat")).toBe(
    'Change the answers of 3 cards for the dimension "Habitat"?',
  );
  expect(saveAnswersQuestion(2, "Diet")).toBe(
    'Change the answers of 2 cards for the dimension "Diet"?',
  );
});

test('one card reads: Change the answers of 1 card for the dimension "<Dimension>"?', () => {
  expect(saveAnswersQuestion(1, "Habitat")).toBe(
    'Change the answers of 1 card for the dimension "Habitat"?',
  );
});
