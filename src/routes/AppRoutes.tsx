import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router";
import AppDeckScreen from "../screens/AppDeckScreen";

/** The app's routes. It must be rendered inside a router and inside `BoardsProvider`. */
export default function AppRoutes(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<AppDeckScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
