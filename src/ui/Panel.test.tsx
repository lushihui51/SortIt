import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import Panel from "./Panel";

afterEach(cleanup);

test("Panel shows its heading, names its dialog by it, holds its children and calls onClose from Close", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn<() => void>();
  render(
    <Panel heading="Orca" onClose={onClose}>
      <p>Lives in every ocean.</p>
    </Panel>,
  );
  const dialog = screen.getByRole("dialog", { name: "Orca" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  const heading = within(dialog).getByRole("heading", {
    level: 2,
    name: "Orca",
  });
  expect(heading).toHaveTextContent(/^Orca$/);
  expect(within(dialog).getByText("Lives in every ocean.")).toBeInTheDocument();
  const buttons = within(dialog).getAllByRole("button");
  expect(buttons).toEqual([
    within(dialog).getByRole("button", { name: "Close" }),
  ]);
  expect(buttons[0]).toHaveAttribute("type", "button");
  expect(onClose).not.toHaveBeenCalled();
  await user.click(buttons[0]);
  expect(onClose).toHaveBeenCalledOnce();
});

test("Panel takes the focus to Close, keeps Tab inside it and calls onClose on Escape", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn<() => void>();
  render(
    <>
      <button type="button">Behind</button>
      <Panel heading="Orca" onClose={onClose}>
        <input aria-label="Name" />
      </Panel>
    </>,
  );
  const close = screen.getByRole("button", { name: "Close" });
  const name = screen.getByRole("textbox", { name: "Name" });
  expect(close).toHaveFocus();
  await user.tab();
  expect(name).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();
  await user.tab({ shift: true });
  expect(name).toHaveFocus();
  screen.getByRole("button", { name: "Behind" }).focus();
  await user.tab();
  expect(close).toHaveFocus();
  expect(onClose).not.toHaveBeenCalled();
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledOnce();
});
