import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Code2,
  Globe,
  Monitor,
  ShieldCheck,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ADMIN_EMAILS = new Set([
  "puncisters@gmail.com",
  "lukass16.ivanovs@gmail.com",
  "lukass21.ivanovs@gmail.com",
]);

export async function checkDeveloperAccess(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (user.email && ADMIN_EMAILS.has(user.email.toLowerCase())) return true;
  try {
    const adminRecord = await getDoc(doc(db, "admins", user.uid));
    return adminRecord.exists();
  } catch (error) {
    console.error("Unable to verify developer access:", error);
    return false;
  }
}

type DeveloperToolsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeveloperToolsDialog({ open, onOpenChange }: DeveloperToolsDialogProps) {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [viewport, setViewport] = useState("—");
  const user = auth.currentUser;

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    const syncViewport = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`);
    syncOnline();
    syncViewport();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    window.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const diagnostics = [
    {
      label: "Authentication",
      value: user ? "Authenticated" : "No active user",
      detail: user?.isAnonymous ? "Anonymous guest session" : "Firebase account session",
      icon: ShieldCheck,
      ok: !!user,
    },
    {
      label: "Network",
      value: online ? "Online" : "Offline",
      detail: online
        ? "Browser reports an active connection"
        : "Browser reports no network connection",
      icon: online ? Wifi : WifiOff,
      ok: online,
    },
    {
      label: "Runtime",
      value: typeof window === "undefined" ? "Server" : "Browser",
      detail:
        typeof window === "undefined"
          ? "Server rendering context"
          : "Client-side application runtime",
      icon: Globe,
      ok: true,
    },
    {
      label: "Viewport",
      value: viewport,
      detail: "Current browser viewport dimensions",
      icon: Monitor,
      ok: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="developer-tools-dialog w-[calc(100vw-1rem)] max-w-3xl max-h-[92dvh] overflow-y-auto border-white/10 bg-[#10131d] p-0 text-white">
        <div className="border-b border-white/10 bg-gradient-to-br from-violet-500/15 via-slate-900 to-cyan-500/10 p-5 sm:p-7">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <Code2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
              Developer Console
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Restricted diagnostic workspace for authorized Capitalfortune administrators.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Administrator access
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
              Read-only diagnostics
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Activity className="h-4 w-4 text-violet-300" /> System diagnostics
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {diagnostics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {item.label}
                    </span>
                    <item.icon
                      className={`h-4 w-4 ${item.ok ? "text-emerald-300" : "text-amber-300"}`}
                    />
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <UserRound className="h-4 w-4 text-violet-300" /> Current administrator session
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-slate-200">{user?.email ?? "Unavailable"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email verification</dt>
                <dd className="mt-1 text-slate-200">
                  {user?.emailVerified ? "Verified" : "Not verified / unavailable"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Firebase user ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-300">
                  {user?.uid ?? "Unavailable"}
                </dd>
              </div>
            </dl>
          </section>

          <p className="text-xs leading-relaxed text-slate-500">
            This console currently exposes diagnostics only. It does not modify player saves,
            balances, accounts, or live game data. Authorization is checked against the existing
            Firestore administrator policy; Firestore security rules remain the enforcement
            boundary.
          </p>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Close console
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
