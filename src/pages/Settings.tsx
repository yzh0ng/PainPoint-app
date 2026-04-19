import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CONDITIONS } from "@/lib/painTaxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogOut, Bell, BellOff } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<string>("unspecified");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const { permission, request } = useReminders();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, condition, reminder_time, reminders_enabled")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName(data.display_name ?? "");
        setCondition(data.condition ?? "unspecified");
        setReminderTime((data.reminder_time as string)?.slice(0, 5) ?? "20:00");
        setRemindersEnabled(data.reminders_enabled ?? true);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        condition: condition as never,
        reminder_time: reminderTime,
        reminders_enabled: remindersEnabled,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <section className="pp-card space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Profile</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="h-12 rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Primary condition</Label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="h-12 w-full rounded-2xl border border-input bg-background px-3 text-sm"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="pp-card space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Daily reminder</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Send a daily nudge</div>
            <div className="text-xs text-muted-foreground">One gentle prompt at your time.</div>
          </div>
          <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            disabled={!remindersEnabled}
            className="h-12 rounded-2xl text-lg"
          />
        </div>

        {remindersEnabled && permission !== "granted" && (
          <button
            onClick={request}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary"
          >
            <Bell className="h-4 w-4" /> Allow browser notifications
          </button>
        )}
        {remindersEnabled && permission === "denied" && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BellOff className="h-3.5 w-3.5" /> Notifications blocked. Enable them in your browser
            site settings.
          </p>
        )}
      </section>

      <Button
        onClick={save}
        disabled={saving}
        className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
      >
        {saving ? "Saving…" : "Save changes"}
      </Button>

      <button
        onClick={handleSignOut}
        className="mx-auto mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
