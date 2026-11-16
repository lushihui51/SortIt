import type { ReactElement } from "react";
import { Navigate, Route, Routes, useMatch } from "react-router";
import AppDeckScreen from "../screens/AppDeckScreen";
import DeckListScreen from "../screens/DeckListScreen";
import { DeckNotOpenedProvider } from "../screens/DeckNotOpened";
import DeckScreen from "../screens/DeckScreen";
import { deckIdOf } from "./deckAddress";
import SignedInOnly from "./SignedInOnly";

/** The app's routes. It must be rendered inside a router and inside `BoardsProvider`. */
export default function AppRoutes(): ReactElement {
  const deck = useMatch("/decks/:segment");
  // A segment that ends in no code names no deck, so it is replaced before
  // the guard can open the sign-in form for it.
  const named = deck === null || deckIdOf(deck.params.segment ?? "") !== null;
  return (
    <DeckNotOpenedProvider>
      {named ? (
        <Routes>
          <Route path="/" element={<AppDeckScreen />} />
          <Route element={<SignedInOnly />}>
            <Route path="/decks" element={<DeckListScreen />} />
            <Route path="/decks/:segment" element={<DeckScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Navigate to="/" replace />
      )}
    </DeckNotOpenedProvider>
  );
}
