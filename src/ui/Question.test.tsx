import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import Panel from "./Panel";
import Question from "./Question";

afterEach(cleanup);

const asked = 'Delete the deck "History"?';

test("Question shows its question with the confirming word and Cancel, and calls onConfirm and onCancel", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn<() => void>();
  const onCancel = vi.fn<() => void>();
  const { container } = render(
    <Question
      question={asked}
      confirm="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  const question = screen.getByRole("alertdialog", { name: asked });
  expect(question).toHaveAttribute("aria-modal", "true");
  expect(within(question).getByText(asked)).toBeInTheDocument();
  const buttons = within(question).getAllByRole("button");
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Delete",
    "Cancel",
  ]);
  for (const button of buttons)
    expect(button).toHaveAttribute("type", "button");
  expect(buttons[1]).toHaveFocus();

  await user.click(container.querySelector(".question-scrim")!);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
  expect(buttons[1]).toHaveFocus();

  await user.click(buttons[0]);
  expect(onConfirm).toHaveBeenCalledOnce();
  expect(onCancel).not.toHaveBeenCalled();
  await user.click(buttons[1]);
  expect(onCancel).toHaveBeenCalledOnce();
  await user.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(2);
  expect(onConfirm).toHaveBeenCalledOnce();
});

/** A button that opens a question, and stands only while `kept` is true. */
function Asker({ kept }: { kept: boolean }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      {kept && (
        <button type="button" onClick={() => setAsking(true)}>
          Ask
        </button>
      )}
      {asking && (
        <Question
          question={asked}
          confirm="Delete"
          onConfirm={() => setAsking(false)}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}

test("Question returns the focus, when it closes, to the element that had it when it opened", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Asker kept />);
  const ask = screen.getByRole("button", { name: "Ask" });

  await user.click(ask);
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(ask).toHaveFocus();

  await user.click(ask);
  await user.keyboard("{Escape}");
  expect(ask).toHaveFocus();

  await user.click(ask);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(ask).toHaveFocus();

  // The element that had the focus is gone when the question closes: the
  // focus moves nowhere.
  await user.click(ask);
  rerender(<Asker kept={false} />);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(document.body).toHaveFocus();
});

test("over a panel, the Escape key and Tab belong to the question alone", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn<() => void>();
  const onCancel = vi.fn<() => void>();
  render(
    <>
      <Panel heading="History" onClose={onClose}>
        <button type="button">Delete</button>
      </Panel>
      <Question
        question={asked}
        confirm="Delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    </>,
  );
  const question = screen.getByRole("alertdialog");
  const [confirm, cancel] = within(question).getAllByRole("button");
  expect(cancel).toHaveFocus();
  await user.tab();
  expect(confirm).toHaveFocus();
  await user.tab();
  expect(cancel).toHaveFocus();
  await user.tab({ shift: true });
  expect(confirm).toHaveFocus();
  await user.tab({ shift: true });
  expect(cancel).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();
  expect(cancel).toHaveFocus();
});
