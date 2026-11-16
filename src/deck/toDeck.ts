import type { Deck } from "../../convex/model/deck";
import type { AppDeckFile } from "./appDeckFile";

/** The id of the app's own deck as a `Deck`. */
export const appDeckId = "app";

/**
 * Returns the app's own deck as a `Deck` whose id is `appDeckId` and whose
 * name is empty. Each dimension, category and card takes its name as its id,
 * in the file's order. An answer keyed by a name that is no dimension of the
 * file is left out. `file` is left unchanged and is not checked: an answer
 * whose value is no category of its dimension is kept as it stands, so the
 * result is sound only for a file in which `findFirstFault` finds no fault.
 */
export function toDeck(file: AppDeckFile): Deck {
  const dimensionNames = new Set(
    file.dimensions.map((dimension) => dimension.name),
  );
  return {
    id: appDeckId,
    name: "",
    dimensions: file.dimensions.map((dimension) => ({
      id: dimension.name,
      name: dimension.name,
      categories: dimension.categories.map((category) => ({
        id: category,
        name: category,
      })),
    })),
    cards: file.cards.map((card) => ({
      id: card.name,
      name: card.name,
      answers: Object.fromEntries(
        Object.entries(card.answers).filter(([dimension]) =>
          dimensionNames.has(dimension),
        ),
      ),
    })),
  };
}
