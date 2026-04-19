import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { regionLabel, intensityColor } from "@/lib/painTaxonomy";
import { Sparkles, Printer, Copy, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Log = {
  logged_at: string;
  region: string;
  side: string | null;
  pain_type: string;
  intensity: number;
  trigger: string | null;
  note: string | null;
};

type AIReport = {
  chief_complaint: string;
  summary_paragraph: string;
  pattern_callouts: string[];
  red_flags: string[];
  questions: string[];
};

const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
] as const;

export default function Report() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [logs, setLogs] = useState<Log[]>([]);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState<string>("unspecified");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("condition")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.condition) setCondition(data.condition);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const since = subDays(new Date(), range).toISOString();
    supabase
      .from("pain_logs")
      .select("logged_at, region, side, pain_type, intensity, trigger, note")
      .gte("logged_at", since)
      .order("logged_at", { ascending: true })
      .then(({ data }) => setLogs(data ?? []));
    setReport(null);
  }, [user, range]);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    const avg = logs.reduce((s, l) => s + l.intensity, 0) / logs.length;
    const peak = Math.max(...logs.map((l) => l.intensity));
    const counts: Record<string, number> = {};
    logs.forEach((l) => (counts[l.region] = (counts[l.region] ?? 0) + 1));
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      count: logs.length,
      avg: Math.round(avg * 10) / 10,
      peak,
      topRegions: ranked.slice(0, 3).map(([k, n]) => ({ region: k, n })),
    };
  }, [logs]);

  const generate = async () => {
    if (!logs.length) {
      toast.info("Log a few entries first to generate a report.");
      return;
    }
    setLoading(true);
    setReport(null);
    const { data, error } = await supabase.functions.invoke("generate-report", {
      body: {
        condition,
        range_days: range,
        logs: logs.map((l) => ({
          at: l.logged_at,
          region: l.region,
          side: l.side,
          type: l.pain_type,
          intensity: l.intensity,
          trigger: l.trigger,
          note: l.note,
        })),
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't generate report", { description: error.message });
      return;
    }
    if (data?.error) {
      toast.error(data.error);
      return;
    }
    setReport(data as AIReport);
  };

  const printPdf = () => {
    window.print();
  };

  const copyAll = (items: string[]) => {
    navigator.clipboard.writeText(items.map((s) => `• ${s}`).join("\n"));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A clinical summary plus a list of questions to bring to your appointment.
        </p>
      </header>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              "flex-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold transition-colors",
              range === r.value && "border-primary bg-primary-soft text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Button
        onClick={generate}
        disabled={loading || logs.length === 0}
        className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            {report ? "Regenerate" : "Generate report"}
          </>
        )}
      </Button>

      {logs.length === 0 && (
        <div className="pp-card text-center text-sm text-muted-foreground">
          No logs in this range yet. Log pain a few times, then come back here.
        </div>
      )}

      {report && (
        <div ref={printRef} className="space-y-4 print:space-y-3">
          <div className="pp-card print:border print:shadow-none">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Chief complaint
            </div>
            <div className="mt-1 text-lg font-semibold">{report.chief_complaint}</div>
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1">
              <TabsTrigger value="summary" className="rounded-full">
                Summary
              </TabsTrigger>
              <TabsTrigger value="questions" className="rounded-full">
                Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-4">
              {stats && (
                <div className="pp-card">
                  <div className="grid grid-cols-3 gap-3">
                    <Mini label="Logs" value={stats.count.toString()} />
                    <Mini
                      label="Avg"
                      value={`${stats.avg}/10`}
                      color={intensityColor(stats.avg)}
                    />
                    <Mini
                      label="Peak"
                      value={`${stats.peak}/10`}
                      color={intensityColor(stats.peak)}
                    />
                  </div>
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Top regions
                    </div>
                    <ul className="mt-1 text-sm">
                      {stats.topRegions.map((r) => (
                        <li key={r.region}>
                          {regionLabel(r.region)} <span className="text-muted-foreground">· {r.n}×</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {report.red_flags.length > 0 && (
                <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Red flags to surface
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {report.red_flags.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pp-card">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Clinical summary
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {report.summary_paragraph}
                </p>
              </div>

              {report.pattern_callouts.length > 0 && (
                <div className="pp-card">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Patterns
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {report.pattern_callouts.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="questions" className="mt-4 space-y-3">
              <div className="pp-card">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Bring to your appointment
                  </div>
                  <button
                    onClick={() => copyAll(report.questions)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy all
                  </button>
                </div>
                <ol className="space-y-3 text-sm leading-relaxed">
                  {report.questions.map((q, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={printPdf}
              className="h-11 flex-1 rounded-full"
            >
              <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
