import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Notice from "./Notice";

afterEach(cleanup);

test("Notice shows its line with role status and an icon hidden from assistive technology", () => {
  const line = 'Your new card "Seal" was not kept.';
  render(<Notice>{line}</Notice>);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent(/^Your new card "Seal" was not kept\.$/);
  const icons = status.querySelectorAll("svg");
  expect(icons).toHaveLength(1);
  expect(icons[0]).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByText(line).tagName).toBe("P");
});
