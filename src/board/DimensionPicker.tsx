import type { Dimension } from "../../convex/model/deck";
import "./DimensionPicker.css";

export type DimensionPickerProps = {
  /** The dimensions, in the order shown. */
  dimensions: readonly Dimension[];
  /** The chosen dimension's id; null while none is chosen. */
  chosen: string | null;
  /** Called with the pressed dimension's id. */
  onChoose: (dimension: string) => void;
};

/**
 * The picker under "Sort by": one toggle button per dimension, showing its
 * name, the chosen one pressed. Pressing any button, the chosen one included, calls `onChoose`.
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
          key={dimension.id}
          type="button"
          className="picker-dimension"
          aria-pressed={dimension.id === chosen}
          onClick={() => onChoose(dimension.id)}
        >
          {dimension.name}
        </button>
      ))}
    </fieldset>
  );
}
