import "./DimensionPicker.css";

export type DimensionPickerProps = {
  /** The dimensions' names, in the order shown. */
  dimensions: readonly string[];
  /** The chosen dimension's name; null while none is chosen. */
  chosen: string | null;
  onChoose: (dimension: string) => void;
};

/**
 * The picker under "Sort by": one toggle button per dimension, the chosen one
 * pressed. Pressing any button, the chosen one included, calls `onChoose`.
 */
export default function DimensionPicker({
  dimensions,
  chosen,
  onChoose,
}: DimensionPickerProps) {
  return (
    <fieldset className="picker">
      <legend className="picker-legend">Sort by</legend>
      {dimensions.map((dimension) => (
        <button
          key={dimension}
          type="button"
          className="picker-dimension"
          aria-pressed={dimension === chosen}
          onClick={() => onChoose(dimension)}
        >
          {dimension}
        </button>
      ))}
    </fieldset>
  );
}
