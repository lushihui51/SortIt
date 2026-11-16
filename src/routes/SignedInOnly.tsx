import { useConvexAuth, useQuery } from "convex/react";
import type { ReactElement } from "react";
import { Outlet, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import AppDeckScreen from "../screens/AppDeckScreen";

/**
 * The guard: renders the route inside it only for a learner Convex has
 * confirmed. It shows nothing while Convex is confirming, and the board of the
 * app's own deck with the sign-in form open, at the address it was given, to a
 * learner who is not signed in, until they sign in or close the form, which
 * replaces the address with `/`. It must be rendered inside `BoardsProvider`.
 */
export default function SignedInOnly(): ReactElement | null {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  // Kept subscribed across the routes inside, so that the list's value
  // outlives a move from one of them to another.
  useQuery(api.decks.list, isAuthenticated ? {} : "skip");
  if (isLoading) return null;
  if (!isAuthenticated)
    return (
      <AppDeckScreen
        signInOpen
        onSignInClose={() => navigate("/", { replace: true })}
      />
    );
  return <Outlet />;
}
