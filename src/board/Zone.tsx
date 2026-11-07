import { useId } from "react";
import Card from "./Card";
import type { PoolProps } from "./Pool";

export type ZoneProps = PoolProps & { category: string };

/** One zone: a region named by its label, the category's name, holding its cards. */
export default function Zone({
  category,
  items,
  selected,
  disabled,
  onPressCard,
  onPressLabel,
}: ZoneProps) {
  const labelId = useId();
  return (
    <section aria-labelledby={labelId}>
      <button type="button" id={labelId} onClick={onPressLabel}>
        {category}
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
