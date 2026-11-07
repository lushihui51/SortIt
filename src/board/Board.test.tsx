import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { shippedSet } from "../set/shippedSet";
import Board from "./Board";
import { shuffle } from "./board";

afterEach(cleanup);

// With every draw 0, each shuffle is a fixed rotation of the order before it,
// so every test knows the exact order of the cards after each shuffle.
const zero = () => 0;
const names = shippedSet.items.map((item) => item.name);
const afterLoad = shuffle(names, zero);
const afterChoose = shuffle(afterLoad, zero);

function setUp() {
  const user = userEvent.setup();
  render(<Board set={shippedSet} random={zero} />);
  return user;
}

function region(name: string) {
  return screen.getByRole("region", { name });
}

/** The accessible names of the cards in a region, its label left out. */
function cardsIn(name: string): string[] {
  return within(region(name))
    .getAllByRole("button")
    .slice(1)
    .map((button) => button.textContent ?? "");
}

const habitat = shippedSet.dimensions[0];
const diet = shippedSet.dimensions[1];

async function chooseHabitat(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: habitat.name }));
}

test("shows every card in the pool, the prompt and no zone before a dimension is chosen", () => {
  setUp();
  expect(cardsIn("Unsorted")).toEqual(afterLoad);
  expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
  expect(screen.getAllByRole("region")).toHaveLength(1);
  expect(screen.getByRole("group", { name: "Sort by" })).toBeInTheDocument();
  for (const dimension of shippedSet.dimensions) {
    expect(
      screen.getByRole("button", { name: dimension.name }),
    ).toHaveAttribute("aria-pressed", "false");
  }
});

test("disables every card before a dimension is chosen", () => {
  setUp();
  const cards = within(region("Unsorted")).getAllByRole("button").slice(1);
  expect(cards).toHaveLength(names.length);
  for (const card of cards) expect(card).toBeDisabled();
});

test("shows one zone per category of the chosen dimension and removes the prompt", async () => {
  const user = setUp();
  await chooseHabitat(user);
  expect(
    screen
      .getAllByRole("region")
      .slice(1)
      .map((zone) => within(zone).getAllByRole("button")[0].textContent),
  ).toEqual(habitat.categories);
  expect(screen.queryByText("Choose how to sort to begin")).toBeNull();
  expect(screen.getByRole("button", { name: habitat.name })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const card of within(region("Unsorted")).getAllByRole("button"))
    expect(card).toBeEnabled();
});

test("sends a selected card to a zone by click", async () => {
  const user = setUp();
  await chooseHabitat(user);
  const card = afterChoose[0];
  await user.click(screen.getByRole("button", { name: card }));
  expect(
    screen.getByRole("button", { name: `${card} Selected` }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  expect(cardsIn("Ocean")).toEqual([card]);
  expect(cardsIn("Unsorted")).toEqual(afterChoose.slice(1));
});

test("sends a selected card to a zone by keyboard", async () => {
  const user = setUp();
  await chooseHabitat(user);
  const card = afterChoose[0];
  screen.getByRole("button", { name: card }).focus();
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("button", { name: `${card} Selected` }),
  ).toBeInTheDocument();
  screen.getByRole("button", { name: "Forest" }).focus();
  await user.keyboard(" ");
  expect(cardsIn("Forest")).toEqual([card]);
  expect(cardsIn("Unsorted")).toEqual(afterChoose.slice(1));
});

test("returns a selected card to the pool by click on the pool's label", async () => {
  const user = setUp();
  await chooseHabitat(user);
  const card = afterChoose[0];
  await user.click(screen.getByRole("button", { name: card }));
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  await user.click(screen.getByRole("button", { name: card }));
  await user.click(screen.getByRole("button", { name: "Unsorted" }));
  expect(cardsIn("Ocean")).toEqual([]);
  expect(cardsIn("Unsorted")).toEqual(afterChoose);
});

test("clears the selection on a second click on the selected card", async () => {
  const user = setUp();
  await chooseHabitat(user);
  const card = afterChoose[0];
  await user.click(screen.getByRole("button", { name: card }));
  await user.click(screen.getByRole("button", { name: `${card} Selected` }));
  expect(screen.queryByText("Selected")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  expect(cardsIn("Ocean")).toEqual([]);
});

test("clears the selection on Escape", async () => {
  const user = setUp();
  await chooseHabitat(user);
  const card = afterChoose[0];
  await user.click(screen.getByRole("button", { name: card }));
  await user.keyboard("{Escape}");
  expect(screen.queryByText("Selected")).toBeNull();
  expect(screen.getByRole("button", { name: card })).toBeInTheDocument();
});

test("does nothing on a zone's label while no card is selected", async () => {
  const user = setUp();
  await chooseHabitat(user);
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  expect(cardsIn("Ocean")).toEqual([]);
  expect(cardsIn("Unsorted")).toEqual(afterChoose);
});

test("Reset returns every card to the pool and keeps the dimension", async () => {
  const user = setUp();
  await chooseHabitat(user);
  for (const [card, zone] of [
    [afterChoose[0], "Ocean"],
    [afterChoose[1], "Desert"],
  ]) {
    await user.click(screen.getByRole("button", { name: card }));
    await user.click(screen.getByRole("button", { name: zone }));
  }
  await user.click(screen.getByRole("button", { name: afterChoose[2] }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(cardsIn("Unsorted")).toEqual(shuffle(afterChoose, zero));
  expect(screen.queryByText("Selected")).toBeNull();
  for (const category of habitat.categories)
    expect(cardsIn(category)).toEqual([]);
  expect(screen.getByRole("button", { name: habitat.name })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("choosing another dimension clears the board and shows its zones", async () => {
  const user = setUp();
  await chooseHabitat(user);
  await user.click(screen.getByRole("button", { name: afterChoose[0] }));
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  await user.click(screen.getByRole("button", { name: afterChoose[1] }));
  await user.click(screen.getByRole("button", { name: diet.name }));
  expect(cardsIn("Unsorted")).toEqual(shuffle(afterChoose, zero));
  expect(screen.queryByText("Selected")).toBeNull();
  expect(
    screen
      .getAllByRole("region")
      .slice(1)
      .map((zone) => within(zone).getAllByRole("button")[0].textContent),
  ).toEqual(diet.categories);
  for (const category of diet.categories) expect(cardsIn(category)).toEqual([]);
  expect(screen.getByRole("button", { name: diet.name })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: habitat.name })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("choosing the current dimension again changes nothing", async () => {
  const user = setUp();
  await chooseHabitat(user);
  await user.click(screen.getByRole("button", { name: afterChoose[0] }));
  await user.click(screen.getByRole("button", { name: "Ocean" }));
  await user.click(screen.getByRole("button", { name: afterChoose[1] }));
  await chooseHabitat(user);
  expect(cardsIn("Ocean")).toEqual([afterChoose[0]]);
  expect(
    screen.getByRole("button", { name: `${afterChoose[1]} Selected` }),
  ).toBeInTheDocument();
  expect(cardsIn("Unsorted")).toEqual([
    `${afterChoose[1]} Selected`,
    ...afterChoose.slice(2),
  ]);
});
