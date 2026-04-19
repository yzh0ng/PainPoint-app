import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Activity, MessageSquareHeart, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-6 pt-8">
          <nav className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-warm text-primary-foreground shadow-soft">
                <Heart className="h-4 w-4" fill="currentColor" />
              </span>
              PainPoint
            </div>
            <Link
              to="/auth"
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold hover:border-primary/40"
            >
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for patients, understood by doctors
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Track pain in <span className="text-primary">10 seconds.</span>
            <br className="hidden sm:block" /> Walk into appointments ready.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
            Tap the body. Pick a type. Move a slider. PainPoint turns months of nuance into a
            clinical summary your doctor can read in 20 seconds — and the questions you should
            actually ask.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-gradient-warm px-8 text-base font-semibold shadow-glow"
            >
              <Link to="/auth">Start tracking — free</Link>
            </Button>
            <Link
              to="/auth"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Already a member? Sign in →
            </Link>
          </div>
        </div>
      </header>

      {/* Three innovations */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            Icon={Activity}
            title="Zero-friction capture"
            body="Built for people in pain who don't want to fill out a form. Tap, slide, save — under 15 seconds."
          />
          <Feature
            Icon={Heart}
            title="A summary that reads clinically"
            body="Not a data dump. A structured brief your provider can scan in 20 seconds: timeline, patterns, red flags."
          />
          <Feature
            Icon={MessageSquareHeart}
            title="Questions that advocate for you"
            body="Specific prompts based on what you logged — not a generic checklist. Copy or share with one tap."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Pain is subjective. Your data shouldn't be.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Patients get a 15-minute appointment every six weeks and are asked to describe months
            of experience on a 1-to-10 scale. Critical patterns get lost. PainPoint captures them
            while they're fresh — and hands them back when you need them most.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <Step n={1} title="Log it" body="A daily nudge. One tap from the notification." />
            <Step n={2} title="See the pattern" body="Trends, triggers, what's responding to meds." />
            <Step n={3} title="Show your doctor" body="Print, save PDF, or share before the appointment." />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-10 text-center text-xs text-muted-foreground">
        PainPoint · Track better. Talk better. Be heard.
      </footer>
    </div>
  );
}

function Feature({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="pp-card">
      <span className="mb-3 inline-grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-warm text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
