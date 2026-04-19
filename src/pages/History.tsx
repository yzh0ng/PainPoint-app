import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { regionLabel, intensityColor } from "@/lib/painTaxonomy";
import { format, subDays, startOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type Log = {
  id: string;
  logged_at: string;
  region: string;
  pain_type: string;
  intensity: number;
  trigger: string | null;
  note: string | null;
};

const RANGES = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
] as const;

export default function History() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [logs, setLogs] = useState<Log[]>([]);

  const load = async () => {
    if (!user) return;
    const since = subDays(new Date(), range).toISOString();
    const { data } = await supabase
      .from("pain_logs")
      .select("id, logged_at, region, pain_type, intensity, trigger, note")
      .gte("logged_at", since)
      .order("logged_at", { ascending: false });
    setLogs(data ?? []);
  };

  useEffect(() => {
    load();
  }, [user, range]);

  const series = useMemo(() => {
    const byDay: Record<string, { sum: number; n: number }> = {};
    for (const l of logs) {
      const k = format(startOfDay(new Date(l.logged_at)), "yyyy-MM-dd");
      byDay[k] = byDay[k] ?? { sum: 0, n: 0 };
      byDay[k].sum += l.intensity;
      byDay[k].n += 1;
    }
    const out: { date: string; avg: number | null }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
      const b = byDay[d];
      out.push({ date: d, avg: b ? Math.round((b.sum / b.n) * 10) / 10 : null });
    }
    return out;
  }, [logs, range]);

  const grouped = useMemo(() => {
    const m: Record<string, Log[]> = {};
    for (const l of logs) {
      const k = format(new Date(l.logged_at), "yyyy-MM-dd");
      m[k] = m[k] ?? [];
      m[k].push(l);
    }
    return Object.entries(m).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [logs]);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    const avg = logs.reduce((s, l) => s + l.intensity, 0) / logs.length;
    const counts: Record<string, number> = {};
    logs.forEach((l) => (counts[l.region] = (counts[l.region] ?? 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { count: logs.length, avg: Math.round(avg * 10) / 10, topRegion: top?.[0] };
  }, [logs]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("pain_logs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                range === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Logs" value={stats.count.toString()} />
          <Stat label="Avg intensity" value={stats.avg.toString()} suffix="/10" color={intensityColor(stats.avg)} />
          <Stat label="Top region" value={stats.topRegion ? regionLabel(stats.topRegion) : "—"} small />
        </div>
      )}

      <section className="pp-card">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Average intensity</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(new Date(v), range === 7 ? "EEE" : "MMM d")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(v) => format(new Date(v as string), "EEE, MMM d")}
                formatter={(v: number | null) => (v === null ? "—" : `${v}/10`)}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {grouped.length === 0 ? (
        <div className="pp-card text-center text-sm text-muted-foreground">
          Nothing logged in this range yet.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <section key={day} className="pp-card">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {format(new Date(day), "EEEE, MMM d")}
              </h3>
              <ul className="divide-y divide-border/60">
                {items.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="mt-0.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: intensityColor(l.intensity) }}
                      >
                        {l.intensity}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium">{regionLabel(l.region)}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {format(new Date(l.logged_at), "h:mm a")} · {l.pain_type}
                          {l.trigger && l.trigger !== "none" ? ` · ${l.trigger}` : ""}
                        </div>
                        {l.note && (
                          <div className="mt-1 text-xs text-foreground/80">{l.note}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(l.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label="Delete log"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  color,
  small,
}: {
  label: string;
  value: string;
  suffix?: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={cn("font-semibold tabular-nums", small ? "text-base" : "text-2xl")}
          style={{ color }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
