import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BoardsProvider } from "../board/BoardsProvider";
import SignedInOnly from "./SignedInOnly";

type SignInProps = { getContainer?: () => HTMLElement | null };

// No test reaches Convex: each sets what `useConvexAuth` reports, and the
// mock of `useQuery` counts, by function name, the components subscribed to
// a query, as Convex keeps a query subscribed while a component asks for it.
// Convex's client reports no mutation in flight.
const convex = vi.hoisted(() => ({
  auth: { isLoading: false, isAuthenticated: false },
  subscribed: new Map<string, number>(),
  unsubscribed: [] as string[],
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { useEffect } = await import("react");
  const mutation = () =>
    Object.assign(() => Promise.resolve(null), {
      withOptimisticUpdate() {
        return mutation();
      },
    });
  return {
    useConvexAuth: () => convex.auth,
    useQuery: (query: never, args?: unknown) => {
      const name = getFunctionName(query);
      const skipped = args === "skip";
      useEffect(() => {
        if (skipped) return;
        convex.subscribed.set(name, (convex.subscribed.get(name) ?? 0) + 1);
        return () => {
          convex.subscribed.set(name, convex.subscribed.get(name)! - 1);
          convex.unsubscribed.push(name);
        };
      }, [name, skipped]);
      return skipped ? undefined : [];
    },
    useMutation: () => mutation(),
    useConvexConnectionState: () => ({ inflightMutations: 0 }),
  };
});

// No test reaches Clerk: the learner is signed out to Clerk unless Convex
// reports them authenticated. The mock's modal is one element that
// `openSignIn` puts in the container it is given and `closeSignIn` takes out;
// a test closes the form as the learner does by taking it out itself.
const clerk = vi.hoisted(() => ({
  modal: null as HTMLElement | null,
  openSignIn: vi.fn(),
  closeSignIn: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: convex.auth.isAuthenticated }),
  useUser: () => ({ user: null }),
  useClerk: () => ({
    openSignIn: clerk.openSignIn,
    closeSignIn: clerk.closeSignIn,
    signOut: vi.fn(),
  }),
}));

function openModal(props?: SignInProps) {
  clerk.modal = document.createElement("div");
  props?.getContainer?.()?.append(clerk.modal);
}

function closeModal() {
  clerk.modal?.remove();
  clerk.modal = null;
}

beforeEach(() => {
  convex.auth = { isLoading: false, isAuthenticated: false };
  convex.subscribed.clear();
  convex.unsubscribed = [];
  closeModal();
  clerk.openSignIn.mockReset().mockImplementation(openModal);
  clerk.closeSignIn.mockReset().mockImplementation(closeModal);
});

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

/** The guard over two routes, `/decks` and `/decks/other`, each linking to the other, and `/` outside it. */
function app(path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <BoardsProvider>
        <main>
          <Routes>
            <Route path="/" element={<p>The app's first address</p>} />
            <Route element={<SignedInOnly />}>
              <Route
                path="/decks"
                element={<Link to="/decks/other">The route's screen</Link>}
              />
              <Route
                path="/decks/other"
                element={<Link to="/decks">Another route's screen</Link>}
              />
            </Route>
          </Routes>
        </main>
        <Path />
      </BoardsProvider>
    </MemoryRouter>
  );
}

test("renders nothing while Convex reports loading", () => {
  convex.auth = { isLoading: true, isAuthenticated: false };
  render(app("/decks"));
  expect(screen.getByRole("main")).toBeEmptyDOMElement();
  expect(clerk.openSignIn).not.toHaveBeenCalled();
});

test("shows the board of the app's own deck with the sign-in form open, at the address it was given, to a learner who is not signed in", async () => {
  render(app("/decks"));
  expect(screen.getByText("Choose how to sort to begin")).toBeInTheDocument();
  expect(screen.getByText("Shark")).toBeInTheDocument();
  expect(screen.queryByText("The route's screen")).toBeNull();
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
  expect(clerk.modal).toBeInTheDocument();
  await act(() => Promise.resolve());
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/decks$/);
  expect(screen.getByLabelText("navigation")).toHaveTextContent("POP");
});

test("replaces the address with / when the learner closes the sign-in form", async () => {
  render(app("/decks"));
  await act(() => Promise.resolve());
  closeModal();
  await waitFor(() =>
    expect(screen.getByLabelText("path")).toHaveTextContent(/^\/$/),
  );
  expect(screen.getByLabelText("navigation")).toHaveTextContent("REPLACE");
  expect(screen.getByText("The app's first address")).toBeInTheDocument();
  expect(clerk.closeSignIn).not.toHaveBeenCalled();
});

test("renders the route's screen once the learner is authenticated", () => {
  convex.auth = { isLoading: true, isAuthenticated: false };
  const { rerender } = render(app("/decks"));
  expect(screen.getByRole("main")).toBeEmptyDOMElement();

  convex.auth = { isLoading: false, isAuthenticated: true };
  rerender(app("/decks"));
  expect(screen.getByText("The route's screen")).toBeInTheDocument();
  expect(screen.queryByText("Choose how to sort to begin")).toBeNull();
  expect(clerk.openSignIn).not.toHaveBeenCalled();
  expect(screen.getByLabelText("path")).toHaveTextContent(/^\/decks$/);
});

test("keeps the list of decks subscribed while it renders a route for an authenticated learner", async () => {
  const user = userEvent.setup();
  const { rerender } = render(app("/decks"));
  expect(convex.subscribed.get("decks:list") ?? 0).toBe(0);

  convex.auth = { isLoading: false, isAuthenticated: true };
  rerender(app("/decks"));
  expect(convex.subscribed.get("decks:list")).toBe(1);

  // Neither route's screen asks for the list, and the subscription outlives
  // each move between them.
  await user.click(screen.getByText("The route's screen"));
  expect(screen.getByText("Another route's screen")).toBeInTheDocument();
  await user.click(screen.getByText("Another route's screen"));
  expect(screen.getByText("The route's screen")).toBeInTheDocument();
  expect(convex.subscribed.get("decks:list")).toBe(1);
  expect(convex.unsubscribed).toEqual([]);
});
