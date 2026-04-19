import { NavLink, Outlet } from "react-router-dom";
import { Home, History as HistoryIcon, FileText, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", label: "Today", Icon: Home, end: true },
  { to: "/app/history", label: "History", Icon: HistoryIcon },
  { to: "/app/report", label: "Report", Icon: FileText },
  { to: "/app/settings", label: "Settings", Icon: SettingsIcon },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-xl px-4 pt-6 pb-28 safe-top">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 border-t border-border/60 bg-card/85 backdrop-blur-xl safe-bottom"
      >
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground transition-colors",
                    isActive && "text-primary"
                  )
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
