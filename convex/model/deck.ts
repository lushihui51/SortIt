export type Category = { id: string; name: string };

export type Dimension = { id: string; name: string; categories: Category[] };

export type Card = {
  id: string;
  name: string;
  /** Maps a dimension's id to the id of the one category of that dimension that is the card's answer; a dimension with no entry has no answer. */
  answers: Record<string, string>;
};

export type Deck = {
  id: string;
  name: string;
  dimensions: Dimension[];
  cards: Card[];
};
