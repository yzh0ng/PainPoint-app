import { useEffect, useState } from "react";
import { PAIN_TYPES, regionLabel, intensityColor, intensityLabel } from "@/lib/painTaxonomy";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  region: string | null;
  onClose: () => void;
  onSaved: () => void;
  onMoreDetails: () => void;
};

/**
 * Inline quick-log card. Appears immediately when a body region is tapped.
 * Goal: save a meaningful entry in ~5 seconds without leaving the page.
 */
export function QuickLogPopover({ region, onClose, onSaved, onMoreDetails }: Props) {
  const { user } = useAuth();
  const [intensity, setIntensity] = useState(4);
  const [painType, setPainType] = useState<string>("aching");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (region) {
      setIntensity(4);
      setPainType("aching");
    }
  }, [region]);

  if (!region) return null;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const side = region.startsWith("left_")
      ? "left"
      : region.startsWith("right_")
      ? "right"
      : "center";
    const { error } = await supabase.from("pain_logs").insert({
      user_id: user.id,
      region,
      side,
      pain_type: painType as never,
      intensity,
      trigger: null,
      note: null,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    if (navigator.vibrate) navigator.vibrate(15);
    toast.success("Logged", { description: `${regionLabel(region)} · ${intensity}/10` });
    onSaved();
  };

  const color = intensityColor(intensity);

  // Compact, prioritized chips — covers ~80% of entries
  const quickTypes = PAIN_TYPES.filter((t) =>
    ["aching", "sharp", "burning", "throbbing", "cramping", "dull"].includes(t.value)
  );

  return (
    <div className="animate-fade-in fixed inset-x-0 bottom-20 z-30 px-4 safe-bottom">
      <div className="mx-auto max-w-md rounded-[28px] border border-border/60 bg-card p-5 shadow-paper">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Logging
            </p>
            <h3 className="font-display text-xl text-foreground">{regionLabel(region)}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Intensity */}
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">How much?</span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color }}
              >
                {intensity}
              </span>
              <span className="text-xs text-muted-foreground">{intensityLabel(intensity)}</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            aria-label="Pain intensity from 0 to 10"
            className="w-full appearance-none rounded-full"
            style={{
              height: 12,
              background: `linear-gradient(to right,
                hsl(var(--pain-0)) 0%,
                hsl(var(--pain-low)) 30%,
                hsl(var(--pain-mid)) 50%,
                hsl(var(--pain-high)) 70%,
                hsl(var(--pain-max)) 100%)`,
            }}
          />
        </div>

        {/* Type chips */}
        <div className="mb-4">
          <p className="mb-2 text-sm text-muted-foreground">What kind?</p>
          <div className="flex flex-wrap gap-2">
            {quickTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setPainType(t.value)}
                className={cn(
                  "rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold transition-all",
                  painType === t.value
                    ? "border-primary bg-primary-soft text-foreground"
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMoreDetails}
            className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Plus className="mr-1 inline h-4 w-4" />
            More details
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-[1.4] rounded-full bg-gradient-warm px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-60"
          >
            <Check className="mr-1 inline h-4 w-4" strokeWidth={3} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
