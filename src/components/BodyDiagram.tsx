import { BODY_REGIONS_FRONT, BODY_REGIONS_BACK, type BodyRegion } from "@/lib/painTaxonomy";
import { cn } from "@/lib/utils";

type Props = {
  selected?: string | null;
  onSelect: (regionId: string) => void;
  view?: "front" | "back";
};

/**
 * Soft illustrated character. Tap targets are fully invisible until selected
 * — no colored patches showing through. Supports front and back views.
 */
export function BodyDiagram({ selected, onSelect, view = "front" }: Props) {
  const skin = "hsl(var(--skin))";
  const skinShadow = "hsl(var(--skin-shadow))";
  const hair = "hsl(var(--hair))";
  const ink = "hsl(var(--foreground) / 0.55)";
  const blush = "hsl(var(--blush))";
  const undies = "hsl(var(--primary) / 0.85)";

  const regions: BodyRegion[] = view === "front" ? BODY_REGIONS_FRONT : BODY_REGIONS_BACK;

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg
        viewBox="0 0 200 420"
        className="h-auto w-full select-none"
        role="img"
        aria-label={`Body diagram, ${view} view. Tap anywhere on the body to log pain.`}
      >
        {/* Soft ground shadow */}
        <ellipse cx="100" cy="406" rx="46" ry="6" fill="hsl(var(--foreground) / 0.08)" />

        {view === "front" ? <FrontFigure skin={skin} skinShadow={skinShadow} hair={hair} ink={ink} blush={blush} undies={undies} /> : <BackFigure skin={skin} skinShadow={skinShadow} hair={hair} ink={ink} undies={undies} />}

        {/* === Tap targets — invisible unless selected === */}
        {regions.map((r) => {
          const isSelected = selected === r.id;
          const fill = isSelected ? "hsl(var(--primary) / 0.45)" : "transparent";
          const stroke = isSelected ? "hsl(var(--primary))" : "transparent";

          const common = {
            fill,
            stroke,
            strokeWidth: 1.5,
            className: cn(
              "cursor-pointer transition-all duration-200",
              !isSelected && "hover:fill-[hsl(var(--primary)/0.18)]",
              isSelected && "animate-pulse-soft"
            ),
            onClick: () => onSelect(r.id),
            role: "button",
            "aria-label": r.label,
            "aria-pressed": isSelected,
          } as const;

          if (r.shape.kind === "circle") {
            return <circle key={r.id} cx={r.shape.cx} cy={r.shape.cy} r={r.shape.r} {...common} />;
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

function FrontFigure({
  skin,
  skinShadow,
  hair,
  ink,
  blush,
  undies,
}: {
  skin: string;
  skinShadow: string;
  hair: string;
  ink: string;
  blush: string;
  undies: string;
}) {
  return (
    <g>
      {/* Neck */}
      <rect x="90" y="58" width="20" height="20" rx="6" fill={skinShadow} />

      {/* Torso */}
      <path
        d="M62 100 Q60 88 78 84 L122 84 Q140 88 138 100 L142 178 Q142 196 124 198 L76 198 Q58 196 58 178 Z"
        fill={skin}
      />

      {/* Arms */}
      <path d="M58 102 Q44 108 44 130 L46 196 Q46 208 58 210 Q66 208 66 196 L66 132 Q66 116 76 110 Z" fill={skin} />
      <path d="M142 102 Q156 108 156 130 L154 196 Q154 208 142 210 Q134 208 134 196 L134 132 Q134 116 124 110 Z" fill={skin} />

      {/* Hands */}
      <circle cx="56" cy="216" r="10" fill={skinShadow} />
      <circle cx="144" cy="216" r="10" fill={skinShadow} />

      {/* Underwear band */}
      <path d="M60 198 Q60 214 76 218 L124 218 Q140 214 140 198 L140 210 Q124 226 100 226 Q76 226 60 210 Z" fill={undies} />

      {/* Legs */}
      <path d="M70 218 Q66 224 68 240 L74 372 Q74 384 86 386 Q98 384 98 372 L100 240 Q100 226 96 218 Z" fill={skin} />
      <path d="M130 218 Q134 224 132 240 L126 372 Q126 384 114 386 Q102 384 102 372 L100 240 Q100 226 104 218 Z" fill={skin} />

      {/* Feet */}
      <ellipse cx="86" cy="392" rx="14" ry="7" fill={skinShadow} />
      <ellipse cx="114" cy="392" rx="14" ry="7" fill={skinShadow} />

      {/* Knee dimples */}
      <circle cx="84" cy="296" r="1.6" fill={ink} opacity="0.35" />
      <circle cx="116" cy="296" r="1.6" fill={ink} opacity="0.35" />

      {/* Belly button */}
      <circle cx="100" cy="158" r="1.4" fill={ink} opacity="0.35" />

      {/* === Head === */}
      {/* Hair back */}
      <path d="M70 38 Q72 14 100 12 Q128 14 130 38 L132 56 Q132 60 128 60 L72 60 Q68 60 68 56 Z" fill={hair} />
      {/* Face */}
      <ellipse cx="100" cy="40" rx="22" ry="24" fill={skin} />
      {/* Hair front fringe */}
      <path d="M80 28 Q92 18 110 22 Q124 26 122 36 Q108 30 96 32 Q86 34 80 38 Z" fill={hair} />
      {/* Ears */}
      <ellipse cx="78" cy="42" rx="3" ry="4" fill={skinShadow} />
      <ellipse cx="122" cy="42" rx="3" ry="4" fill={skinShadow} />
      {/* Eyes (closed, peaceful) */}
      <path d="M89 42 q3 2 6 0" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M105 42 q3 2 6 0" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="86" cy="50" rx="3.5" ry="2" fill={blush} opacity="0.6" />
      <ellipse cx="114" cy="50" rx="3.5" ry="2" fill={blush} opacity="0.6" />
      {/* Mouth */}
      <path d="M96 52 q4 3 8 0" stroke={ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function BackFigure({
  skin,
  skinShadow,
  hair,
  ink,
  undies,
}: {
  skin: string;
  skinShadow: string;
  hair: string;
  ink: string;
  undies: string;
}) {
  return (
    <g>
      {/* Neck */}
      <rect x="90" y="58" width="20" height="20" rx="6" fill={skinShadow} />

      {/* Torso (back) */}
      <path
        d="M62 100 Q60 88 78 84 L122 84 Q140 88 138 100 L142 178 Q142 196 124 198 L76 198 Q58 196 58 178 Z"
        fill={skin}
      />

      {/* Subtle spine line */}
      <path d="M100 92 L100 192" stroke={ink} strokeWidth="1" opacity="0.18" strokeDasharray="2 3" />
      {/* Shoulder blades hint */}
      <path d="M76 104 q8 10 18 6" stroke={ink} strokeWidth="1" fill="none" opacity="0.18" />
      <path d="M124 104 q-8 10 -18 6" stroke={ink} strokeWidth="1" fill="none" opacity="0.18" />

      {/* Arms */}
      <path d="M58 102 Q44 108 44 130 L46 196 Q46 208 58 210 Q66 208 66 196 L66 132 Q66 116 76 110 Z" fill={skin} />
      <path d="M142 102 Q156 108 156 130 L154 196 Q154 208 142 210 Q134 208 134 196 L134 132 Q134 116 124 110 Z" fill={skin} />

      {/* Hands (back) */}
      <circle cx="56" cy="216" r="10" fill={skinShadow} />
      <circle cx="144" cy="216" r="10" fill={skinShadow} />

      {/* Glutes / undies band */}
      <path d="M60 198 Q60 218 80 224 L120 224 Q140 218 140 198 L140 212 Q124 230 100 230 Q76 230 60 212 Z" fill={undies} />
      {/* Glute curves */}
      <path d="M82 210 q2 10 14 10" stroke={ink} strokeWidth="1" fill="none" opacity="0.18" />
      <path d="M118 210 q-2 10 -14 10" stroke={ink} strokeWidth="1" fill="none" opacity="0.18" />

      {/* Legs */}
      <path d="M70 222 Q66 228 68 244 L74 372 Q74 384 86 386 Q98 384 98 372 L100 244 Q100 230 96 222 Z" fill={skin} />
      <path d="M130 222 Q134 228 132 244 L126 372 Q126 384 114 386 Q102 384 102 372 L100 244 Q100 230 104 222 Z" fill={skin} />

      {/* Heels */}
      <ellipse cx="86" cy="392" rx="14" ry="7" fill={skinShadow} />
      <ellipse cx="114" cy="392" rx="14" ry="7" fill={skinShadow} />

      {/* === Head (back) === */}
      <path d="M70 38 Q72 14 100 12 Q128 14 130 38 L132 60 Q132 64 128 64 L72 64 Q68 64 68 60 Z" fill={hair} />
      {/* Hair crown highlight */}
      <path d="M84 22 Q100 14 116 22" stroke="hsl(var(--background))" strokeWidth="1.2" fill="none" opacity="0.35" />
      {/* Ears peeking */}
      <ellipse cx="76" cy="44" rx="3" ry="4" fill={skinShadow} />
      <ellipse cx="124" cy="44" rx="3" ry="4" fill={skinShadow} />
    </g>
  );
}
