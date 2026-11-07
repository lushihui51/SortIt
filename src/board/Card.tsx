export type CardProps = {
  item: string;
  selected: boolean;
  disabled: boolean;
  onPress: (item: string) => void;
};

/** One item of the set as a button; pressing it calls `onPress` with `item`. */
export default function Card({ item, selected, disabled, onPress }: CardProps) {
  return (
    <button type="button" disabled={disabled} onClick={() => onPress(item)}>
      {item}
      {/* The space keeps the spoken name "<item> Selected" two words. */}
      {selected && " "}
      {selected && <span className="visually-hidden">Selected</span>}
    </button>
  );
}
