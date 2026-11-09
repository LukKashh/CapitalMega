import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BALANCE } from "@/game/config";
import { toast } from "sonner";
import { gameAction, getGame } from "@/lib/game.functions";
import type { Action } from "@/game/engine";
import type { CorpAction } from "@/game/corp";
import type { CorpState, PlayerState } from "@/game/types";
import type { RANK_PERMS } from "@/game/config";

export type CorpView = CorpState & {
  myRank: string | null;
  myId: string;
  perms: (typeof RANK_PERMS)[keyof typeof RANK_PERMS] | null;
};
export type GameData = { now: number; state: PlayerState; corp: CorpView | null; offset: number };

export const GAME_KEY = ["game"] as const;

export function useGame() {
  return useQuery({
    queryKey: GAME_KEY,
    queryFn: async (): Promise<GameData> => {
      const r = await getGame();
      if (!r.ok) throw new Error(r.error);
      return {
        now: r.now,
        state: r.state,
        corp: r.corp as CorpView | null,
        offset: r.now - Date.now(),
      };
    },
    // Simulation is elapsed-time based; polling every 20s caused repeated
    // full-state transactions without a corresponding UI need.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });
}

/** Server time estimate, ticking every second. */
export function useNow(offset = 0, interval = 1000) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const id = setInterval(() => setNow(Date.now() + offset), interval);
    return () => clearInterval(id);
  }, [offset, interval]);
  return now;
}

export function useAct() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (vars: {
      action: Action | CorpAction;
      key: string;
      success?: string;
      silent?: boolean;
    }) => {
      const r = await gameAction({ data: { key: vars.key, action: vars.action } });
      if (!r.ok) throw new Error(r.error);
      return { r, vars };
    },
    onSuccess: ({ r, vars }) => {
      const prev = qc.getQueryData<GameData>(GAME_KEY);
      const duplicate = "duplicate" in r && r.duplicate;
      qc.setQueryData<GameData>(GAME_KEY, {
        now: r.now,
        state: r.state,
        corp: duplicate ? (prev?.corp ?? null) : ((r.corp as CorpView | null) ?? null),
        offset: r.now - Date.now(),
      });
      notifyNew(prev?.state, r.state);
      if (vars.success) toast.success(vars.success);
    },
    onError: (e, vars) => {
      if (!vars.silent) toast.error(e instanceof Error ? e.message : "Action failed");
    },
  });
  const run = useCallback(
    (action: Action | CorpAction, success?: string) =>
      m
        .mutateAsync({
          action,
          key: crypto.randomUUID(),
          ...(success ? { success } : {}),
        })
        .catch(() => undefined),
    [m],
  );
  return {
    run,
    pending: m.isPending,
    mutateSilent: (action: Action | CorpAction) =>
      m.mutateAsync({ action, key: crypto.randomUUID(), silent: true }),
  };
}

function notifyNew(prev: PlayerState | undefined, next: PlayerState) {
  if (!prev) return;
  const seen = new Set(prev.notifications.map((n) => n.id));
  for (const n of next.notifications.slice(0, 5).reverse()) {
    if (seen.has(n.id)) continue;
    if (n.kind === "major") toast(`🏆 ${n.text}`, { duration: 5000, className: "font-semibold" });
    else if (n.kind === "achievement") toast(n.text, { duration: 2500 });
    else if (n.kind === "level") toast(`⬆ ${n.text}`, { duration: 2500 });
    else if (n.kind === "warn") toast.warning(n.text);
  }
}

/** Shared store of taps not yet confirmed by the server (queued + in flight). */
const tapStore = {
  queued: 0,
  inflight: 0,
  retry: null as { count: number; key: string } | null,
  failureNotified: false,
  listeners: new Set<() => void>(),
  emit() {
    for (const l of tapStore.listeners) l();
  },
  subscribe(l: () => void) {
    tapStore.listeners.add(l);
    return () => {
      tapStore.listeners.delete(l);
    };
  },
  total() {
    return (
      tapStore.queued +
      tapStore.inflight +
      (tapStore.inflight === 0 ? (tapStore.retry?.count ?? 0) : 0)
    );
  },
};

/** Number of taps shown optimistically but not yet confirmed by the server. */
export function useUnconfirmedTaps() {
  return useSyncExternalStore(tapStore.subscribe, tapStore.total, () => 0);
}

/** Optimistic per-tap estimate (display only; server stays authoritative). */
export function useOptimisticTaps(data: GameData | undefined, clickValue = 0) {
  const taps = useUnconfirmedTaps();
  return useMemo(() => {
    if (!data || taps === 0) return { taps: 0, cash: 0, xp: 0 };
    return { taps, cash: taps * clickValue, xp: taps * 0.625 };
  }, [data, taps, clickValue]);
}

/** Batches taps and sends them to the server; server validates rate. */
export function useClicker() {
  const qc = useQueryClient();
  const buffer = useUnconfirmedTaps();
  const flushing = useRef(false);
  const flush = useCallback(async () => {
    if (flushing.current || (!tapStore.retry && tapStore.queued === 0)) return;
    flushing.current = true;

    const batch =
      tapStore.retry ??
      ({
        count: tapStore.queued,
        key: crypto.randomUUID(),
      } satisfies { count: number; key: string });
    if (!tapStore.retry) {
      tapStore.queued = 0;
      tapStore.retry = batch;
    }
    tapStore.inflight = batch.count;
    tapStore.emit();

    let committed = false;
    try {
      const r = await gameAction({
        data: { key: batch.key, action: { type: "click", count: batch.count } },
      });
      if (!r.ok) throw new Error(r.error || "Click batch could not be saved");

      const prev = qc.getQueryData<GameData>(GAME_KEY);
      const duplicate = "duplicate" in r && r.duplicate;
      qc.setQueryData<GameData>(GAME_KEY, {
        now: r.now,
        state: r.state,
        corp: duplicate ? (prev?.corp ?? null) : ((r.corp as CorpView | null) ?? null),
        offset: r.now - Date.now(),
      });
      notifyNew(prev?.state, r.state);
      committed = true;
      tapStore.failureNotified = false;
    } catch {
      // Keep the exact same key and count: if the server committed but the
      // response was lost, retrying is safe because the server deduplicates it.
      if (!tapStore.failureNotified) {
        toast.error("Connection issue — pending clicks will be retried");
        tapStore.failureNotified = true;
      }
    } finally {
      if (committed && tapStore.retry?.key === batch.key) tapStore.retry = null;
      flushing.current = false;
      tapStore.inflight = 0;
      tapStore.emit();
      if (committed && tapStore.queued > 0) void flush();
    }
  }, [qc]);
  useEffect(() => {
    const id = setInterval(flush, BALANCE.clicker.syncIntervalMs);
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void flush();
    };
  }, [flush]);
  const tap = useCallback(() => {
    const pendingRetry = tapStore.retry?.count ?? 0;
    if (tapStore.queued + pendingRetry >= 120) return;
    tapStore.queued += 1;
    tapStore.emit();
  }, []);
  return { tap, buffer };
}
