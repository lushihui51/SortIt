import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { BrowserRouter } from "react-router";
import { BoardsProvider } from "./board/BoardsProvider";
import AppRoutes from "./routes/AppRoutes";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Clerk's every move, after a sign-in or a new account included, replaces the
// current entry of the history and loads nothing, so the learner stays on the
// board as they left it and Back never walks through the steps of signing in.
function stayOnPage(to: string): void {
  window.history.replaceState(window.history.state, "", to);
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        routerPush={stayOnPage}
        routerReplace={stayOnPage}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <BoardsProvider>
            <AppRoutes />
          </BoardsProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </BrowserRouter>
  );
}
