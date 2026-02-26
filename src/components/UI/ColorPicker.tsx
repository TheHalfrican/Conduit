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
    <div className="grid grid-cols-6 gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={clsx(
            "w-8 h-8 rounded-lg transition-all",
            value === color
              ? "ring-2 ring-white ring-offset-2 ring-offset-hub-surface scale-110"
              : "hover:scale-110",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
