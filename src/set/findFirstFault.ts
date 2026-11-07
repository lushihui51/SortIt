import type { ItemSet } from "./itemSet";

export type SetFault =
  | { kind: "noItem" }
  | { kind: "noDimension" }
  | { kind: "tooFewCategories"; dimension: string }
  | { kind: "duplicateItem"; item: string }
  | { kind: "duplicateDimension"; dimension: string }
  | { kind: "duplicateCategory"; dimension: string; category: string }
  /** The item's answers hold no entry for the dimension, or one that is not a category of it. */
  | { kind: "answer"; item: string; dimension: string };

/**
 * Returns the first fault of the set, or null when it has none. Faults are
 * looked for kind by kind in the order SetFault lists them, and within a kind
 * in file order. A key in an item's answers that names no dimension is not a
 * fault.
 */
export function findFirstFault(set: ItemSet): SetFault | null {
  if (set.items.length === 0) return { kind: "noItem" };
  if (set.dimensions.length === 0) return { kind: "noDimension" };

  for (const dimension of set.dimensions) {
    if (dimension.categories.length < 2)
      return { kind: "tooFewCategories", dimension: dimension.name };
  }

  const item = firstRepeat(set.items.map((each) => each.name));
  if (item !== undefined) return { kind: "duplicateItem", item };

  const dimension = firstRepeat(set.dimensions.map((each) => each.name));
  if (dimension !== undefined) return { kind: "duplicateDimension", dimension };

  for (const dimension of set.dimensions) {
    const category = firstRepeat(dimension.categories);
    if (category !== undefined)
      return { kind: "duplicateCategory", dimension: dimension.name, category };
  }

  for (const item of set.items) {
    for (const dimension of set.dimensions) {
      if (
        !Object.hasOwn(item.answers, dimension.name) ||
        !dimension.categories.includes(item.answers[dimension.name])
      )
        return { kind: "answer", item: item.name, dimension: dimension.name };
    }
  }

  return null;
}

function firstRepeat(names: string[]): string | undefined {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) return name;
    seen.add(name);
  }
  return undefined;
}
