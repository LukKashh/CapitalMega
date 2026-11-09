/* eslint-disable prettier/prettier -- JSX layout is kept compact in this existing dialog. */
import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Code2,
  Globe,
  Monitor,
  ShieldCheck,
  UserRound,
  Users,
  RefreshCw,
  Wallet,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { auth, getCurrentUser } from "@/lib/local-auth";
import { db, collection, doc, getDoc, getDocs, runTransaction, setDoc } from "@/lib/local-firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EMPTY_MODS } from "@/game/config";
import { gainXp, netWorth, personalMods, xpForLevel, type Ctx } from "@/game/engine";
import type { PlayerState } from "@/game/types";

export async function checkDeveloperAccess(): Promise<boolean> {
  return !!(await getCurrentUser());
}

type DeveloperToolsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PlayerRecord = {
  uid: string;
  username: string;
  level: number;
  xp: number;
  cash: number;
  version: number;
  state: PlayerState;
};

type AdjustmentKind = "set-balance" | "add-balance" | "subtract-balance" | "grant-xp" | "set-xp" | "set-level";
const MAX_ADJUSTMENT = 1_000_000_000_000_000;

const fieldClass =
  "h-10 w-full rounded-lg border border-white/10 bg-[#0b0e17] px-3 text-sm text-white outline-none transition focus:border-violet-400/60";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

function readPlayer(uid: string, data: Record<string, unknown>): PlayerRecord {
  const state = data.state as PlayerState;
  if (!state || typeof state !== "object") throw new Error("Player save has no valid state.");
  return {
    uid,
    username: String(data.username ?? state.username ?? "Unknown player"),
    level: Number(state.level ?? data.level ?? 1),
    xp: Number(state.xp ?? 0),
    cash: Number(state.cash ?? 0),
    version: Number(data.version ?? 0),
    state,
  };
}

export function DeveloperToolsDialog({ open, onOpenChange }: DeveloperToolsDialogProps) {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [viewport, setViewport] = useState("—");
  const [lookup, setLookup] = useState("");
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [kind, setKind] = useState<AdjustmentKind>("set-balance");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!open) {
      setLookup("");
      setPlayer(null);
      setPlayers([]);
      setConfirmOpen(false);
      setAmount("");
      setNotice("");
      setError("");
    }
  }, [open]);

  async function loadPlayers() {
    setPlayersLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "player_states"));
      const records = snapshot.docs.map((item) => readPlayer(item.id, item.data() as Record<string, unknown>)).sort((a, b) => a.username.localeCompare(b.username));
      setPlayers(records);
      if (player) {
        const refreshed = records.find((record) => record.uid === player.uid);
        if (refreshed) setPlayer(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load registered players.");
    } finally { setPlayersLoading(false); }
  }

  useEffect(() => {
    if (open) void loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const diagnostics = [
    {
      label: "Authentication",
      value: user ? "Authenticated" : "No active user",
      detail: user?.isAnonymous ? "Local player identity" : "On-device local profile",
      icon: ShieldCheck,
      ok: !!user,
    },
    {
      label: "Network",
      value: online ? "Online" : "Offline",
      detail: online ? "Browser reports an active connection" : "Browser reports no network connection",
      icon: online ? Wifi : WifiOff,
      ok: online,
    },
    {
      label: "Runtime",
      value: typeof window === "undefined" ? "Server" : "Browser",
      detail: typeof window === "undefined" ? "Server rendering context" : "Client-side application runtime",
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

  async function applyAdjustment(confirmed = false) {
    if (!player || !user) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_ADJUSTMENT) {
      setError("Enter a valid non-negative number within the supported limit.");
      return;
    }
    if ((kind === "add-balance" || kind === "subtract-balance" || kind === "grant-xp") && parsed <= 0) {
      setError("This operation requires an amount greater than zero.");
      return;
    }
    if (kind === "set-xp" && parsed >= xpForLevel(player.level)) {
      setError(`Current-level XP must be below ${xpForLevel(player.level).toLocaleString()}.`);
      return;
    }
    if (kind === "set-level" && (parsed < 1 || parsed > 100)) {
      setError("Enter a valid player level between 1 and 100.");
      return;
    }

    const operationLabels: Record<AdjustmentKind, string> = {
      "set-balance": "Set wallet balance",
      "add-balance": "Add wallet balance",
      "subtract-balance": "Subtract wallet balance",
      "grant-xp": "Grant XP through progression",
      "set-xp": "Set current-level XP progress",
      "set-level": "Set player level",
    };
    if (!confirmed) {
      setConfirmOpen(true);
      return;
    }
    setConfirmOpen(false);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const playerRef = doc(db, "player_states", player.uid);
      const auditRef = doc(db, "admin_audit", crypto.randomUUID());
      const now = Date.now();
      const result = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(playerRef);
        if (!snapshot.exists()) throw new Error("Player save no longer exists.");
        const row = snapshot.data();
        const currentVersion = Number(row.version ?? 0);
        if (currentVersion !== player.version) {
          throw new Error("Player data changed since lookup. Search for the player again before applying an adjustment.");
        }
        const current = row.state as PlayerState;
        if (!current || typeof current !== "object") throw new Error("Player save has no valid state.");
        const state = JSON.parse(JSON.stringify(current)) as PlayerState;
        const before = kind.includes("balance")
          ? Number(state.cash ?? 0)
          : kind === "set-level"
            ? Number(state.level ?? 1)
            : Number(state.xp ?? 0);
        let after = before;

        if (kind === "set-balance") after = parsed;
        if (kind === "add-balance") after = before + parsed;
        if (kind === "subtract-balance") after = before - parsed;
        if (kind === "grant-xp") {
          const ctx: Ctx = {
            s: state,
            now,
            ledger: [],
            stock: [],
            corpMods: EMPTY_MODS,
          };
          gainXp(ctx, parsed, personalMods(state));
          after = state.xp;
        }
        if (kind === "set-xp") {
          state.xp = parsed;
          after = parsed;
        }
        if (kind === "set-level") {
          const targetLevel = Math.max(1, Math.min(100, Math.floor(parsed)));
          state.level = targetLevel;
          state.xp = 0;
          after = targetLevel;
        }
        if (!Number.isFinite(after) || after < 0 || after > MAX_ADJUSTMENT) {
          throw new Error("The resulting value is outside the supported range.");
        }
        if (kind === "set-balance" || kind === "add-balance" || kind === "subtract-balance") {
          state.cash = after;
        }
        if (kind === "grant-xp" || kind === "set-xp" || kind === "set-level") {
          if (!Number.isFinite(state.level) || state.level < 1) throw new Error("Player level is invalid.");
        }

        const calculated = netWorth(state, now);
        const version = currentVersion + 1;
        const targetUsername = String(state.username || (row as { username?: string }).username || player.username || "Player").slice(0, 32);
        const previousLevel = Number(current.level ?? (row as { level?: number }).level ?? player.level ?? 1);
        const resultingLevel = Number(state.level ?? 1);
        const previousValue = Number(before ?? 0);
        const resultingValue = Number(after ?? 0);
        const enteredAmount = Number(parsed);
        const actorEmail = user.email ? String(user.email).toLowerCase() : "local-admin@capitalfortune.local";

        transaction.set(playerRef, {
          ...row,
          userId: player.uid,
          username: targetUsername,
          level: state.level || 1,
          netWorth: Math.max(0, Math.round(calculated.total)),
          liquid: state.cash + state.reservedCash,
          title: state.profile?.title || "Aspiring Tycoon",
          avatar: state.profile?.avatar || "briefcase",
          corpTag: (row as { corpTag?: string | null }).corpTag ?? null,
          version,
          state,
          updatedAt: now,
        });
        transaction.set(auditRef, {
          actorUid: user.uid,
          actorEmail,
          targetUid: player.uid,
          targetUsername,
          operation: kind,
          enteredAmount,
          previousValue,
          resultingValue,
          previousLevel,
          resultingLevel,
          createdAt: now,
        });
        return { state, version, calculatedTotal: calculated.total, after };
      });
      setPlayer({
        uid: player.uid,
        username: result.state.username,
        level: result.state.level,
        xp: result.state.xp,
        cash: result.state.cash,
        version: result.version,
        state: result.state,
      });
      setPlayers((currentPlayers) => currentPlayers.map((entry) => entry.uid === player.uid ? {
        uid: player.uid,
        username: result.state.username,
        level: result.state.level,
        xp: result.state.xp,
        cash: result.state.cash,
        version: result.version,
        state: result.state,
      } : entry));
      setAmount("");
      setNotice(`${operationLabels[kind]} completed. New wallet: ${result.state.cash.toLocaleString()} · Level ${result.state.level} · XP ${result.state.xp.toLocaleString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The adjustment could not be applied.");
    } finally {
      setBusy(false);
    }
  }

  const balanceOperation = kind.includes("balance");
  const xpOperation = kind === "grant-xp" || kind === "set-xp";
  const levelOperation = kind === "set-level";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="developer-tools-dialog w-[calc(100vw-1rem)] max-w-3xl max-h-[92dvh] overflow-y-auto border-white/10 bg-[#10131d] p-0 text-white">
        <div className="border-b border-white/10 bg-gradient-to-br from-violet-500/15 via-slate-900 to-cyan-500/10 p-5 sm:p-7">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <Code2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">Developer Console</DialogTitle>
            <DialogDescription className="text-slate-400">
              Device-local development workspace. Adjustments affect only the save stored on this installation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Local save access
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">Diagnostics + player data controls</span>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Activity className="h-4 w-4 text-violet-300" /> System diagnostics
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {diagnostics.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{item.label}</span>
                    <item.icon className={`h-4 w-4 ${item.ok ? "text-emerald-300" : "text-amber-300"}`} />
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-violet-400/20 bg-violet-400/[0.045] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Wallet className="h-4 w-4 text-violet-300" /> Player Data Controls
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Development-only adjustments to a player's wallet balance and progression. Every applied change is recorded in the administrator audit log.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"><Users className="h-4 w-4 text-violet-300" /> Local players <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{players.length}</span></div>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadPlayers()} disabled={playersLoading || busy} className="h-8 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh</Button>
              </div>
              <input className={fieldClass} value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Filter by username or Local Device ID" aria-label="Filter local players" />
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
                {playersLoading && <p className="p-3 text-center text-xs text-slate-400">Loading local players…</p>}
                {!playersLoading && players.length === 0 && <p className="p-3 text-center text-xs text-slate-400">No local player saves found.</p>}
                {!playersLoading && players.filter((entry) => !lookup.trim() || entry.username.toLowerCase().includes(lookup.trim().toLowerCase()) || entry.uid.toLowerCase().includes(lookup.trim().toLowerCase())).map((entry) => (
                  <button key={entry.uid} type="button" onClick={() => { setPlayer(entry); setAmount(""); setNotice(""); setError(""); }} className={"w-full rounded-lg border p-3 text-left transition-colors " + (player?.uid === entry.uid ? "border-violet-400/60 bg-violet-400/10" : "border-white/5 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]")}>
                    <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-white">{entry.username}</span><span className="shrink-0 text-xs text-slate-300">LV {entry.level}</span></div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400"><span>Wallet: {entry.cash.toLocaleString()}</span><span>XP: {entry.xp.toLocaleString()}</span></div>
                    <div className="mt-1 break-all font-mono text-[10px] text-slate-500">{entry.uid}</div>
                  </button>
                ))}
                {!playersLoading && players.length > 0 && players.filter((entry) => !lookup.trim() || entry.username.toLowerCase().includes(lookup.trim().toLowerCase()) || entry.uid.toLowerCase().includes(lookup.trim().toLowerCase())).length === 0 && <p className="p-3 text-center text-xs text-slate-400">No users match this filter.</p>}
              </div>
            </div>

            {player && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
                  <div><div className="text-[11px] uppercase tracking-wide text-slate-500">Username</div><div className="mt-1 font-semibold text-white">{player.username}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wide text-slate-500">Local Device ID</div><div className="mt-1 break-all font-mono text-xs text-slate-300">{player.uid}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wide text-slate-500">Wallet balance</div><div className="mt-1 font-semibold text-emerald-300">{player.cash.toLocaleString()}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wide text-slate-500">Player level</div><div className="mt-1 font-semibold text-white">{player.level}</div></div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between text-xs text-slate-400"><span>Current-level XP</span><span>{player.xp.toLocaleString()} / {xpForLevel(player.level).toLocaleString()}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.min(100, (player.xp / xpForLevel(player.level)) * 100)}%` }} /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
                  <div>
                    <label className={labelClass} htmlFor="admin-adjustment-kind">Adjustment</label>
                    <select id="admin-adjustment-kind" className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as AdjustmentKind)}>
                      <optgroup label="Wallet balance">
                        <option value="set-balance">Set balance</option>
                        <option value="add-balance">Add balance</option>
                        <option value="subtract-balance">Subtract balance</option>
                      </optgroup>
                      <optgroup label="Player XP & Level">
                        <option value="grant-xp">Grant XP (normal progression)</option>
                        <option value="set-xp">Set current-level XP progress</option>
                        <option value="set-level">Set player level</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="admin-adjustment-amount">{kind === "set-xp" ? "Current-level XP" : levelOperation ? "Target player level (1-100)" : balanceOperation ? "Cash amount" : "XP amount"}</label>
                    <input id="admin-adjustment-amount" className={fieldClass} type="number" min="0" max={MAX_ADJUSTMENT} step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
                  </div>
                </div>
                {kind === "grant-xp" && <p className="text-xs text-slate-500">Uses the existing XP multiplier, level-up, notification and level-reward progression logic.</p>}
                {kind === "set-xp" && <p className="text-xs text-slate-500">Sets progress within the current level only; it cannot trigger a level-up.</p>}
                {kind === "set-level" && <p className="text-xs text-slate-500">Directly sets the player's level and resets current-level XP progress to 0.</p>}
                {balanceOperation && <p className="text-xs text-slate-500">Only the player's wallet cash is changed. Bank deposits, loans and corporation funds remain untouched.</p>}
                {xpOperation && <p className="text-xs text-slate-500">Direct XP adjustments do not create a wallet adjustment entry in the normal financial ledger.</p>}
                <Button type="button" onClick={() => void applyAdjustment(false)} disabled={busy || amount.trim() === ""} className="w-full bg-violet-600 text-white hover:bg-violet-500">
                  <Zap className="mr-2 h-4 w-4" /> {busy ? "Applying…" : "Review and apply adjustment"}
                </Button>
              </div>
            )}
            {notice && <p role="status" className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">{notice}</p>}
            {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <UserRound className="h-4 w-4 text-violet-300" /> Current local profile
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 break-all text-slate-200">{user?.email ?? "Unavailable"}</dd></div>
              <div><dt className="text-xs text-slate-500">Email verification</dt><dd className="mt-1 text-slate-200">{user?.emailVerified ? "Verified" : "Not verified / unavailable"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Local Device ID</dt><dd className="mt-1 break-all font-mono text-xs text-slate-300">{user?.uid ?? "Unavailable"}</dd></div>
            </dl>
          </section>

          <p className="text-xs leading-relaxed text-slate-500">
            Adjustments use local database transactions, reject stale player versions, and create a local audit record. This console is not a server-secured administrator system.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/15 bg-white/5 text-white hover:bg-white/10">Close console</Button>
          </div>
        </div>
      </DialogContent>
      <AlertDialog open={confirmOpen} onOpenChange={(next) => { if (!busy) setConfirmOpen(next); }}>
        <AlertDialogContent className="border-white/10 bg-[#151927] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm player data adjustment</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">Review the exact change before applying it. This updates the selected player save immediately and records an administrator audit entry.</AlertDialogDescription>
          </AlertDialogHeader>
          {player && (
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-400">Player</span><span className="text-right font-semibold text-white">{player.username}</span></div>
              <div className="break-all text-right font-mono text-[10px] text-slate-500">{player.uid}</div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Operation</span><span className="text-right text-white">{kind === "set-balance" ? "Set wallet balance" : kind === "add-balance" ? "Add wallet balance" : kind === "subtract-balance" ? "Subtract wallet balance" : kind === "grant-xp" ? "Grant XP" : kind === "set-level" ? "Set player level" : "Set current-level XP"}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Entered amount</span><span className="font-semibold text-white">{Number(amount).toLocaleString()}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Current wallet</span><span className="text-white">{player.cash.toLocaleString()}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Current level / XP</span><span className="text-white">LV {player.level} · {player.xp.toLocaleString()} XP</span></div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy} className="border-white/15 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void applyAdjustment(true); }} className="bg-violet-600 text-white hover:bg-violet-500">{busy ? "Applying…" : "Confirm & Apply"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
