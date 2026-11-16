import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Account from "./Account";

// No test reaches Clerk: each sets what `useAuth` reports and watches the
// calls of `openSignIn`.
const clerk = vi.hoisted(() => ({
  auth: { isLoaded: true, isSignedIn: false as boolean | undefined },
  openSignIn: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => clerk.auth,
  useClerk: () => ({ openSignIn: clerk.openSignIn }),
}));

beforeEach(() => {
  clerk.auth = { isLoaded: true, isSignedIn: false };
  clerk.openSignIn.mockReset();
});

afterEach(cleanup);

test("shows nothing while Clerk is loading", () => {
  clerk.auth = { isLoaded: false, isSignedIn: undefined };
  const { container } = render(<Account />);
  expect(container).toBeEmptyDOMElement();
});

test("shows Sign in while the learner is signed out", () => {
  render(<Account />);
  const signIn = screen.getByRole("button", { name: "Sign in" });
  expect(signIn).toHaveAttribute("type", "button");
  expect(signIn).toHaveTextContent(/^Sign in$/);
});

test("pressing Sign in opens Clerk's sign-in form through openSignIn", async () => {
  const user = userEvent.setup();
  render(<Account />);
  expect(clerk.openSignIn).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(clerk.openSignIn).toHaveBeenCalledExactlyOnceWith({
    oauthFlow: "popup",
  });
});

test("openSignIn is given no withSignUp", async () => {
  const user = userEvent.setup();
  render(<Account />);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  for (const [props] of clerk.openSignIn.mock.calls)
    expect(props ?? {}).not.toHaveProperty("withSignUp");
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
});
