import { act, renderHook } from "@testing-library/react";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import type { ConnectionState } from "convex/browser";
import type { ReactNode } from "react";
import { expect, test } from "vitest";
import { useChangesWaiting } from "./useChangesWaiting";

/**
 * A stand-in for Convex's client that holds a connection state and tells its
 * subscribers each time `report` changes it, as the real client does.
 */
function fakeClient() {
  let state: ConnectionState = {
    hasInflightRequests: false,
    isWebSocketConnected: true,
    timeOfOldestInflightRequest: null,
    hasEverConnected: true,
    connectionCount: 1,
    connectionRetries: 0,
    inflightMutations: 0,
    inflightActions: 0,
  };
  const listeners = new Set<() => void>();
  const client = {
    connectionState: () => state,
    subscribeToConnectionState(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } as unknown as ConvexReactClient;
  function report(change: Partial<ConnectionState>) {
    state = { ...state, ...change };
    act(() => listeners.forEach((listener) => listener()));
  }
  return { client, report };
}

test("useChangesWaiting follows what Convex's client reports of mutations in flight", () => {
  const { client, report } = fakeClient();
  const { result } = renderHook(() => useChangesWaiting(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ConvexProvider client={client}>{children}</ConvexProvider>
    ),
  });
  expect(result.current).toBe(false);

  report({ inflightMutations: 1, hasInflightRequests: true });
  expect(result.current).toBe(true);
  report({ inflightMutations: 2, isWebSocketConnected: false });
  expect(result.current).toBe(true);
  report({ inflightMutations: 1, isWebSocketConnected: true });
  expect(result.current).toBe(true);
  report({ inflightMutations: 0, hasInflightRequests: false });
  expect(result.current).toBe(false);

  // An action in flight, or a connection lost with nothing sent, is no
  // change waiting.
  report({ inflightActions: 1, hasInflightRequests: true });
  expect(result.current).toBe(false);
  report({
    inflightActions: 0,
    hasInflightRequests: false,
    isWebSocketConnected: false,
  });
  expect(result.current).toBe(false);
});
