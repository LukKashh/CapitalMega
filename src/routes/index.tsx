import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Cloud,
  Crown,
  Download,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ApkUpdater } from "@/lib/apk-updater";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  checkForGameUpdate,
  CURRENT_APP_VERSION,
  type GameUpdateStatus,
} from "@/lib/game-update";

type LaunchPhase = "idle" | "checking" | "update" | "error";
type UpdateDownloadPhase = "idle" | "downloading" | "ready" | "permission" | "installing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Capital Fortune — Build Wealth From $0" },
      {
        name: "description",
        content: "Your empire awaits. Check the client version and connect to Capital Fortune.",
      },
      { property: "og:title", content: "Capital Fortune — Build Wealth From $0" },
      { property: "og:description", content: "Build, invest and rise in Capital Fortune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaunchGateway,
});

function LaunchGateway() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [phase, setPhase] = useState<LaunchPhase>("idle");
  const [update, setUpdate] = useState<GameUpdateStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [updateDownloadPhase, setUpdateDownloadPhase] = useState<UpdateDownloadPhase>("idle");

  // Reading a persisted login is local session discovery only. It never starts
  // a game session or changes the disconnected launch state.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let cleanup: Array<() => Promise<void>> = [];
    void Promise.all([
      ApkUpdater.addListener("downloadStarted", () => setUpdateDownloadPhase("downloading")),
      ApkUpdater.addListener("updateReady", () => setUpdateDownloadPhase("ready")),
      ApkUpdater.addListener("downloadFailed", (event) => {
        setUpdateDownloadPhase("idle");
        setErrorMessage(event.message ?? "The APK download or integrity check failed.");
      }),
    ]).then((handles) => {
      if (!active) handles.forEach((handle) => void handle.remove());
      else cleanup = handles.map((handle) => handle.remove);
    }).catch(() => undefined);
    return () => {
      active = false;
      cleanup.forEach((remove) => void remove());
    };
  }, []);

  async function connect() {
    setPhase("checking");
    setErrorMessage("");
    setUpdate(null);

    try {
      // Public version bootstrap is deliberately first: no auth or game-save
      // request is made until the installed APK passes this check.
      const result = await checkForGameUpdate();
      if (result.updateRequired) {
        setUpdate(result);
        setPhase("update");
        return;
      }

      if (!session) {
        navigate({ to: "/auth", search: { mode: "signin" } });
        return;
      }

      navigate({ to: "/home" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Connection verification failed.");
      setPhase("error");
    }
  }

  async function openUpdateDownload() {
    if (!update) return;
    await Browser.open({ url: update.downloadUrl, presentationStyle: "popover" });
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage("Couldn't sign out. Please try again.");
      return;
    }
    setPhase("idle");
    setUpdate(null);
    setErrorMessage("");
  }

  const mandatoryUpdate = Boolean(update?.updateRequired);

  return (
    <main className="launch-gateway relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-safe pt-safe text-white">
      <div className="launch-gateway-sky" aria-hidden="true" />
      <div className="launch-gateway-vignette" aria-hidden="true" />
      <div className="launch-gateway-particles" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between pt-5">
        <div className="flex items-center gap-2.5">
          <span className="launch-crest"><Crown className="h-5 w-5" /></span>
          <span className="brand-name text-lg tracking-tight">Capital<span>fortune</span></span>
        </div>
        <span className="launch-build-tag">CLIENT v{CURRENT_APP_VERSION}</span>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
        <div className="launch-city-panel">
          <div className="launch-city-halo" />
          <div className="launch-city-grid" />
          <div className="launch-city-skyline" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="launch-city-emblem">
            <div className="launch-emblem-ring"><Crown className="h-10 w-10" /></div>
          </div>
          <div className="relative z-10 px-4 pb-5 text-center">
            <p className="launch-kicker"><Sparkles className="h-3.5 w-3.5" /> BUILD · INVEST · RISE</p>
            <h1 className="launch-title">CAPITAL<br /><span>FORTUNE</span></h1>
            <p className="launch-subtitle">Your empire is waiting.</p>
          </div>
        </div>

        <div className="launch-gateway-card">
          <div className="launch-card-ornament" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="launch-section-label">PLAYER ACCESS</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {session ? "Welcome back, Tycoon" : "Your next chapter awaits"}
              </h2>
            </div>
            <span className="launch-status-seal is-guest" aria-label="Disconnected">
              <Wifi className="h-5 w-5" />
            </span>
          </div>

          <div className="launch-profile-row">
            <div className="launch-profile-icon"><Building2 className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">
                {session?.user.email ?? (authReady ? "No saved profile" : "Checking saved profile…")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {session ? "Saved login detected · Not connected to game servers" : "Sign in after the client passes version verification"}
              </p>
            </div>
            <span className="text-[9px] font-bold tracking-wider text-amber-300">DISCONNECTED</span>
          </div>

          {phase === "checking" && (
            <div className="launch-progress-panel" role="status" aria-live="polite">
              <RefreshCw className="h-4 w-4 animate-spin text-violet-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">Verifying client release</p>
                <p className="text-[10px] text-slate-400">Checking the latest build before authentication…</p>
              </div>
              <span className="launch-progress-shimmer" />
            </div>
          )}

          {phase === "error" && (
            <div className="launch-message launch-error" role="alert">
              <Wifi className="h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {phase === "update" && update && (
            <div className={`launch-message launch-update ${mandatoryUpdate ? "is-required" : ""}`} role="status">
              <Download className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Client update required</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  v{update.currentVersion} → v{update.latestVersion}
                </p>
                {update.releaseNotes && <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{update.releaseNotes}</p>}
                {updateDownloadPhase === "ready" || updateDownloadPhase === "permission" ? (
                  <button type="button" onClick={() => void installDownloadedUpdate()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/20">
                    {updateDownloadPhase === "permission" ? "Continue installation" : "Install verified update"} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button type="button" disabled={updateDownloadPhase === "downloading" || updateDownloadPhase === "installing"} onClick={() => void startUpdateDownload()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 text-xs font-bold text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-60">
                    {updateDownloadPhase === "downloading" ? "Downloading and verifying…" : updateDownloadPhase === "installing" ? "Opening installer…" : "Download latest APK"} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {updateDownloadPhase === "downloading" && <p className="mt-2 text-[10px] text-slate-300">Android is downloading the APK. The checksum will be verified before installation is enabled.</p>}
                {updateDownloadPhase === "permission" && <p className="mt-2 text-[10px] text-slate-300">Allow Capital Fortune to install unknown apps in Android settings, return here, then continue installation.</p>}
                {errorMessage && <p className="mt-2 text-[10px] text-rose-300" role="alert">{errorMessage}</p>}
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  The verified APK is handed to Android Package Installer. You must approve installation; after updating, reopen Capitalfortune and press Connect again.
                </p>
              </div>
            </div>
          )}

          {phase !== "checking" && phase !== "update" && (
            <Button
              type="button"
              disabled={!authReady}
              onClick={() => void connect()}
              className="launch-enter-button mt-5 h-14 w-full rounded-xl text-sm font-extrabold tracking-[.14em] text-white"
            >
              {phase === "error" ? "RETRY CONNECTION CHECK" : "CONNECT"}
              {phase === "error" ? <RefreshCw className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          )}

          {!session && authReady && (
            <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">
              You can sign in or create an account after pressing Connect and passing the version check.
            </p>
          )}

          {session && (
            <button type="button" onClick={() => void signOut()} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-200">
              <LogOut className="h-3.5 w-3.5" /> Switch account / Sign out
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="launch-feature"><ShieldCheck /><span>SECURE ACCESS</span></div>
          <div className="launch-feature"><Cloud /><span>CLOUD SAVES</span></div>
          <div className="launch-feature"><CheckCircle2 /><span>VERSION CHECK</span></div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between pb-4 text-[9px] tracking-[.14em] text-slate-600">
        <span>CAPITAL FORTUNE · TYCOON EDITION</span>
        <span>ALL RIGHTS RESERVED</span>
      </footer>
    </main>
  );
}
