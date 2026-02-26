import { clsx } from "clsx";

const PRESET_COLORS = [
  "#00d4aa",
  "#4488ff",
  "#aa66ff",
  "#ff4466",
  "#ff8844",
  "#ffcc00",
  "#44cc44",
  "#ff66aa",
  "#66ccff",
  "#cc88ff",
  "#88ddaa",
  "#ffaa66",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-0.5 p-1 bg-hub-surface shadow-win-inset">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={clsx(
            "w-6 h-6 rounded-none border border-hub-border",
            value === color && "shadow-win-inset",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
