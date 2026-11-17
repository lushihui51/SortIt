import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, type ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Account from "./Account";

type User = {
  hasImage: boolean;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string } | null;
};

type SignInProps = { getContainer?: () => HTMLElement | null };

// No test reaches Clerk: each sets what `useAuth` and `useUser` report and
// watches the calls of `openSignIn`, `closeSignIn` and `signOut`. The mock's
// modal is one element that `openSignIn` puts in the container it is given
// and `closeSignIn` takes out; a test closes the form as the learner does by
// taking it out itself.
const clerk = vi.hoisted(() => ({
  auth: { isLoaded: true, isSignedIn: false as boolean | undefined },
  user: null as User | null,
  modal: null as HTMLElement | null,
  openSignIn: vi.fn(),
  closeSignIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => clerk.auth,
  useUser: () => ({ user: clerk.user }),
  useClerk: () => ({
    openSignIn: clerk.openSignIn,
    closeSignIn: clerk.closeSignIn,
    signOut: clerk.signOut,
  }),
}));

function openModal(props?: SignInProps) {
  clerk.modal = document.createElement("div");
  clerk.modal.dataset.testid = "modal";
  props?.getContainer?.()?.append(clerk.modal);
}

function closeModal() {
  clerk.modal?.remove();
  clerk.modal = null;
}

function signIn(user: Partial<User> = {}) {
  clerk.auth = { isLoaded: true, isSignedIn: true };
  clerk.user = {
    hasImage: false,
    imageUrl: "https://img.example/default.png",
    primaryEmailAddress: { emailAddress: "sam@example.com" },
    ...user,
  };
}

function reportSignedOut() {
  clerk.auth = { isLoaded: true, isSignedIn: false };
  clerk.user = null;
}

function reportNotLoaded() {
  clerk.auth = { isLoaded: false, isSignedIn: undefined };
  clerk.user = null;
}

/** The container the call of `openSignIn` at that index was given. */
function containerOf(call: number): HTMLElement | null {
  const [props] = clerk.openSignIn.mock.calls[call] as [SignInProps];
  return props.getContainer?.() ?? null;
}

/** Lets the mutation observers deliver what they have seen. */
async function settle() {
  await act(() => Promise.resolve());
}

/** Shows the router's current path and how it was reached, for the tests to read. */
function Path() {
  return (
    <>
      <output aria-label="path">{useLocation().pathname}</output>
      <output aria-label="navigation">{useNavigationType()}</output>
    </>
  );
}

function Router({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

/** A router at the path, which shows the path and how it was reached. */
function routerAt(path: string) {
  return function RouterAt({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[path]}>
        {children}
        <Path />
      </MemoryRouter>
    );
  };
}

beforeEach(() => {
  reportSignedOut();
  closeModal();
  clerk.openSignIn.mockReset().mockImplementation(openModal);
  clerk.closeSignIn.mockReset().mockImplementation(closeModal);
  clerk.signOut.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("shows nothing while Clerk is loading", () => {
  clerk.auth = { isLoaded: false, isSignedIn: undefined };
  const { container } = render(<Account />, { wrapper: Router });
  expect(container).toBeEmptyDOMElement();
});

test("shows Sign in while the learner is signed out", () => {
  render(<Account />, { wrapper: Router });
  const signIn = screen.getByRole("button", { name: "Sign in" });
  expect(signIn).toHaveAttribute("type", "button");
  expect(signIn).toHaveTextContent(/^Sign in$/);
});

test("pressing Sign in opens Clerk's sign-in form through openSignIn", async () => {
  const user = userEvent.setup();
  render(<Account />, { wrapper: Router });
  expect(clerk.openSignIn).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(clerk.openSignIn).toHaveBeenCalledExactlyOnceWith({
    oauthFlow: "popup",
    getContainer: expect.any(Function),
  });
});

test("openSignIn is given no withSignUp", async () => {
  const user = userEvent.setup();
  render(<Account />, { wrapper: Router });
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  for (const [props] of clerk.openSignIn.mock.calls)
    expect(props ?? {}).not.toHaveProperty("withSignUp");
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
});

test("shows the account button in place of Sign in while the learner is signed in", () => {
  signIn();
  render(<Account />, { wrapper: Router });
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveAttribute("type", "button");
  expect(account).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

test("shows nothing while Clerk has not given the signed-in learner's details", () => {
  clerk.auth = { isLoaded: true, isSignedIn: true };
  const { container } = render(<Account />, { wrapper: Router });
  expect(container).toBeEmptyDOMElement();
});

test("the account button shows the profile picture of a learner who has one", () => {
  signIn({ hasImage: true, imageUrl: "https://img.example/sam.png" });
  render(<Account />, { wrapper: Router });
  const account = screen.getByRole("button", { name: "Account" });
  const picture = account.querySelector("img");
  expect(picture).toHaveAttribute("src", "https://img.example/sam.png");
  expect(picture).toHaveAttribute("alt", "");
  expect(account).toHaveTextContent(/^$/);
});

test("the account button shows the first letter of the email address, in upper case, of a learner with no picture", () => {
  signIn({ hasImage: false });
  render(<Account />, { wrapper: Router });
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveTextContent(/^S$/);
  expect(account.querySelector("img")).toBeNull();
});

test("pressing the account button opens a menu with the email address and Sign out, and pressing it again closes the menu", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />, { wrapper: Router });
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
  render(<Account />, { wrapper: Router });
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(document.body);
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});

test("Escape closes the menu and returns the focus to the account button", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />, { wrapper: Router });
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
  render(<Account />, { wrapper: Router });
  const account = screen.getByRole("button", { name: "Account" });
  expect(account).toHaveTextContent(/^$/);
  await user.click(account);
  const signOut = screen.getByRole("button", { name: "Sign out" });
  expect(signOut.parentElement?.children).toHaveLength(1);
});

test("Sign out signs the learner out through Clerk", async () => {
  const user = userEvent.setup();
  signIn();
  const { rerender } = render(<Account />, { wrapper: Router });
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(clerk.signOut).toHaveBeenCalledOnce();

  clerk.auth = { isLoaded: true, isSignedIn: false };
  clerk.user = null;
  rerender(<Account />);
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Account" })).toBeNull();
  expect(screen.queryByText("sam@example.com")).toBeNull();
});

test("opens the sign-in form with no press when signInOpen is given and the learner is signed out", async () => {
  reportNotLoaded();
  const { rerender } = render(<Account signInOpen />, { wrapper: Router });
  expect(clerk.openSignIn).not.toHaveBeenCalled();

  reportSignedOut();
  rerender(<Account signInOpen />);
  expect(clerk.openSignIn).toHaveBeenCalledExactlyOnceWith({
    oauthFlow: "popup",
    getContainer: expect.any(Function),
  });
  expect(containerOf(0)).toContainElement(clerk.modal);

  // A later sign-out, while `Account` stays mounted, opens nothing.
  closeModal();
  await settle();
  signIn();
  rerender(<Account signInOpen />);
  reportSignedOut();
  rerender(<Account signInOpen />);
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
});

test("gives every call of openSignIn one container of its own in document.body", async () => {
  const user = userEvent.setup();
  const { container, rerender } = render(<Account signInOpen />, {
    wrapper: Router,
  });
  closeModal();
  await settle();
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(clerk.openSignIn).toHaveBeenCalledTimes(2);
  const own = containerOf(0);
  expect(own).toBeInstanceOf(HTMLElement);
  expect(containerOf(1)).toBe(own);
  expect(own?.parentElement).toBe(document.body);
  expect(container).not.toContainElement(own);

  // The container stands whatever Clerk reports.
  for (const report of [reportNotLoaded, signIn, reportSignedOut]) {
    report();
    rerender(<Account signInOpen />);
    expect(own?.parentElement).toBe(document.body);
  }

  // Another `Account` gives a container of its own.
  cleanup();
  clerk.openSignIn.mockClear();
  render(<Account signInOpen />, { wrapper: Router });
  expect(containerOf(0)).not.toBe(own);
  expect(containerOf(0)?.parentElement).toBe(document.body);
});

test("calls onSignInClose once when the form closes while Clerk reports the learner signed out", async () => {
  const onSignInClose = vi.fn();
  const { rerender } = render(
    <Account signInOpen onSignInClose={onSignInClose} />,
    { wrapper: Router },
  );
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();

  closeModal();
  await waitFor(() => expect(onSignInClose).toHaveBeenCalledOnce());
  rerender(<Account signInOpen onSignInClose={onSignInClose} />);
  await settle();
  expect(onSignInClose).toHaveBeenCalledOnce();
});

test("holds a close while Clerk reports not loaded, drops it when Clerk reports signed in, and calls onSignInClose when Clerk reports signed out", async () => {
  const user = userEvent.setup();
  const onSignInClose = vi.fn();
  const account = () => <Account signInOpen onSignInClose={onSignInClose} />;
  const { rerender } = render(account(), { wrapper: Router });

  // The learner signs in: the form closes while Clerk reports not loaded,
  // then Clerk reports them signed in.
  reportNotLoaded();
  rerender(account());
  closeModal();
  await settle();
  rerender(account());
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();
  signIn();
  rerender(account());
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();
  reportSignedOut();
  rerender(account());
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();

  // The learner closes the form, and Clerk reports not loaded before it
  // reports them signed out.
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  reportNotLoaded();
  rerender(account());
  closeModal();
  await settle();
  rerender(account());
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();
  reportSignedOut();
  rerender(account());
  await waitFor(() => expect(onSignInClose).toHaveBeenCalledOnce());
});

test("unmounting with the form open stops observing, closes the form through closeSignIn and does not call onSignInClose", async () => {
  const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
  const onSignInClose = vi.fn();
  const { unmount } = render(
    <Account signInOpen onSignInClose={onSignInClose} />,
    { wrapper: Router },
  );
  await settle();
  expect(disconnect).not.toHaveBeenCalled();

  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(clerk.closeSignIn).toHaveBeenCalledOnce();
  expect(disconnect.mock.invocationCallOrder[0]).toBeLessThan(
    clerk.closeSignIn.mock.invocationCallOrder[0],
  );
  expect(clerk.modal).toBeNull();
  await settle();
  expect(onSignInClose).not.toHaveBeenCalled();
});

test("unmounting with no form open calls nothing of Clerk", async () => {
  const user = userEvent.setup();
  render(<Account />, { wrapper: Router }).unmount();
  expect(clerk.openSignIn).not.toHaveBeenCalled();
  expect(clerk.closeSignIn).not.toHaveBeenCalled();
  expect(clerk.signOut).not.toHaveBeenCalled();

  // A form the learner opened and closed is no longer open.
  const { unmount } = render(<Account />, { wrapper: Router });
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  closeModal();
  await settle();
  unmount();
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
  expect(clerk.closeSignIn).not.toHaveBeenCalled();
});

test("under StrictMode the form signInOpen opens stays open and onSignInClose is not called", async () => {
  const onSignInClose = vi.fn();
  // At the root, as src/main.tsx has it: React runs no effect twice under a
  // StrictMode nested below the root.
  render(
    <StrictMode>
      <Router>
        <Account signInOpen onSignInClose={onSignInClose} />
      </Router>
    </StrictMode>,
  );
  await settle();
  // The effect opens the form, its cleanup closes it, and it opens it again.
  expect(clerk.openSignIn).toHaveBeenCalledTimes(2);
  expect(clerk.closeSignIn).toHaveBeenCalledOnce();
  const [first, second] = clerk.openSignIn.mock.invocationCallOrder;
  const [close] = clerk.closeSignIn.mock.invocationCallOrder;
  expect(first).toBeLessThan(close);
  expect(close).toBeLessThan(second);
  expect(containerOf(1)).toContainElement(clerk.modal);
  expect(onSignInClose).toHaveBeenCalledTimes(0);
});

test("Sign out pushes the address / and signs the learner out, and pushes nothing at /", async () => {
  const user = userEvent.setup();
  signIn();
  render(<Account />, { wrapper: routerAt("/decks") });
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
  expect(screen.getByLabelText("navigation")).toHaveTextContent("PUSH");
  expect(clerk.signOut).toHaveBeenCalledExactlyOnceWith({ redirectUrl: "/" });

  cleanup();
  clerk.signOut.mockReset();
  render(<Account />, { wrapper: routerAt("/") });
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/);
  expect(screen.getByLabelText("navigation")).toHaveTextContent("POP");
  expect(clerk.signOut).toHaveBeenCalledExactlyOnceWith({ redirectUrl: "/" });
});
