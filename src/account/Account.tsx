import { useAuth, useClerk } from "@clerk/react";
import type { ReactElement } from "react";
import "./Account.css";

/** "Sign in", which opens Clerk's sign-in form, while the learner is signed out; nothing while Clerk is loading or the learner is signed in. */
export default function Account(): ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  if (!isLoaded || isSignedIn) return null;
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
