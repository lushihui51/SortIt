import { useConvexConnectionState } from "convex/react";

/**
 * Whether Convex's client reports a mutation in flight: a change sent, or
 * waiting to be sent, that the deck the queries give does not hold yet. The
 * component re-renders when it changes. It must be called under
 * `ConvexProvider`, and throws outside it.
 */
export function useChangesWaiting(): boolean {
  return useConvexConnectionState().inflightMutations > 0;
}
