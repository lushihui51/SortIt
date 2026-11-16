import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import NewField from "./NewField";

afterEach(cleanup);

const refused = 'You already have a deck called "History".';

function field() {
  return screen.getByRole("textbox", { name: "New deck" });
}

test("shows its label as its placeholder and its accessible name", () => {
  render(<NewField label="New deck" onEnter={() => null} />);
  expect(field()).toHaveAttribute("type", "text");
  expect(field()).toHaveAttribute("placeholder", "New deck");
  expect(field()).toHaveAccessibleName("New deck");
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.queryByRole("button")).toBeNull();
});

test("adds the caller's class to the field's own", () => {
  render(
    <NewField label="New deck" onEnter={() => null} className="the-caller" />,
  );
  expect(field()).toHaveClass("new-field", "the-caller");
});

test("Enter calls onEnter with the text as typed, an empty text included", async () => {
  const user = userEvent.setup();
  const onEnter = vi.fn(() => null);
  render(<NewField label="New deck" onEnter={onEnter} />);

  await user.type(field(), "  Ocean {Enter}");
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(onEnter).toHaveBeenLastCalledWith("  Ocean ");

  await user.type(field(), "{Enter}");
  expect(onEnter).toHaveBeenCalledTimes(2);
  expect(onEnter).toHaveBeenLastCalledWith("");
});

test("a name taken up empties the field, which keeps the focus", async () => {
  const user = userEvent.setup();
  render(<NewField label="New deck" onEnter={() => null} />);

  await user.type(field(), "Geography{Enter}");
  expect(field()).toHaveValue("");
  expect(field()).toHaveFocus();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a refusal shows under the field, which keeps what was typed", async () => {
  const user = userEvent.setup();
  render(<NewField label="New deck" onEnter={() => refused} />);
  expect(field()).not.toHaveAttribute("aria-describedby");

  await user.type(field(), "History{Enter}");
  const line = screen.getByRole("alert");
  expect(line.tagName).toBe("P");
  expect(line).toHaveTextContent(refused);
  expect(field().nextElementSibling).toBe(line);
  expect(field()).toHaveAttribute("aria-describedby", line.id);
  expect(field()).toHaveAccessibleDescription(refused);
  expect(field()).toHaveValue("History");
  expect(field()).toHaveFocus();
});

test("the refusal goes when the text changes", async () => {
  const user = userEvent.setup();
  render(<NewField label="New deck" onEnter={() => refused} />);

  await user.type(field(), "History{Enter}");
  expect(screen.getByRole("alert")).toBeInTheDocument();
  await user.type(field(), "{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent(refused);

  await user.type(field(), "y");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(field()).not.toHaveAttribute("aria-describedby");
  expect(field()).toHaveValue("Historyy");
});

test("the refusal goes when an Enter is taken up", async () => {
  const user = userEvent.setup();
  const onEnter = vi
    .fn<(name: string) => string | null>()
    .mockReturnValueOnce(refused)
    .mockReturnValueOnce(null);
  render(<NewField label="New deck" onEnter={onEnter} />);

  await user.type(field(), "History{Enter}");
  expect(screen.getByRole("alert")).toBeInTheDocument();
  await user.type(field(), "{Enter}");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(field()).toHaveValue("");
});
