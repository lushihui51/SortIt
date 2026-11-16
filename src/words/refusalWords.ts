import type { Refusal } from "../../convex/model/deckActs";

/**
 * The words the learner reads for a name refused. `held` is the name of what
 * holds the name: the deck for a card or a dimension, the dimension for a
 * category; a deck's refusal reads none.
 */
export function refusalWords(
  refusal: Extract<Refusal, { refused: "nameTaken" | "noName" }>,
  held?: string,
): string {
  const holder = held ?? "";
  if (refusal.refused === "noName") {
    switch (refusal.kind) {
      case "deck":
        return "A deck needs a name.";
      case "card":
        return "A card needs a name.";
      case "dimension":
        return "A dimension needs a name.";
      case "category":
        return "A category needs a name.";
    }
  }
  const { name } = refusal;
  switch (refusal.kind) {
    case "deck":
      return `You already have a deck called "${name}".`;
    case "card":
      return `The deck "${holder}" already has a card called "${name}".`;
    case "dimension":
      return `The deck "${holder}" already has a dimension called "${name}".`;
    case "category":
      return `The dimension "${holder}" already has a category called "${name}".`;
  }
}
