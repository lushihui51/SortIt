import type { ReactNode } from "react";
import type { Dimension } from "../../convex/model/deck";
import InfoButton from "../ui/InfoButton";
import "./DimensionPicker.css";

export type DimensionPickerProps = {
  /** The dimensions, in the order shown. */
  dimensions: readonly Dimension[];
  /** The chosen dimension's id; null while none is chosen. */
  chosen: string | null;
  /** Called with the pressed dimension's id. */
  onChoose: (dimension: string) => void;
  /** Called with a dimension's id and its ⓘ when that ⓘ is pressed; while absent no dimension holds an ⓘ. */
  onOpen?: (dimension: string, opener: HTMLElement) => void;
  /** Shown after the dimensions, as the picker's last thing. */
  children?: ReactNode;
};

/**
 * The picker under "Sort by": one toggle button per dimension, showing its
 * name, the chosen one pressed, and, given `onOpen`, the dimension's ⓘ in the
 * button's upper right corner. Pressing any button, the chosen one included,
 * calls `onChoose`.
 */
export default function DimensionPicker({
  dimensions,
  chosen,
  onChoose,
  onOpen,
  children,
}: DimensionPickerProps) {
  return (
    <fieldset className="picker">
      <legend className="picker-legend">Sort by</legend>
      {dimensions.map((dimension) => (
        // The ⓘ lies over the button's corner but stands beside it, never
        // inside it, since a button holds no other button.
        <span key={dimension.id} className="picker-item">
          <button
            type="button"
            className={
              "picker-dimension" + (onOpen ? " picker-dimension-info" : "")
            }
            aria-pressed={dimension.id === chosen}
            onClick={() => onChoose(dimension.id)}
          >
            {dimension.name}
          </button>
          {onOpen && (
            <InfoButton
              className="picker-info"
              onPress={(button) => onOpen(dimension.id, button)}
            />
          )}
        </span>
      ))}
      {children}
    </fieldset>
  );
}
