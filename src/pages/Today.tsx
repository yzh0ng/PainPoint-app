import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogSheet } from "@/components/LogSheet";
import { BodyDiagram } from "@/components/BodyDiagram";
import { QuickLogPopover } from "@/components/QuickLogPopover";
import { regionLabel, intensityColor } from "@/lib/painTaxonomy";
import { Flame, TrendingDown, Minus, TrendingUp } from "lucide-react";
import { format, isToday, subDays } from "date-fns";
import { cn } from "@/lib/utils";

type Log = {
  id: string;
  logged_at: string;
  region: string;
  pain_type: string;
  intensity: number;
};

export default function Today() {
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [name, setName] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  const load = async () => {
    if (!user) return;
    const since = subDays(new Date(), 7).toISOString();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    setName(profile?.display_name ?? null);
    const { data } = await supabase
      .from("pain_logs")
      .select("id, logged_at, region, pain_type, intensity")
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(50);
    setLogs(data ?? []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const todayLogs = useMemo(
    () => logs.filter((l) => isToday(new Date(l.logged_at))),
    [logs]
  );

  const streak = useMemo(() => {
    const days = new Set(logs.map((l) => format(new Date(l.logged_at), "yyyy-MM-dd")));
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (days.has(d)) s++;
      else if (i > 0) break;
      else break;
    }
    return s;
  }, [logs]);

  // (heatmap on the figure removed — keeps the character clean and cute)

  const avgToday = todayLogs.length
    ? Math.round((todayLogs.reduce((s, l) => s + l.intensity, 0) / todayLogs.length) * 10) / 10
    : null;

  const yesterday = useMemo(() => {
    const ys = logs.filter(
      (l) =>
        format(new Date(l.logged_at), "yyyy-MM-dd") ===
        format(subDays(new Date(), 1), "yyyy-MM-dd")
    );
    if (!ys.length) return null;
    return ys.reduce((s, l) => s + l.intensity, 0) / ys.length;
  }, [logs]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const handleRegionTap = (id: string) => {
    setActiveRegion(id);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleSaved = () => {
    setActiveRegion(null);
    load();
  };

  const handleMoreDetails = () => {
    setActiveRegion(null);
    setSheetOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-5 pb-24">
      <header className="px-1">
        <p className="text-sm text-muted-foreground">
          {greeting}{name ? `, ${name}` : ""}.
        </p>
        <h1 className="mt-1 font-display text-[28px] font-medium leading-tight text-foreground">
          {todayLogs.length === 0
            ? "Where does it ache today?"
            : `${todayLogs.length} log${todayLogs.length === 1 ? "" : "s"} so far today`}
        </h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Streak"
          value={`${streak}`}
          suffix={streak === 1 ? "day" : "days"}
          Icon={Flame}
          tint="hsl(var(--accent))"
        />
        <StatCard
          label="Today avg"
          value={avgToday !== null ? avgToday.toString() : "—"}
          suffix={avgToday !== null ? "/10" : ""}
          color={avgToday !== null ? intensityColor(avgToday) : undefined}
        />
        <StatCard
          label="Trend"
          value={
            avgToday === null || yesterday === null
              ? "—"
              : avgToday < yesterday
              ? "Down"
              : avgToday > yesterday
              ? "Up"
              : "Flat"
          }
          Icon={
            avgToday === null || yesterday === null
              ? Minus
              : avgToday < yesterday
              ? TrendingDown
              : avgToday > yesterday
              ? TrendingUp
              : Minus
          }
        />
      </div>

      {/* The figure IS the action surface */}
      <section className="relative rounded-[32px] border border-border/60 bg-paper px-4 pb-4 pt-6 shadow-paper">
        <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tap where it hurts
        </p>
        <p className="mx-auto mb-3 max-w-[260px] text-center text-xs text-muted-foreground/80">
          Anywhere on the body — we'll save it in a couple of taps.
        </p>

        {/* Front / Back toggle */}
        <div className="mx-auto mb-2 flex w-fit items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-soft">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setBodyView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                bodyView === v
                  ? "bg-gradient-warm text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={bodyView === v}
            >
              {v}
            </button>
          ))}
        </div>

        <BodyDiagram
          view={bodyView}
          selected={activeRegion}
          onSelect={handleRegionTap}
        />
      </section>

      {/* Today's logs */}
      {todayLogs.length > 0 && (
        <section className="pp-card">
          <h2 className="mb-3 font-display text-base font-medium text-foreground">
            Today's notes
          </h2>
          <ul className="divide-y divide-border/60">
            {todayLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-foreground">{regionLabel(l.region)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(l.logged_at), "h:mm a")} · {l.pain_type}
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-sm font-bold text-white"
                  style={{ backgroundColor: intensityColor(l.intensity) }}
                >
                  {l.intensity}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <QuickLogPopover
        region={activeRegion}
        onClose={() => setActiveRegion(null)}
        onSaved={handleSaved}
        onMoreDetails={handleMoreDetails}
      />

      <LogSheet open={sheetOpen} onOpenChange={setSheetOpen} onLogged={load} />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  Icon,
  color,
  tint,
}: {
  label: string;
  value: string;
  suffix?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  tint?: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-card p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="font-display text-2xl font-semibold tabular-nums"
          style={{ color: color ?? tint }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
