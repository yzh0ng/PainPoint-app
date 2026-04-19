import { BODY_REGIONS } from "@/lib/painTaxonomy";
import { cn } from "@/lib/utils";

type Props = {
  selected?: string | null;
  onSelect: (regionId: string) => void;
  highlights?: Record<string, number>; // region -> intensity (0-10) for heatmap
};

export function BodyDiagram({ selected, onSelect, highlights }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <svg
        viewBox="0 0 200 420"
        className="h-auto w-full"
        role="img"
        aria-label="Body diagram. Tap a region to log pain."
      >
        {/* Body silhouette outline */}
        <g fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1.2">
          <circle cx="100" cy="36" r="26" />
          <rect x="76" y="60" width="48" height="74" rx="20" />
          <rect x="40" y="100" width="120" height="70" rx="22" />
          <rect x="74" y="160" width="52" height="70" rx="18" />
          <rect x="68" y="220" width="30" height="170" rx="14" />
          <rect x="102" y="220" width="30" height="170" rx="14" />
          <rect x="40" y="108" width="22" height="92" rx="11" />
          <rect x="138" y="108" width="22" height="92" rx="11" />
          <rect x="66" y="386" width="32" height="14" rx="6" />
          <rect x="102" y="386" width="32" height="14" rx="6" />
        </g>

        {/* Tappable regions */}
        {BODY_REGIONS.map((r) => {
          const isSelected = selected === r.id;
          const heat = highlights?.[r.id];
          const fill = heat
            ? heat <= 3
              ? "hsl(var(--pain-low) / 0.55)"
              : heat <= 5
              ? "hsl(var(--pain-mid) / 0.6)"
              : heat <= 7
              ? "hsl(var(--pain-high) / 0.7)"
              : "hsl(var(--pain-max) / 0.8)"
            : isSelected
            ? "hsl(var(--primary) / 0.85)"
            : "hsl(var(--primary) / 0)";

          const stroke = isSelected ? "hsl(var(--primary))" : "transparent";

          const common = {
            fill,
            stroke,
            strokeWidth: 1.5,
            className: cn(
              "cursor-pointer transition-all duration-200",
              !isSelected && "hover:fill-[hsl(var(--primary)/0.18)]"
            ),
            onClick: () => onSelect(r.id),
            role: "button",
            "aria-label": r.label,
            "aria-pressed": isSelected,
          } as const;

          if (r.shape.kind === "circle") {
            return (
              <circle key={r.id} cx={r.shape.cx} cy={r.shape.cy} r={r.shape.r} {...common} />
            );
          }
          return (
            <rect
              key={r.id}
              x={r.shape.x}
              y={r.shape.y}
              width={r.shape.w}
              height={r.shape.h}
              rx={r.shape.rx ?? 6}
              {...common}
            />
          );
        })}
      </svg>
    </div>
  );
}
