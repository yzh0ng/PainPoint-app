import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Browser-side daily reminder using setTimeout + Notification API.
 * Fires once per day at the user's chosen reminder_time while the app is open.
 */
export function useReminders() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const timerRef = useRef<number | null>(null);

  const request = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;

    let cancelled = false;

    const schedule = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("reminder_time, reminders_enabled, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.reminders_enabled || !data.reminder_time) return;
      if (Notification.permission !== "granted") return;

      const [hh, mm] = (data.reminder_time as string).split(":").map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hh ?? 20, mm ?? 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const delay = target.getTime() - now.getTime();

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        try {
          new Notification("How's the pain right now?", {
            body: "A 15-second log keeps the picture honest.",
            icon: "/favicon.ico",
            tag: "painpoint-daily",
          });
        } catch (e) {
          console.error(e);
        }
        // Reschedule for next day
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [user, permission]);

  return { permission, request };
}
