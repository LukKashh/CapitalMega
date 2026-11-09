import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { art } from "@/components/game/art";
import { Button } from "@/components/ui/button";
import { auth, onAuthStateChanged } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Capitalfortune — Build Wealth From $0" },
      {
        name: "description",
        content:
          "Start with nothing. Tap, acquire companies, trade stocks and crypto, collect rent and luxury assets, and build a corporation with friends.",
      },
      { property: "og:title", content: "Capitalfortune — Build Wealth From $0" },
      {
        property: "og:description",
        content:
          "A mobile-first wealth and business tycoon game with cloud saves and cooperative corporations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.currentUser) navigate({ to: "/home", replace: true });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate({ to: "/home", replace: true });
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <main className="entry-screen relative flex min-h-[100svh] flex-col overflow-hidden text-white">
      <img src={art("entry-city")} alt="" aria-hidden="true" className="entry-backdrop" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,17,.55)_0%,rgba(5,8,17,.78)_48%,#070b14_100%)]" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
            <TrendingUp className="h-5 w-5" />
          </span>
          <span className="brand-name text-lg">
            Capital<span>fortune</span>
          </span>
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-200 backdrop-blur transition hover:bg-white/10"
        >
          Sign in
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-12 pt-10 sm:px-8 lg:px-10 lg:pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-violet-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Wealth Builder Tycoon
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Start with nothing.
            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              Build something extraordinary.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Shape your financial future, grow your business empire, and build your own path to wealth in
            Capitalfortune.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 flex-1 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 font-semibold shadow-lg shadow-violet-950/40 hover:brightness-110"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 flex-1 rounded-xl border-white/20 bg-white/[0.06] text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth" search={{ mode: "signin" }}>
                Continue your empire
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl">
            <Building2 className="h-5 w-5 text-violet-300" />
            <p className="mt-3 text-sm font-semibold">Build and expand</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Develop your own business empire.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl">
            <ChartNoAxesCombined className="h-5 w-5 text-cyan-300" />
            <p className="mt-3 text-sm font-semibold">Invest and trade</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Explore markets and grow your assets.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl">
            <Users className="h-5 w-5 text-fuchsia-300" />
            <p className="mt-3 text-sm font-semibold">Connect and collaborate</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Build alongside others through corporations.
            </p>
          </div>
        </div>
        <div className="mt-7 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure sign-in · Cloud-saved progression
        </div>
      </div>
    </main>
  );
}
