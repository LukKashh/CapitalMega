import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Cloud,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { art } from "@/components/game/art";
import {
  auth as firebaseAuth,
  onAuthStateChanged,
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
} from "@/lib/firebase";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signin" | "signup" } => ({
    ...(s.mode === "signin" || s.mode === "signup" ? { mode: s.mode } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Capitalfortune" },
      {
        name: "description",
        content: "Create your Capitalfortune account or sign in to continue your cloud-saved game.",
      },
      { property: "og:title", content: "Sign in — Capitalfortune" },
      { property: "og:description", content: "Create an account to start your empire from $0." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (firebaseAuth.currentUser) navigate({ to: "/home", replace: true });
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) navigate({ to: "/home", replace: true });
    });
    return () => unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await registerWithEmail(email.trim(), password);
        toast.success("Account created successfully!");
      } else {
        await loginWithEmail(email.trim(), password);
        toast.success("Signed in successfully!");
      }
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      navigate({ to: "/home", replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setBusy(true);
    try {
      if (typeof window !== "undefined") localStorage.setItem("guest_mode", "true");
      await loginAsGuest();
      toast.success("Playing as Guest!");
      navigate({ to: "/home", replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Guest sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const signingUp = mode === "signup";

  return (
    <main className="entry-screen relative flex min-h-[100svh] items-center overflow-x-hidden px-4 py-7 text-white sm:px-6 lg:px-8">
      <img src={art("entry-city")} alt="" aria-hidden="true" className="entry-backdrop" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(5,8,17,.96)_0%,rgba(7,12,25,.88)_48%,rgba(9,13,26,.76)_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.8fr] lg:gap-16">
        <section className="hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Capitalfortune
          </Link>
          <div className="mt-16 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-100">
            <Sparkles className="h-3.5 w-3.5" /> Your next chapter starts here
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
            Build your own
            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              Capitalfortune.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Start with nothing. Make decisions, grow your portfolio, and shape an empire that is
            yours.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <Building2 className="h-5 w-5 text-violet-300" />
              <p className="mt-3 text-sm font-semibold">Build your empire</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Grow your own business portfolio.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <Cloud className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-semibold">Cloud-saved progress</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Return to your game across sessions.
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure sign-in powered by Firebase
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300">
              <ArrowLeft className="h-4 w-4" /> Capitalfortune
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Secure access
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-[#0d1220]/90 p-5 shadow-[0_28px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/30 to-cyan-500/15 text-violet-100">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="brand-name text-lg text-white">
                  Capital<span>fortune</span>
                </div>
                <p className="text-[11px] tracking-wide text-slate-400">WEALTH BUILDER TYCOON</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">
                {signingUp ? "Create an account" : "Your empire awaits"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                {signingUp ? "Start your journey" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {signingUp
                  ? "Create your account and keep your progress safe."
                  : "Sign in to pick up where you left off."}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="secondary"
                type="button"
                onClick={google}
                disabled={busy}
                className="h-12 w-full gap-2 border border-white/10 bg-white text-slate-900 hover:bg-slate-100"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Continue with Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={guest}
                disabled={busy}
                className="h-11 w-full border-white/15 bg-white/[0.035] text-slate-200 hover:bg-white/10"
              >
                Play instantly as Guest
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">
              <div className="h-px flex-1 bg-white/10" /> Or continue with email{" "}
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-black/20 px-4 text-white placeholder:text-slate-600 focus-visible:ring-violet-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw" className="text-xs font-medium text-slate-300">
                  Password
                </Label>
                <Input
                  id="pw"
                  type="password"
                  autoComplete={signingUp ? "new-password" : "current-password"}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-black/20 px-4 text-white placeholder:text-slate-600 focus-visible:ring-violet-400"
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110"
              >
                {busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center">
              <p className="text-sm text-slate-400">
                {signingUp ? "Already have an account?" : "New to Capitalfortune?"}
              </p>
              <Button
                variant="ghost"
                type="button"
                disabled={busy}
                className="h-auto p-0 text-sm font-semibold text-violet-300 hover:bg-transparent hover:text-violet-200"
                onClick={() => setMode(signingUp ? "signin" : "signup")}
              >
                {signingUp ? "Sign in instead" : "Create an account"}
              </Button>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" /> Cloud-saved game
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> Secure authentication
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-500">
            By continuing, you are accessing the Capitalfortune game service.
          </p>
        </section>
      </div>
    </main>
  );
}
