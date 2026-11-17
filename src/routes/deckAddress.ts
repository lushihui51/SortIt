/**
 * A deck's address is `/decks/` and one segment: the deck's name, then a
 * hyphen, then its code, the deck's id without its hyphens. The deck is found
 * by the code alone, so an address stays good after the deck is renamed.
 */

const runOfOtherCharacters = /[^\p{L}\p{N}]+/gu;
const code = /^[0-9a-f]{32}$/;

/** The address of a deck's board. */
export function deckAddress(deck: { id: string; name: string }): string {
  const name = deck.name.replace(runOfOtherCharacters, "-");
  return `/decks/${name}-${deck.id.replaceAll("-", "")}`;
}

/** The id of the deck that one path segment of a deck's address names, or null when the segment ends in no code. */
export function deckIdOf(segment: string): string | null {
  const last = segment.slice(-32);
  if (!code.test(last)) return null;
  return [
    last.slice(0, 8),
    last.slice(8, 12),
    last.slice(12, 16),
    last.slice(16, 20),
    last.slice(20),
  ].join("-");
}
