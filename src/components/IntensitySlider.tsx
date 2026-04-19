import { intensityColor, intensityLabel } from "@/lib/painTaxonomy";

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export function IntensitySlider({ value, onChange }: Props) {
  const color = intensityColor(value);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-muted-foreground">Intensity</div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-3xl font-semibold tabular-nums"
            style={{ color }}
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{intensityLabel(value)}</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Pain intensity from 0 to 10"
        className="w-full appearance-none rounded-full"
        style={{
          height: 14,
          background: `linear-gradient(to right,
            hsl(var(--pain-0)) 0%,
            hsl(var(--pain-low)) 30%,
            hsl(var(--pain-mid)) 50%,
            hsl(var(--pain-high)) 70%,
            hsl(var(--pain-max)) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>None</span>
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
        <span>Worst</span>
      </div>
    </div>
  );
}
