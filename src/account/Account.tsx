import { useAuth, useClerk, useUser } from "@clerk/react";
import { useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import "./Account.css";

/**
 * "Sign in", which opens Clerk's sign-in form, while the learner is signed
 * out; the account button, whose menu shows the learner's email address and
 * "Sign out", while they are signed in; nothing while Clerk is loading or has
 * not yet given the signed-in learner's details. The menu hangs under the
 * nearest positioned ancestor, so `Account` must be rendered inside a bar that
 * is positioned.
 */
export default function Account(): ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  if (!isLoaded) return null;
  if (isSignedIn) {
    if (!user) return null;
    // The menu's state lives in `AccountButton`, which signing out unmounts,
    // so signing out closes the menu.
    return (
      <AccountButton
        email={user.primaryEmailAddress?.emailAddress ?? null}
        picture={user.hasImage ? user.imageUrl : null}
      />
    );
  }
  return (
    <button
      type="button"
      className="account-sign-in"
      // Clerk's modal keeps the address unchanged and makes an account inside
      // itself, which it stops doing once given `withSignUp` (ADR 008); the
      // popup keeps Google's sign-in from leaving the page.
      onClick={() => clerk.openSignIn({ oauthFlow: "popup" })}
    >
      Sign in
    </button>
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
          <button
            type="button"
            className="account-sign-out"
            // Clerk goes to the root after signing out unless handed an
            // address; handed the current one, it goes there through
            // `stayOnPage`, so the learner stays on the board as they left it
            // with the address unchanged.
            onClick={() => clerk.signOut({ redirectUrl: window.location.href })}
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
