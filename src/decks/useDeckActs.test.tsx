import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Deck } from "../../convex/model/deck";
import * as acts from "../../convex/model/deckActs";
import type { BoardActs } from "../board/Board";
import {
  actLocally,
  createDeckLocally,
  deleteDeckLocally,
  type ThingAct,
} from "./optimistic";
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

// The optimistic update each mutation is given is read by the call it makes.
vi.mock("./optimistic", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./optimistic")>()),
  actLocally: vi.fn(),
}));

const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const biology: Deck = {
  id: "id-a",
  name: "Biology",
  dimensions: [],
  cards: [],
};

const animals: Deck = {
  id: "id-b",
  name: "Animals",
  dimensions: [
    {
      id: "d1",
      name: "Habitat",
      categories: [
        { id: "c1", name: "Sea" },
        { id: "c2", name: "Land" },
      ],
    },
  ],
  cards: [
    { id: "k1", name: "Orca", answers: { d1: "c1" } },
    { id: "k2", name: "Deer", answers: {} },
  ],
};

/** The arguments the only call of the mutation of the act was given. */
function sentBy(act: ThingAct): Record<string, unknown> {
  const send = mutationOf(`decks:${act}`);
  expect(send).toHaveBeenCalledOnce();
  return send.mock.calls[0][0] as Record<string, unknown>;
}

/** Whether any mutation was sent. */
function anySent(): boolean {
  return [...convex.mutations.values()].some(
    (mutation) => mutation.mock.calls.length > 0,
  );
}

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

test("each act of forDeck sends its mutation with the deck's id and its arguments and returns the act's result", () => {
  const made = { id: expect.stringMatching(id) };
  const answers = [
    { card: "k1", category: "c2" },
    { card: "k2", category: "c2" },
  ];
  const cases: [ThingAct, (deckActs: BoardActs) => unknown, object][] = [
    ["addCard", (a) => a.addCard(" Crab "), { ...made, name: " Crab " }],
    ["deleteCard", (a) => a.deleteCard("k1"), { card: "k1" }],
    ["addDimension", (a) => a.addDimension("Diet"), { ...made, name: "Diet" }],
    ["deleteDimension", (a) => a.deleteDimension("d1"), { dimension: "d1" }],
    [
      "addCategory",
      (a) => a.addCategory("d1", "Air"),
      { dimension: "d1", ...made, name: "Air" },
    ],
    [
      "deleteCategory",
      (a) => a.deleteCategory("d1", "c1"),
      { dimension: "d1", category: "c1" },
    ],
    [
      "saveAnswers",
      (a) => a.saveAnswers("d1", answers),
      { dimension: "d1", answers },
    ],
  ];
  for (const [act, call, args] of cases) {
    convex.mutations.clear();
    vi.mocked(actLocally).mockClear();
    const { result } = renderHook(() => useDeckActs());
    const returned = call(result.current.forDeck(animals));

    const sent = sentBy(act);
    expect(sent).toEqual({ deck: "id-b", ...args });
    const { deck: _deck, ...actArgs } = sent;
    expect(returned).toEqual(
      (acts[act] as (deck: Deck, args: object) => unknown)(animals, actArgs),
    );
    expect(returned).toMatchObject({ ok: true });

    // The mutation's optimistic update applies the same act.
    const send = mutationOf(`decks:${act}`);
    expect(send.withOptimisticUpdate).toHaveBeenCalledOnce();
    const update = send.withOptimisticUpdate.mock.calls[0][0] as (
      store: unknown,
      args: unknown,
    ) => void;
    const store = {};
    update(store, sent);
    expect(actLocally).toHaveBeenCalledWith(store, act, sent);
  }
});

test("addCard, addDimension and addCategory send a new id made on the device", () => {
  const { result } = renderHook(() => useDeckActs());
  const deckActs = result.current.forDeck(animals);
  const makings: [ThingAct, () => acts.ActResult, (deck: Deck) => string][] = [
    ["addCard", () => deckActs.addCard("Crab"), (deck) => deck.cards[2].id],
    [
      "addDimension",
      () => deckActs.addDimension("Diet"),
      (deck) => deck.dimensions[1].id,
    ],
    [
      "addCategory",
      () => deckActs.addCategory("d1", "Air"),
      (deck) => deck.dimensions[0].categories[2].id,
    ],
  ];

  for (const [act, make, madeId] of makings) {
    const first = make();
    const second = make();
    const send = mutationOf(`decks:${act}`);
    expect(send).toHaveBeenCalledTimes(2);
    const ids = send.mock.calls.map((call) => (call[0] as { id: string }).id);
    expect(ids[0]).toMatch(id);
    expect(ids[1]).toMatch(id);
    expect(ids[0]).not.toBe(ids[1]);
    expect(first.ok && madeId(first.deck)).toBe(ids[0]);
    expect(second.ok && madeId(second.deck)).toBe(ids[1]);
  }
});

test("an act that refuses sends nothing and returns the refusal", () => {
  const { result } = renderHook(() => useDeckActs());
  const deckActs = result.current.forDeck(animals);

  expect(deckActs.addCard(" Orca ")).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "card", name: "Orca" },
  });
  expect(deckActs.addCard("  ")).toEqual({
    ok: false,
    refusal: { refused: "noName", kind: "card" },
  });
  expect(deckActs.addDimension("Habitat")).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "dimension", name: "Habitat" },
  });
  expect(deckActs.addCategory("d1", "Sea")).toEqual({
    ok: false,
    refusal: { refused: "nameTaken", kind: "category", name: "Sea" },
  });
  expect(deckActs.addCategory("d9", "Air")).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "d9" },
  });
  expect(deckActs.deleteCard("k9")).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "card", id: "k9" },
  });
  expect(deckActs.deleteDimension("d9")).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "d9" },
  });
  expect(deckActs.deleteCategory("d1", "c9")).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "category", id: "c9" },
  });
  expect(deckActs.saveAnswers("d9", [{ card: "k1", category: "c1" }])).toEqual({
    ok: false,
    refusal: { refused: "gone", kind: "dimension", id: "d9" },
  });
  expect(anySent()).toBe(false);
});

test("an act that leaves the deck as it was sends nothing", () => {
  const { result } = renderHook(() => useDeckActs());
  const deckActs = result.current.forDeck(animals);

  const unchanged = [
    deckActs.saveAnswers("d1", []),
    deckActs.saveAnswers("d1", [{ card: "k1", category: "c1" }]),
    deckActs.saveAnswers("d1", [
      { card: "k9", category: "c2" },
      { card: "k2", category: "c9" },
    ]),
  ];

  for (const saved of unchanged) {
    expect(saved.ok && saved.deck).toBe(animals);
  }
  expect(unchanged[2]).toEqual({
    ok: true,
    deck: animals,
    leftOut: { cards: ["k9"], categories: ["c9"] },
  });
  expect(anySent()).toBe(false);
});

test("a mutation that throws leaves no unhandled rejection and writes the error to the console", async () => {
  const createError = new Error("The caller is not signed in.");
  const deleteError = new Error("No deck id-a of the caller.");
  const addError = new Error("No deck id-b of the caller.");
  mutationOf("decks:createDeck").mockRejectedValue(createError);
  mutationOf("decks:deleteDeck").mockRejectedValue(deleteError);
  mutationOf("decks:addCard").mockRejectedValue(addError);
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);

  try {
    const { result } = renderHook(() => useDeckActs());
    result.current.createDeck("History");
    result.current.deleteDeck("id-a");
    result.current.forDeck(animals).addCard("Crab");
    // Node reports an unhandled rejection once the microtasks have run.
    await new Promise((resolve) => setTimeout(resolve, 10));
  } finally {
    process.off("unhandledRejection", unhandled);
  }

  expect(unhandled).not.toHaveBeenCalled();
  expect(consoleError).toHaveBeenCalledWith(createError);
  expect(consoleError).toHaveBeenCalledWith(deleteError);
  expect(consoleError).toHaveBeenCalledWith(addError);
  expect(document.body).toHaveTextContent(/^$/);
});
