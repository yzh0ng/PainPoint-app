import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BodyDiagram } from "@/components/BodyDiagram";
import { IntensitySlider } from "@/components/IntensitySlider";
import { PAIN_TYPES, TRIGGERS, regionLabel } from "@/lib/painTaxonomy";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
};

type Step = 0 | 1 | 2 | 3;

export function LogSheet({ open, onOpenChange, onLogged }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [region, setRegion] = useState<string | null>(null);
  const [painType, setPainType] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(4);
  const [trigger, setTrigger] = useState<string>("none");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setRegion(null);
      setPainType(null);
      setIntensity(4);
      setTrigger("none");
      setNote("");
    }
  }, [open]);

  const next = () => setStep((s) => (Math.min(3, s + 1) as Step));
  const back = () => setStep((s) => (Math.max(0, s - 1) as Step));

  const handleRegion = (id: string) => {
    setRegion(id);
    setTimeout(next, 120);
  };

  const handleType = (t: string) => {
    setPainType(t);
    setTimeout(next, 120);
  };

  const save = async () => {
    if (!user || !region || !painType) return;
    setSaving(true);
    const sideMatch = region.startsWith("left_") ? "left" : region.startsWith("right_") ? "right" : "center";
    const { error } = await supabase.from("pain_logs").insert({
      user_id: user.id,
      region,
      side: sideMatch,
      pain_type: painType as never,
      intensity,
      trigger: (trigger || null) as never,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    if (navigator.vibrate) navigator.vibrate(15);
    toast.success("Logged", { description: `${regionLabel(region)} · ${intensity}/10` });
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl border-t-0 p-0"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="flex-row items-center justify-between border-b border-border/60 px-5 py-4">
            {step > 0 ? (
              <button
                onClick={back}
                className="-ml-2 inline-flex items-center gap-1 rounded-full p-2 text-sm text-muted-foreground hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div className="w-10" />
            )}
            <SheetTitle className="text-base font-semibold">
              {["Where does it hurt?", "What does it feel like?", "How intense?", "Anything else?"][step]}
            </SheetTitle>
            <div className="flex items-center gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i <= step ? "w-5 bg-primary" : "w-2 bg-border"
                  )}
                />
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            {step === 0 && (
              <div className="animate-fade-in">
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Tap a region on the body
                </p>
                <BodyDiagram selected={region} onSelect={handleRegion} />
                {region && (
                  <p className="mt-4 text-center text-sm font-medium">
                    Selected: <span className="text-primary">{regionLabel(region)}</span>
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="grid animate-fade-in grid-cols-2 gap-3">
                {PAIN_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleType(t.value)}
                    className={cn(
                      "rounded-2xl border border-border bg-card px-4 py-5 text-left text-sm font-medium shadow-soft transition-all hover:border-primary/40",
                      painType === t.value && "border-primary bg-primary-soft text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-8 pt-4">
                <IntensitySlider value={intensity} onChange={setIntensity} />
                <div className="text-center text-xs text-muted-foreground">
                  Region: <span className="text-foreground">{region && regionLabel(region)}</span>
                  {" · "}
                  Type: <span className="text-foreground">{painType}</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-muted-foreground">
                    Trigger (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTrigger(t.value)}
                        className={cn(
                          "rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium transition-all",
                          trigger === t.value && "border-primary bg-primary-soft text-foreground"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="note" className="mb-2 block text-sm font-medium text-muted-foreground">
                    Note (optional)
                  </label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Started after sitting at desk"
                    maxLength={400}
                    rows={3}
                    className="rounded-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/60 bg-card/80 px-5 py-4 backdrop-blur safe-bottom">
            {step < 3 ? (
              <Button
                onClick={next}
                disabled={(step === 0 && !region) || (step === 1 && !painType)}
                className="h-12 w-full rounded-full text-base font-semibold"
                size="lg"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={save}
                disabled={saving}
                className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold text-primary-foreground shadow-glow hover:opacity-95"
                size="lg"
              >
                <Check className="mr-2 h-5 w-5" />
                {saving ? "Saving…" : "Save log"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
