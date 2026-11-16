/** The shape of deck.json: the app's own deck as its author writes it, keyed by name, with no id. */
export type AppDeckFile = {
  dimensions: { name: string; categories: string[] }[];
  cards: {
    name: string;
    /** Maps a dimension's name to the one category name of that dimension the card belongs to. */
    answers: Record<string, string>;
  }[];
};
