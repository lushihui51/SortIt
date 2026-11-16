import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";
import { afterEach, expect, test, vi } from "vitest";
import { BoardsProvider } from "../board/BoardsProvider";
import AppRoutes from "./AppRoutes";

// No test reaches Clerk: the learner is always signed out.
vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
  useUser: () => ({ user: null }),
  useClerk: () => ({ openSignIn: vi.fn(), signOut: vi.fn() }),
}));

afterEach(cleanup);

/** Shows the router's current path and how it was reached, for the tests to read. */
function Path() {
  return (
    <>
      <output aria-label="path">{useLocation().pathname}</output>
      <output aria-label="navigation">{useNavigationType()}</output>
    </>
  );
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <BoardsProvider>
        <AppRoutes />
        <Path />
      </BoardsProvider>
    </MemoryRouter>,
  );
}

test("the path / shows the board of the app's own deck", () => {
  renderAt("/");
  expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
  expect(screen.getByText("Shark")).toBeInTheDocument();
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
});

test("any other path is replaced by /", () => {
  for (const path of [
    "/decks",
    "/decks/Biology-3f2b8c1e9a4d4e6f8b210c5d7e9fa1b3",
    "/nowhere",
  ]) {
    renderAt(path);
    expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
    expect(screen.getByLabelText("navigation")).toHaveTextContent("REPLACE");
    expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
    cleanup();
  }
});
