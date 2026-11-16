import { useAuth, useClerk, useUser } from "@clerk/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import "./Account.css";

export type AccountProps = {
  /** Opens the sign-in form, with no press, when `Account` first shows a learner who is not signed in. */
  signInOpen?: boolean;
  /** Called once the learner has closed the sign-in form without signing in, never when it closes because they signed in. */
  onSignInClose?: () => void;
};

/**
 * "Sign in", which opens Clerk's sign-in form, while the learner is signed
 * out; the account button, whose menu shows the learner's email address and
 * "Sign out", while they are signed in; nothing while Clerk is loading or has
 * not yet given the signed-in learner's details. The menu hangs under the
 * nearest positioned ancestor, so `Account` must be rendered inside a bar that
 * is positioned, and inside a router, since "Sign out" moves to `/`.
 * Unmounting it while the sign-in form it opened is open closes the form.
 */
export default function Account({
  signInOpen = false,
  onSignInClose,
}: AccountProps): ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  // The element Clerk renders the modal into, so that its close shows as the
  // element emptied (ADR 019).
  const container = useRef<HTMLDivElement>(null);
  // Whether the modal stands open from a call of `openSignIn` made here.
  const modalOpen = useRef(false);
  // Whether `signInOpen` has opened the form since `Account` mounted.
  const openedOnMount = useRef(false);
  const [closeHeld, setCloseHeld] = useState(false);

  function openSignIn() {
    modalOpen.current = true;
    // Clerk's modal keeps the address unchanged and makes an account inside
    // itself, which it stops doing once given `withSignUp` (ADR 008); the
    // popup keeps Google's sign-in from leaving the page.
    clerk.openSignIn({
      oauthFlow: "popup",
      getContainer: () => container.current,
    });
  }

  // Watches for the modal leaving the container for as long as `Account` is
  // mounted, and closes the modal when `Account` goes, so that a screen left
  // behind takes its form with it and that close is never taken for the
  // learner's.
  useEffect(() => {
    const element = container.current!;
    let held = element.hasChildNodes();
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.addedNodes.length > 0)) held = true;
      if (held && !element.hasChildNodes()) {
        held = false;
        modalOpen.current = false;
        setCloseHeld(true);
      }
    });
    observer.observe(element, { childList: true });
    return () => {
      observer.disconnect();
      if (modalOpen.current) {
        modalOpen.current = false;
        clerk.closeSignIn();
      }
      // React's StrictMode runs this cleanup between the two runs of each
      // effect on mount, and the form this closed must open again.
      openedOnMount.current = false;
    };
    // Run on mount alone, so that the cleanup is the unmount's; `clerk` is
    // the page's one Clerk.
  }, []);

  // `signInOpen` opens the form once, at the first report of a signed-out
  // learner, and never after a later sign-out.
  useEffect(() => {
    if (!signInOpen || openedOnMount.current || !isLoaded || isSignedIn) return;
    openedOnMount.current = true;
    openSignIn();
  }, [isLoaded, isSignedIn]);

  // A close is the learner's only once Clerk reports them signed out: after a
  // sign-in the modal closes while Clerk reports not loaded, then signed in
  // (ADR 019).
  useEffect(() => {
    if (!closeHeld || !isLoaded) return;
    setCloseHeld(false);
    if (!isSignedIn) onSignInClose?.();
  }, [closeHeld, isLoaded, isSignedIn, onSignInClose]);

  return (
    <>
      {createPortal(<div ref={container} />, document.body)}
      {isLoaded &&
        (isSignedIn ? (
          // The menu's state lives in `AccountButton`, which signing out
          // unmounts, so signing out closes the menu.
          user && (
            <AccountButton
              email={user.primaryEmailAddress?.emailAddress ?? null}
              picture={user.hasImage ? user.imageUrl : null}
            />
          )
        ) : (
          <button
            type="button"
            className="account-sign-in"
            onClick={openSignIn}
          >
            Sign in
          </button>
        ))}
    </>
  );
}

type AccountButtonProps = {
  /** The email address the learner is signed in with; null when Clerk gives none. */
  email: string | null;
  /** The address of the learner's profile picture; null when they have none. */
  picture: string | null;
};

/** The signed-in learner's account button and the menu it opens and closes. */
function AccountButton({ email, picture }: AccountButtonProps): ReactElement {
  const clerk = useClerk();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Listened for on the button and the menu alone, so the Escape that closes a
  // panel closes no menu.
  function closeOnEscape(event: KeyboardEvent) {
    if (open && event.key === "Escape") {
      setOpen(false);
      button.current?.focus();
    }
  }

  function signOut() {
    // Signing out lands on the board of the app's own deck, and Back returns
    // to the address the learner signed out from (PDR 015). Clerk is handed
    // `/` so that it moves nowhere else afterwards.
    if (pathname !== "/") navigate("/");
    clerk.signOut({ redirectUrl: "/" });
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        className="account-button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={closeOnEscape}
      >
        {picture !== null ? (
          <img className="account-picture" src={picture} alt="" />
        ) : (
          (email ?? "").charAt(0).toUpperCase()
        )}
      </button>
      {open && (
        <div className="account-menu" onKeyDown={closeOnEscape}>
          {email !== null && <p className="account-email">{email}</p>}
          <button type="button" className="account-sign-out" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
