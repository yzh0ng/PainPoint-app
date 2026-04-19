import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CONDITIONS } from "@/lib/painTaxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<string>("unspecified");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
      });
  }, [user]);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        condition: condition as never,
        reminder_time: reminderTime,
        timezone: tz,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("All set");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="mb-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>

        <div className="flex-1">
          {step === 0 && (
            <div className="animate-fade-in space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight">What should we call you?</h1>
              <p className="text-muted-foreground">First name only is fine. Just for hellos.</p>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya"
                  maxLength={60}
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight">What brings you here?</h1>
              <p className="text-muted-foreground">
                We'll tailor the questions you bring to your doctor based on this. Change anytime.
              </p>
              <div className="grid gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCondition(c.value)}
                    className={cn(
                      "rounded-2xl border border-border bg-card px-4 py-4 text-left text-sm font-medium shadow-soft transition-all",
                      condition === c.value && "border-primary bg-primary-soft"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight">When should we nudge you?</h1>
              <p className="text-muted-foreground">
                One gentle reminder a day. Pick a time you're usually still and present.
              </p>
              <div className="space-y-2">
                <Label htmlFor="time">Daily reminder</Label>
                <Input
                  id="time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-12 rounded-2xl text-lg"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={finish}
              disabled={saving}
              className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
            >
              {saving ? "Saving…" : "Finish setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
