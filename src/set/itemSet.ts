export type Dimension = { name: string; categories: string[] };
export type Item = {
  name: string;
  /** Maps a dimension's name to the one category name of that dimension the item belongs to. */
  answers: Record<string, string>;
};
export type ItemSet = { dimensions: Dimension[]; items: Item[] };
