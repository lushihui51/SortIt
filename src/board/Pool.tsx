import { useId } from "react";
import Card from "./Card";

export type PoolProps = {
  /** The item names of the cards shown here, in the order shown. */
  items: readonly string[];
  /** The selected card's item name; null while no card is selected. */
  selected: string | null;
  /** Disables every card shown here. */
  disabled: boolean;
  onPressCard: (item: string) => void;
  onPressLabel: () => void;
};

/** The pool: a region named by its label "Unsorted", holding its cards. */
export default function Pool({
  items,
  selected,
  disabled,
  onPressCard,
  onPressLabel,
}: PoolProps) {
  const labelId = useId();
  return (
    <section aria-labelledby={labelId}>
      <button type="button" id={labelId} onClick={onPressLabel}>
        Unsorted
      </button>
      {items.map((item) => (
        <Card
          key={item}
          item={item}
          selected={item === selected}
          disabled={disabled}
          onPress={onPressCard}
        />
      ))}
    </section>
  );
}
