import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogSheet } from "@/components/LogSheet";
import { BodyDiagram } from "@/components/BodyDiagram";
import { regionLabel, intensityColor } from "@/lib/painTaxonomy";
import { Plus, Flame, TrendingDown, Minus } from "lucide-react";
import { format, isToday, subDays } from "date-fns";

type Log = {
  id: string;
  logged_at: string;
  region: string;
  pain_type: string;
  intensity: number;
};

export default function Today() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
    // Count consecutive days back from today with at least one log
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

  // Today heatmap: peak intensity per region
  const heat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of todayLogs) {
      m[l.region] = Math.max(m[l.region] ?? 0, l.intensity);
    }
    return m;
  }, [todayLogs]);

  const avgToday = todayLogs.length
    ? Math.round((todayLogs.reduce((s, l) => s + l.intensity, 0) / todayLogs.length) * 10) / 10
    : null;

  // Trend: yesterday vs today avg
  const yesterday = useMemo(() => {
    const ys = logs.filter(
      (l) => format(new Date(l.logged_at), "yyyy-MM-dd") === format(subDays(new Date(), 1), "yyyy-MM-dd")
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

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-sm text-muted-foreground">{greeting}{name ? `, ${name}` : ""}.</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {todayLogs.length === 0
            ? "How are you feeling today?"
            : `${todayLogs.length} log${todayLogs.length === 1 ? "" : "s"} so far today`}
        </h1>
      </header>

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
              : Minus
          }
        />
      </div>

      <section className="pp-card">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Today on the body</h2>
        {Object.keys(heat).length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Tap below to log your first pain of the day.
          </div>
        ) : (
          <BodyDiagram onSelect={() => setOpen(true)} highlights={heat} />
        )}
      </section>

      {todayLogs.length > 0 && (
        <section className="pp-card">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Today's logs</h2>
          <ul className="divide-y divide-border/60">
            {todayLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{regionLabel(l.region)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(l.logged_at), "h:mm a")} · {l.pain_type}
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                  style={{ backgroundColor: intensityColor(l.intensity) }}
                >
                  {l.intensity}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Floating CTA */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gradient-warm px-6 py-4 text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
        aria-label="Log pain"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          Log pain
        </span>
      </button>

      <LogSheet open={open} onOpenChange={setOpen} onLogged={load} />
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
    <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: color ?? tint }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
