import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Account from "./Account";

type User = {
  hasImage: boolean;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string } | null;
};

// No test reaches Clerk: each sets what `useAuth` and `useUser` report and
// watches the calls of `openSignIn` and `signOut`.
const clerk = vi.hoisted(() => ({
  auth: { isLoaded: true, isSignedIn: false as boolean | undefined },
  user: null as User | null,
  openSignIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => clerk.auth,
  useUser: () => ({ user: clerk.user }),
  useClerk: () => ({ openSignIn: clerk.openSignIn, signOut: clerk.signOut }),
}));

function signIn(user: Partial<User> = {}) {
  clerk.auth = { isLoaded: true, isSignedIn: true };
  clerk.user = {
    hasImage: false,
    imageUrl: "https://img.example/default.png",
    primaryEmailAddress: { emailAddress: "sam@example.com" },
    ...user,
  };
}

beforeEach(() => {
  clerk.auth = { isLoaded: true, isSignedIn: false };
  clerk.user = null;
  clerk.openSignIn.mockReset();
  clerk.signOut.mockReset();
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

test("shows the account button in place of Sign in while the learner is signed in", () => {
  signIn();
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveAttribute("type", "button");
  expect(account).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

test("shows nothing while Clerk has not given the signed-in learner's details", () => {
  clerk.auth = { isLoaded: true, isSignedIn: true };
  const { container } = render(<Account />);
  expect(container).toBeEmptyDOMElement();
});

test("the account button shows the profile picture of a learner who has one", () => {
  signIn({ hasImage: true, imageUrl: "https://img.example/sam.png" });
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  const picture = account.querySelector("img");
  expect(picture).toHaveAttribute("src", "https://img.example/sam.png");
  expect(picture).toHaveAttribute("alt", "");
  expect(account).toHaveTextContent(/^$/);
});

test("the account button shows the first letter of the email address, in upper case, of a learner with no picture", () => {
  signIn({ hasImage: false });
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveTextContent(/^S$/);
  expect(account.querySelector("img")).toBeNull();
});

test("pressing the account button opens a menu with the email address and Sign out, and pressing it again closes the menu", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  expect(screen.queryByText("sam@example.com")).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();

  await user.click(account);
  expect(account).toHaveAttribute("aria-expanded", "true");
  const email = screen.getByText("sam@example.com");
  const signOut = screen.getByRole("button", { name: "Sign out" });
  expect(signOut).toHaveAttribute("type", "button");
  expect(signOut).toHaveTextContent(/^Sign out$/);
  // The email address stands above "Sign out" in the one menu.
  expect(email.parentElement).toBe(signOut.parentElement);
  expect(email.nextElementSibling).toBe(signOut);
  expect(email.parentElement).not.toHaveAttribute("role");

  await user.click(account);
  expect(account).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("sam@example.com")).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
});

test("a press outside the menu leaves it open", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />);
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(document.body);
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("Escape closes the menu and returns the focus to the account button", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  await user.click(account);
  await user.tab();
  expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  expect(account).toHaveFocus();
});

test("a learner with no email address sees no letter and a menu with Sign out alone", async () => {
  const user = userEvent.setup();
  signIn({ primaryEmailAddress: null });
  render(<Account />);
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveTextContent(/^$/);
  await user.click(account);
  const signOut = screen.getByRole("button", { name: "Sign out" });
  expect(signOut.parentElement?.children).toHaveLength(1);
});

test("Sign out signs the learner out through Clerk", async () => {
  const user = userEvent.setup();
  signIn();
  const { rerender } = render(<Account />);
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(clerk.signOut).toHaveBeenCalledExactlyOnceWith({
    redirectUrl: window.location.href,
  });

  clerk.auth = { isLoaded: true, isSignedIn: false };
  clerk.user = null;
  rerender(<Account />);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Account" })).toBeNull();
  expect(screen.queryByText("sam@example.com")).toBeNull();
});
