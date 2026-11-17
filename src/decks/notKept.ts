import type { Kind, LeftOut, Refusal } from "../../convex/model/deckActs";
import { refusalWords } from "../words/refusalWords";

/** A thing an act touches. */
export type Thing = {
  kind: Kind;
  id: string;
  /** The thing's name as the deck held it when the act was sent. */
  name: string;
};

/** An act as it was sent, with every thing it touched named as the deck held it then. */
export type SentAct = {
  /** True when the act makes its subject, false when it changes or deletes it. */
  making: boolean;
  /** The thing the act makes or changes, which its line names; for Save answers, the dimension. */
  subject: Thing;
  /** Every other thing the act rests on: its deck, and the dimension of a category. */
  others: Thing[];
  /** The name of what holds the subject's name: the deck for a card or a dimension, the dimension for a category; null for a deck. */
  held: string | null;
  /** For Save answers alone: the card and the category of each pair sent, in the order sent. */
  answers?: { card: Thing; category: Thing }[];
};

export type NotKept = {
  /** The lines to show, in order; empty when nothing calls for one. */
  lines: string[];
  /** The ids to add to the things whose making was refused. */
  notMade: string[];
};

const kindWords: Record<Kind, string> = {
  deck: "deck",
  card: "card",
  dimension: "dimension",
  category: "category",
};

const deletedElsewhere = "It was deleted on another device.";

/**
 * The lines the learner reads for what a mutation returned late, each naming
 * what was not kept and why, and the ids of the things whose making it
 * refused. `notMade` holds the ids of the things whose making was refused so
 * far: a fault that is one of them gives no line. `laterChanged` tells whether
 * an act sent after this one touches the subject. A refusal for an empty name
 * gives nothing, and so does an id of `returned` that `sent.answers` does not
 * hold. Changes none of its arguments.
 */
export function linesFor(
  sent: SentAct,
  returned: Refusal | LeftOut,
  notMade: ReadonlySet<string>,
  laterChanged: boolean,
): NotKept {
  if (!("refused" in returned))
    return { lines: leftOutLines(sent, returned, notMade), notMade: [] };
  if (returned.refused === "noName") return { lines: [], notMade: [] };

  const made = sent.making ? [sent.subject.id] : [];
  let why: string;
  if (returned.refused === "nameTaken") {
    why =
      sent.held === null
        ? refusalWords(returned)
        : refusalWords(returned, sent.held);
  } else {
    // A thing never made is told of when its making is refused, never again
    // through a later act that rests on it (ADR 012).
    if (notMade.has(returned.id)) return { lines: [], notMade: made };
    const other =
      returned.id === sent.subject.id
        ? undefined
        : sent.others.find((thing) => thing.id === returned.id);
    why =
      other === undefined
        ? deletedElsewhere
        : `The ${kindWords[other.kind]} "${other.name}" was deleted on another device.`;
  }
  return {
    lines: [`${whatNotKept(sent, laterChanged)} ${why}`],
    notMade: made,
  };
}

/** The first sentence of a line: what was not kept. */
function whatNotKept(sent: SentAct, laterChanged: boolean): string {
  const { kind, name } = sent.subject;
  if (!sent.making)
    return `Your change to the ${kindWords[kind]} "${name}" was not kept.`;
  return laterChanged
    ? `Your new ${kindWords[kind]} "${name}" and your later changes to it were not kept.`
    : `Your new ${kindWords[kind]} "${name}" was not kept.`;
}

/**
 * One line for each category left out, then one for each card left out whose
 * category was kept, leaving out every id of `notMade`.
 */
function leftOutLines(
  sent: SentAct,
  leftOut: LeftOut,
  notMade: ReadonlySet<string>,
): string[] {
  const categories = new Map<string, Thing>();
  // Set in order, so each card keeps its last pair, the one the act lets stand.
  const pairOfCard = new Map<string, { card: Thing; category: Thing }>();
  for (const pair of sent.answers ?? []) {
    categories.set(pair.category.id, pair.category);
    pairOfCard.set(pair.card.id, pair);
  }
  const categoriesLeftOut = new Set(leftOut.categories);

  const lines: string[] = [];
  for (const id of leftOut.categories) {
    const category = categories.get(id);
    if (category === undefined || notMade.has(id)) continue;
    lines.push(
      `Your answers in the category "${category.name}" were not kept. ${deletedElsewhere}`,
    );
  }
  for (const id of leftOut.cards) {
    const pair = pairOfCard.get(id);
    if (pair === undefined || notMade.has(id)) continue;
    // A card whose category was left out is told by that category's line, or
    // by none when the category was never made.
    if (categoriesLeftOut.has(pair.category.id)) continue;
    lines.push(
      `Your answer for the card "${pair.card.name}" was not kept. ${deletedElsewhere}`,
    );
  }
  return lines;
}
