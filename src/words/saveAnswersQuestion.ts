/** The question before Save answers changes the answers of `count` cards under the dimension of this name. */
export function saveAnswersQuestion(count: number, dimension: string): string {
  const cards = count === 1 ? "1 card" : `${count} cards`;
  return `Change the answers of ${cards} for the dimension "${dimension}"?`;
}
