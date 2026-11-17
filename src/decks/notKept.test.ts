import { expect, test } from "vitest";
import type { Kind } from "../../convex/model/deckActs";
import { linesFor, type SentAct, type Thing } from "./notKept";

const deck: Thing = { kind: "deck", id: "deck-1", name: "Animals" };
const habitat: Thing = { kind: "dimension", id: "dim-1", name: "Habitat" };
const ocean: Thing = { kind: "category", id: "cat-1", name: "Ocean" };
const forest: Thing = { kind: "category", id: "cat-2", name: "Forest" };
const desert: Thing = { kind: "category", id: "cat-3", name: "Desert" };
const orca: Thing = { kind: "card", id: "card-1", name: "Orca" };
const owl: Thing = { kind: "card", id: "card-2", name: "Owl" };
const camel: Thing = { kind: "card", id: "card-3", name: "Camel" };
const bear: Thing = { kind: "card", id: "card-4", name: "Bear" };

const none: ReadonlySet<string> = new Set();

function making(subject: Thing): SentAct {
  if (subject.kind === "deck")
    return { making: true, subject, others: [], held: null };
  if (subject.kind === "category")
    return {
      making: true,
      subject,
      others: [deck, habitat],
      held: habitat.name,
    };
  return { making: true, subject, others: [deck], held: deck.name };
}

function deleting(subject: Thing): SentAct {
  if (subject.kind === "category")
    return {
      making: false,
      subject,
      others: [deck, habitat],
      held: habitat.name,
    };
  return { making: false, subject, others: [deck], held: deck.name };
}

function saving(answers: { card: Thing; category: Thing }[]): SentAct {
  return {
    making: false,
    subject: habitat,
    others: [deck],
    held: deck.name,
    answers,
  };
}

function taken(kind: Kind, name: string) {
  return { refused: "nameTaken" as const, kind, name };
}

function gone(thing: Thing) {
  if (thing.kind === "deck") throw new Error("No refusal names a deck gone.");
  return { refused: "gone" as const, kind: thing.kind, id: thing.id };
}

test('a new card whose name was taken reads: Your new card "<Card>" was not kept. The deck "<Deck>" already has a card called "<Card>".', () => {
  expect(linesFor(making(orca), taken("card", "Orca"), none, false)).toEqual({
    lines: [
      'Your new card "Orca" was not kept. The deck "Animals" already has a card called "Orca".',
    ],
    notMade: ["card-1"],
  });
});

test("a new dimension, a new category and a new deck whose name was taken each read their kind and the refusal of their name", () => {
  expect(
    linesFor(making(habitat), taken("dimension", "Habitat"), none, false).lines,
  ).toEqual([
    'Your new dimension "Habitat" was not kept. The deck "Animals" already has a dimension called "Habitat".',
  ]);
  expect(
    linesFor(making(ocean), taken("category", "Ocean"), none, false).lines,
  ).toEqual([
    'Your new category "Ocean" was not kept. The dimension "Habitat" already has a category called "Ocean".',
  ]);
  expect(
    linesFor(making(deck), taken("deck", "Animals"), none, false).lines,
  ).toEqual([
    'Your new deck "Animals" was not kept. You already have a deck called "Animals".',
  ]);
});

test('a making with later changes reads: Your new <kind> "<Name>" and your later changes to it were not kept.', () => {
  expect(
    linesFor(making(orca), taken("card", "Orca"), none, true).lines,
  ).toEqual([
    'Your new card "Orca" and your later changes to it were not kept. The deck "Animals" already has a card called "Orca".',
  ]);
  expect(linesFor(making(ocean), gone(habitat), none, true).lines).toEqual([
    'Your new category "Ocean" and your later changes to it were not kept. The dimension "Habitat" was deleted on another device.',
  ]);
});

test('a new category whose dimension was deleted reads: Your new category "<Category>" was not kept. The dimension "<Dimension>" was deleted on another device.', () => {
  expect(linesFor(making(ocean), gone(habitat), none, false)).toEqual({
    lines: [
      'Your new category "Ocean" was not kept. The dimension "Habitat" was deleted on another device.',
    ],
    notMade: ["cat-1"],
  });
});

test('deleting a card, a dimension or a category already deleted reads: Your change to the <kind> "<Name>" was not kept. It was deleted on another device.', () => {
  expect(linesFor(deleting(orca), gone(orca), none, false)).toEqual({
    lines: [
      'Your change to the card "Orca" was not kept. It was deleted on another device.',
    ],
    notMade: [],
  });
  expect(linesFor(deleting(habitat), gone(habitat), none, false)).toEqual({
    lines: [
      'Your change to the dimension "Habitat" was not kept. It was deleted on another device.',
    ],
    notMade: [],
  });
  expect(linesFor(deleting(ocean), gone(ocean), none, false)).toEqual({
    lines: [
      'Your change to the category "Ocean" was not kept. It was deleted on another device.',
    ],
    notMade: [],
  });
});

test("deleting a category whose dimension was deleted names the dimension as deleted", () => {
  expect(linesFor(deleting(ocean), gone(habitat), none, false)).toEqual({
    lines: [
      'Your change to the category "Ocean" was not kept. The dimension "Habitat" was deleted on another device.',
    ],
    notMade: [],
  });
});

test('a Save answers whose dimension was deleted reads: Your change to the dimension "<Dimension>" was not kept. It was deleted on another device.', () => {
  expect(
    linesFor(
      saving([{ card: orca, category: ocean }]),
      gone(habitat),
      none,
      false,
    ),
  ).toEqual({
    lines: [
      'Your change to the dimension "Habitat" was not kept. It was deleted on another device.',
    ],
    notMade: [],
  });
});

test("a Save answers kept in part gives one line for each category left out, then one for each card left out whose category was kept", () => {
  const sent = saving([
    // Its card and its category both left out: the category's line alone.
    { card: orca, category: ocean },
    // Its card left out, its category kept.
    { card: bear, category: forest },
    // Its category left out, its card kept.
    { card: owl, category: desert },
    // Its first pair names a category left out, its last a category kept:
    // the last stands, so the card gets its own line.
    { card: camel, category: ocean },
    { card: camel, category: forest },
  ]);
  expect(
    linesFor(
      sent,
      { cards: ["card-1", "card-4", "card-3"], categories: ["cat-3", "cat-1"] },
      none,
      false,
    ),
  ).toEqual({
    lines: [
      'Your answers in the category "Desert" were not kept. It was deleted on another device.',
      'Your answers in the category "Ocean" were not kept. It was deleted on another device.',
      'Your answer for the card "Bear" was not kept. It was deleted on another device.',
      'Your answer for the card "Camel" was not kept. It was deleted on another device.',
    ],
    notMade: [],
  });
});

test("a refusal or an id left out whose fault is a thing never made gives no line", () => {
  const neverMade = new Set(["dim-1", "cat-1", "card-1"]);
  expect(
    linesFor(making(forest), gone(habitat), neverMade, false).lines,
  ).toEqual([]);
  expect(linesFor(deleting(ocean), gone(ocean), neverMade, false)).toEqual({
    lines: [],
    notMade: [],
  });
  expect(linesFor(deleting(ocean), gone(habitat), neverMade, false)).toEqual({
    lines: [],
    notMade: [],
  });
  expect(
    linesFor(
      saving([
        { card: orca, category: forest },
        { card: owl, category: ocean },
      ]),
      { cards: ["card-1", "card-2"], categories: ["cat-1"] },
      neverMade,
      false,
    ),
  ).toEqual({ lines: [], notMade: [] });
});

test("a making refused, with a line or without, adds its subject to the things never made", () => {
  expect(
    linesFor(making(orca), taken("card", "Orca"), none, false).notMade,
  ).toEqual(["card-1"]);
  expect(linesFor(making(ocean), gone(habitat), none, false).notMade).toEqual([
    "cat-1",
  ]);
  expect(
    linesFor(making(ocean), gone(habitat), new Set(["dim-1"]), false),
  ).toEqual({ lines: [], notMade: ["cat-1"] });
});

test("a LeftOut with no id gives no line", () => {
  expect(
    linesFor(
      saving([{ card: orca, category: ocean }]),
      { cards: [], categories: [] },
      none,
      false,
    ),
  ).toEqual({ lines: [], notMade: [] });
});

test("a refusal noName gives no line", () => {
  expect(
    linesFor(making(orca), { refused: "noName", kind: "card" }, none, true),
  ).toEqual({ lines: [], notMade: [] });
});

test("a refusal gone for an id the act did not declare reads as its subject deleted", () => {
  expect(
    linesFor(
      deleting(orca),
      { refused: "gone", kind: "dimension", id: "dim-9" },
      none,
      false,
    ).lines,
  ).toEqual([
    'Your change to the card "Orca" was not kept. It was deleted on another device.',
  ]);
});

test("linesFor changes nothing it is given", () => {
  const sent = saving([
    { card: orca, category: ocean },
    { card: owl, category: forest },
  ]);
  const returned = { cards: ["card-2"], categories: ["cat-1"] };
  const notMade = new Set(["card-9"]);
  const before = structuredClone({ sent, returned, notMade });
  linesFor(sent, returned, notMade, false);
  expect({ sent, returned, notMade }).toEqual(before);

  const makingSent = making(ocean);
  const refusal = gone(habitat);
  const beforeMaking = structuredClone({ makingSent, refusal, notMade });
  linesFor(makingSent, refusal, notMade, true);
  expect({ makingSent, refusal, notMade }).toEqual(beforeMaking);
});
