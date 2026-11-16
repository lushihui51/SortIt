import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import { createDeckLocally, deleteDeckLocally } from "./optimistic";
import { useDeckActs } from "./useDeckActs";

type Mutation = ReturnType<typeof vi.fn> & {
  withOptimisticUpdate: ReturnType<typeof vi.fn>;
};

// No test reaches Convex: each sets the decks the list query gives, and reads
// the mutation the hook was given for a function by the function's name.
const convex = vi.hoisted(() => ({
  decks: undefined as Deck[] | undefined,
  mutations: new Map<string, Mutation>(),
}));

/** The mutation of the function of that name, made on first use, which resolves to null unless a test says otherwise. */
function mutationOf(name: string): Mutation {
  let mutation = convex.mutations.get(name);
  if (mutation === undefined) {
    mutation = Object.assign(
      vi.fn(() => Promise.resolve(null)),
      { withOptimisticUpdate: vi.fn() },
    );
    mutation.withOptimisticUpdate.mockReturnValue(mutation);
    convex.mutations.set(name, mutation);
  }
  return mutation;
}

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useQuery: (query: never) =>
      getFunctionName(query) === "decks:list" ? convex.decks : undefined,
    useMutation: (mutation: never) => mutationOf(getFunctionName(mutation)),
  };
});

const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const biology: Deck = {
  id: "id-a",
  name: "Biology",
  dimensions: [],
  cards: [],
};

beforeEach(() => {
  convex.decks = [biology];
  convex.mutations.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("createDeck sends the mutation with a new id and the name, and returns the new deck", () => {
  const { result } = renderHook(() => useDeckActs());

  const made = result.current.createDeck("  History ");

  expect(made).toEqual({
    ok: true,
    deck: {
      id: expect.stringMatching(id),
      name: "History",
      dimensions: [],
      cards: [],
    },
  });
  const deck = made.ok ? made.deck : undefined;
  const send = mutationOf("decks:createDeck");
  expect(send).toHaveBeenCalledOnce();
  expect(send).toHaveBeenCalledWith({ id: deck?.id, name: "  History " });
  expect(send.withOptimisticUpdate).toHaveBeenCalledWith(createDeckLocally);

  const again = result.current.createDeck("Chemistry");
  expect(again.ok && again.deck.id).not.toBe(deck?.id);
});

test("createDeck takes the learner to have no deck while the list has not loaded", () => {
  convex.decks = undefined;
  const { result } = renderHook(() => useDeckActs());

  const made = result.current.createDeck("Biology");

  expect(made.ok && made.deck.name).toBe("Biology");
  expect(mutationOf("decks:createDeck")).toHaveBeenCalledOnce();
});

test("createDeck returns the refusal and sends nothing for an empty name and for a name the learner already uses", () => {
  const { result } = renderHook(() => useDeckActs());

  expect(result.current.createDeck("   ")).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "deck" },
  });
  expect(result.current.createDeck(" Biology ")).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "deck", name: "Biology" },
  });
  expect(mutationOf("decks:createDeck")).not.toHaveBeenCalled();
});

test("deleteDeck sends the mutation with the deck's id", () => {
  const { result } = renderHook(() => useDeckActs());

  result.current.deleteDeck("id-a");

  const send = mutationOf("decks:deleteDeck");
  expect(send).toHaveBeenCalledOnce();
  expect(send).toHaveBeenCalledWith({ deck: "id-a" });
  expect(send.withOptimisticUpdate).toHaveBeenCalledWith(deleteDeckLocally);
});

test("a mutation that throws leaves no unhandled rejection and writes the error to the console", async () => {
  const createError = new Error("The caller is not signed in.");
  const deleteError = new Error("No deck id-a of the caller.");
  mutationOf("decks:createDeck").mockRejectedValue(createError);
  mutationOf("decks:deleteDeck").mockRejectedValue(deleteError);
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);

  try {
    const { result } = renderHook(() => useDeckActs());
    result.current.createDeck("History");
    result.current.deleteDeck("id-a");
    // Node reports an unhandled rejection once the microtasks have run.
    await new Promise((resolve) => setTimeout(resolve, 10));
  } finally {
    process.off("unhandledRejection", unhandled);
  }

  expect(unhandled).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalledWith(createError);
  expect(consoleError).toHaveBeenCalledWith(deleteError);
  expect(document.body).toHaveTextContent(/^$/);
});
