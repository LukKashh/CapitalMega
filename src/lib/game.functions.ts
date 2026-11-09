import { db, handleFirestoreError, OperationType, getCurrentUser } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  runTransaction,
} from "firebase/firestore";
import { apply, newPlayer, tick, gainXp, netWorth, checkAchievements, type Action, type Ctx } from "@/game/engine";
import {
  applyCorp,
  corpMods,
  corpTick,
  reconcileMembership,
  facilityCost,
  type CorpAction,
} from "@/game/corp";
import {
  RANK_PERMS,
  CORP_FACILITIES,
  CORP_DEPARTMENTS,
  CORP_BUSINESSES,
  type Rank,
} from "@/game/config";
import { GameError, type CorpState, type PlayerState } from "@/game/types";

type AnyAction = Action | CorpAction;
const CORP_TYPES = new Set([
  "corpCreate",
  "corpJoin",
  "corpApply",
  "corpAcceptInvite",
  "corpDecideApplication",
  "corpInvite",
  "corpLeave",
  "corpKick",
  "corpSetRank",
  "corpTransferFounder",
  "corpContribute",
  "corpShift",
  "corpFacility",
  "corpDepartment",
  "corpAssignOfficer",
  "corpBuyBusiness",
  "corpSettings",
  "corpDissolve",
]);

async function loadCorp(id: string) {
  const snap = await getDoc(doc(db, "corporations", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  const st = data.state as CorpState;
  if (data.dissolved) st.dissolved = true;
  return { state: st, version: (data.version as number) ?? 0 };
}

function corpView(c: CorpState | null, uid: string) {
  if (!c) return null;
  const me = c.members[uid];
  const perms = me ? RANK_PERMS[me.rank as Rank] : null;
  return {
    ...c,
    log: perms?.viewTreasury ? c.log : c.log.map((l) => ({ t: l.t, text: l.text })),
    myRank: me?.rank ?? null,
    myId: uid,
    perms,
  };
}

function corporationLeaderboardEntry(id: string, c: CorpState): CorpLeaderboardEntry {
  let upgradeSpend = 0;
  for (const [facilityId, level] of Object.entries(c.facilities || {})) {
    for (let i = 0; i < level; i++) upgradeSpend += facilityCost(facilityId, i);
  }
  for (const departmentId of Object.keys(c.departments || {})) {
    const department = CORP_DEPARTMENTS.find((item) => item.id === departmentId);
    if (department) upgradeSpend += department.cost;
  }
  let businessValuation = 0;
  for (const business of Object.values(c.businesses || {})) {
    const definition = CORP_BUSINESSES.find((item) => item.id === business.defId);
    if (definition) {
      upgradeSpend += definition.price;
      businessValuation += definition.price;
    }
  }
  let totalShifts = 0;
  let totalContributions = 0;
  for (const member of Object.values(c.members || {})) {
    totalShifts += member.shifts || 0;
    totalContributions += member.total || 0;
  }
  return {
    id,
    name: c.name || "Corporation",
    tag: c.tag || "CORP",
    level: c.level || 1,
    xp: c.xp || 0,
    activity:
      totalShifts * 10 +
      Math.floor(totalContributions / 1000) +
      (c.completedObjectives?.length || 0) * 50,
    valuation: upgradeSpend + (c.treasury || 0),
    treasury: c.treasury || 0,
    membersCount: Object.keys(c.members || {}).length,
  };
}

/** Secret per-round casino seed: HMAC(server key, user:round). */
async function casinoSeed(uid: string, round: number) {
  const secret = process.env.CASINO_SECRET || "capitalfortune-firebase-prov-sec";
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`casino:${uid}:${round}`)),
  );
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function run(
  uid: string,
  _email: string | undefined,
  action: AnyAction | null,
  _key: string,
) {
  if (action && !/^[A-Za-z0-9_-]{1,128}$/.test(_key)) {
    throw new Error("Invalid action idempotency key");
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const now = Date.now(); // server time is authoritative
    const playerRef = doc(db, "player_states", uid);
    const snap = await getDoc(playerRef);
    const row = snap.exists()
      ? {
          state: snap.data().state as PlayerState,
          version: (snap.data().version as number) ?? 0,
        }
      : null;

    const state: PlayerState = row ? row.state : newPlayer(now, "GuestTycoon");
    const version = row ? row.version : 0;

    let own = state.corp.id ? await loadCorp(state.corp.id) : null;
    reconcileMembership(state, uid, own?.state ?? null, now);
    if (!state.corp.id) own = null;

    // accepted applications
    if (!state.corp.id && state.corp.pending.length) {
      const pendingCorporations = await Promise.all(state.corp.pending.map((pid) => loadCorp(pid)));
      const acceptedIndex = pendingCorporations.findIndex(
        (pc) => !!pc && !pc.state.dissolved && !!pc.state.members[uid],
      );
      if (acceptedIndex >= 0) {
        state.corp.id = state.corp.pending[acceptedIndex]!;
        state.corp.joinedAt = now;
        own = pendingCorporations[acceptedIndex]!;
      }
      state.corp.pending = state.corp.id ? [] : state.corp.pending;
    }

    const ctx: Ctx = {
      s: state,
      now,
      ledger: [],
      stock: [],
      corpMods: corpMods(own?.state ?? null),
    };
    if (action && action.type.startsWith("casino")) {
      ctx.casinoSeed = await casinoSeed(uid, state.casino?.round ?? 0);
    }
    let corpOut: { id: string; version: number; state: CorpState; dissolve: boolean } | null = null;
    if (own) {
      corpTick(own.state, now);
      const pend = own.state.pendingXp[uid];
      if (pend) {
        gainXp(ctx, pend);
        delete own.state.pendingXp[uid];
      }
      corpOut = { id: own.state.id, version: own.version, state: own.state, dissolve: false };
    }

    try {
      tick(ctx);
      if (action && CORP_TYPES.has(action.type)) {
        const a = action as CorpAction;
        let target: { state: CorpState; version: number } | null = own;
        const extra: {
          newId?: string;
          inviteeId?: string;
          inviteeName?: string;
          inviteeFree?: boolean;
        } = {};
        if (a.type === "corpJoin" || a.type === "corpApply" || a.type === "corpAcceptInvite") {
          target = await loadCorp(a.corpId);
          if (!target || target.state.dissolved) throw new GameError("Corporation not found");
        }
        if (a.type === "corpCreate") {
          target = null;
          extra.newId = crypto.randomUUID();
        }
        if (a.type === "corpInvite") {
          const lower = a.username.trim().toLowerCase();
          const uSnap = await getDoc(doc(db, "usernames", lower));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            extra.inviteeId = uData.userId;
            extra.inviteeName = a.username.trim();
          }
        }
        if (a.type === "corpDecideApplication") {
          const apSnap = await getDoc(doc(db, "public_players", a.uid));
          if (apSnap.exists()) {
            const apData = apSnap.data();
            extra.inviteeFree = !apData.corpId;
          }
        }
        const res = applyCorp(ctx, uid, a, target?.state ?? null, extra);
        if (res.corp) {
          corpOut = {
            id: res.corp.id,
            version: res.isNew ? 0 : target!.version,
            state: res.corp,
            dissolve: !!res.dissolve,
          };
        }
        ctx.corpMods = corpMods(state.corp.id && corpOut && !res.dissolve ? corpOut.state : null);
      } else if (action) {
        apply(ctx, action as Action);
      }
      checkAchievements(ctx);
    } catch (e) {
      if (e instanceof GameError) return { ok: false as const, error: e.message };
      throw e;
    }

    // Atomic transaction commit to Firestore. Complete every transaction read
    // before issuing the first write; Firestore rejects read-after-write flows.
    try {
      const commit = await runTransaction(db, async (tx) => {
        const curSnap = await tx.get(playerRef);
        const currentData = curSnap.exists() ? curSnap.data() : null;
        const recentActionKeys = (currentData?.recentActionKeys as string[] | undefined) ?? [];
        if (action && recentActionKeys.includes(_key)) {
          return {
            duplicate: true as const,
            state: (currentData?.state ?? state) as PlayerState,
          };
        }
        if (curSnap.exists()) {
          const curVer = (currentData?.version as number) ?? 0;
          if (curVer !== version) {
            throw new Error("conflict: concurrent state change");
          }
        }

        const usernameLower =
          state.username && state.username !== "GuestTycoon" && state.username !== "Player"
            ? state.username.trim().toLowerCase()
            : null;
        const usernameRef = usernameLower ? doc(db, "usernames", usernameLower) : null;
        const usernameSnap = usernameRef ? await tx.get(usernameRef) : null;
        const stockRefs = ctx.stock.map((s) => doc(db, "collectible_stock", s.id));
        const stockSnaps = await Promise.all(stockRefs.map((ref) => tx.get(ref)));

        // Validate limited-edition stock before writes begin.
        for (let i = 0; i < ctx.stock.length; i++) {
          const item = ctx.stock[i]!;
          const stockSnap = stockSnaps[i]!;
          const curSold = stockSnap.exists() ? ((stockSnap.data().sold as number) ?? 0) : 0;
          if (item.limit && curSold + item.qty > item.limit) {
            throw new Error("sold_out: This limited edition is sold out");
          }
        }

        if (usernameLower && usernameRef) {
          if (usernameSnap?.exists() && usernameSnap.data().userId !== uid) {
            // Keep the existing collision fallback, but only after the original
            // registry document has been read inside this transaction.
            state.username = `${state.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
          }
          const finalLower = state.username.trim().toLowerCase();
          tx.set(doc(db, "usernames", finalLower), {
            username: finalLower,
            userId: uid,
            createdAt: now,
          });
        }

        const calculatedNw = Math.max(0, Math.round(netWorth(state, now).total));
        const corpTag = own?.state
          ? own.state.tag
          : corpOut && !corpOut.dissolve
            ? corpOut.state.tag
            : null;
        const playerRecord = {
          userId: uid,
          username: state.username || "Player",
          level: state.level || 1,
          netWorth: calculatedNw,
          liquid: state.cash + state.reservedCash,
          title: state.profile?.title || "Aspiring Tycoon",
          avatar: state.profile?.avatar || "briefcase",
          corpTag,
          version: version + 1,
          state: state as unknown as Record<string, unknown>,
          updatedAt: now,
          recentActionKeys: action
            ? [...recentActionKeys.filter((key) => key !== _key), _key].slice(-64)
            : recentActionKeys.slice(-64),
        };
        tx.set(playerRef, playerRecord);
        // A deliberately small public projection replaces leaderboard reads of
        // complete private player save documents.
        tx.set(doc(db, "public_players", uid), {
          userId: uid,
          username: playerRecord.username,
          level: playerRecord.level,
          netWorth: playerRecord.netWorth,
          liquid: playerRecord.liquid,
          title: playerRecord.title,
          avatar: playerRecord.avatar,
          corpTag,
          corpId: state.corp.id || null,
          updatedAt: now,
        });

        if (corpOut) {
          const corpRef = doc(db, "corporations", corpOut.id);
          tx.set(corpRef, {
            id: corpOut.id,
            name: corpOut.state.name,
            tag: corpOut.state.tag,
            founderId: corpOut.state.founderId,
            version: corpOut.version + 1,
            state: corpOut.state as unknown as Record<string, unknown>,
            dissolved: corpOut.dissolve,
            updatedAt: now,
          });
          tx.set(doc(db, "public_corporations", corpOut.id), {
            ...corporationLeaderboardEntry(corpOut.id, corpOut.state),
            dissolved: corpOut.dissolve,
          });
        }

        for (const l of ctx.ledger) {
          const entryId = crypto.randomUUID();
          tx.set(doc(db, "ledger", entryId), {
            id: entryId,
            type: l.type,
            source: l.source,
            destination: l.destination,
            amount: l.amount,
            entity: l.entity || "",
            createdAt: now,
          });
        }

        for (let i = 0; i < ctx.stock.length; i++) {
          const item = ctx.stock[i]!;
          const stockSnap = stockSnaps[i]!;
          const curSold = stockSnap.exists() ? ((stockSnap.data().sold as number) ?? 0) : 0;
          tx.set(stockRefs[i]!, { itemId: item.id, sold: curSold + item.qty, updatedAt: now });
        }

        return { duplicate: false as const, state };
      });

      if (commit.duplicate) {
        return {
          ok: true as const,
          duplicate: true as const,
          now,
          state: commit.state,
          corp: null,
        };
      }
      const finalCorp =
        state.corp.id && corpOut && !corpOut.dissolve && corpOut.id === state.corp.id
          ? corpOut.state
          : null;
      return { ok: true as const, now, state, corp: corpView(finalCorp, uid) };
    } catch (txErr: unknown) {
      lastErr = txErr;
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      if (msg.includes("conflict")) continue;
      if (msg.includes("sold_out"))
        return { ok: false as const, error: "This limited edition is sold out" };
      if (msg.includes("player_username_unique"))
        return { ok: false as const, error: "That username is taken" };
      console.warn("Firestore transaction commit failed:", txErr);
      return {
        ok: false as const,
        error: action
          ? "Action could not be saved. Please retry."
          : "Your saved game could not be synchronized. Please retry.",
      };
    }
  }
  throw new Error(`Busy, please retry (${String((lastErr as Error)?.message ?? "")})`);
}

export async function getGame() {
  let user = await getCurrentUser();
  if (!user && typeof window !== "undefined" && localStorage.getItem("guest_mode") === "true") {
    user = { uid: "guest_player", email: "guest@capitalfortune.local" } as unknown as User;
  }
  if (!user) {
    // Return a default new player state in guest/dev mode so UI always loads cleanly
    const now = Date.now();
    const st = newPlayer(now, "GuestTycoon");
    return { ok: true as const, now, state: st, corp: null, offset: 0 };
  }
  const r = await run(user.uid, user.email || undefined, null, `tick-${crypto.randomUUID()}`);
  return JSON.parse(JSON.stringify(r)) as typeof r;
}

export async function gameAction(input: { data: { key: string; action: AnyAction } }) {
  let user = await getCurrentUser();
  if (!user && typeof window !== "undefined" && localStorage.getItem("guest_mode") === "true") {
    user = { uid: "guest_player", email: "guest@capitalfortune.local" } as unknown as User;
  }
  if (!user) throw new Error("Please sign in to continue");
  if (!input || !input.data || typeof input.data.key !== "string") throw new Error("Bad key");
  if (!input.data.action || typeof input.data.action.type !== "string")
    throw new Error("Bad action");
  const r = await run(user.uid, user.email || undefined, input.data.action, `a-${input.data.key}`);
  return JSON.parse(JSON.stringify(r)) as typeof r;
}

export async function listCorporations() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue");
  try {
    const snaps = await getDocs(collection(db, "corporations"));
    return snaps.docs
      .map((d) => {
        const dData = d.data();
        if (dData.dissolved) return null;
        const c = dData.state as CorpState;
        if (!c) return null;
        return {
          id: d.id,
          name: c.name,
          tag: c.tag,
          level: c.level,
          members: Object.keys(c.members || {}).length,
          recruitment: c.recruitment,
          description: c.description,
          invited: !!c.invites?.[user.uid],
          applied: !!c.applications?.[user.uid],
        };
      })
      .filter(Boolean);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "corporations");
  }
}

export async function getLedger() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue");
  try {
    const q = query(collection(db, "ledger"), orderBy("createdAt", "desc"), limit(100));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "ledger");
  }
}

export async function getCollectibleStock() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue");
  try {
    const snaps = await getDocs(collection(db, "collectible_stock"));
    const map: Record<string, number> = {};
    snaps.docs.forEach((d) => {
      const dData = d.data();
      if (dData.itemId) map[dData.itemId] = Number(dData.sold) || 0;
    });
    return map;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "collectible_stock");
  }
}

export type LeaderboardEntry = {
  userId: string;
  username: string;
  level: number;
  netWorth: number;
  liquid: number;
  title: string;
  avatar: string;
  corpTag: string | null;
  companiesCount: number;
  propertiesCount: number;
  achievementsCount: number;
  updatedAt: number;
  createdAt: number;
};

export async function getLeaderboard(sort: "networth" | "experience" = "networth"): Promise<LeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue");
  try {
    const rankingField = sort === "experience" ? "level" : "netWorth";
    const snaps = await getDocs(
      query(collection(db, "public_players"), orderBy(rankingField, "desc"), limit(10)),
    );
    return snaps.docs.map((d) => {
      const data = d.data();
      return {
        userId: d.id,
        username: String(data.username || "Anonymous Tycoon"),
        level: Number(data.level || 1),
        netWorth: Math.max(0, Math.round(Number(data.netWorth) || 0)),
        liquid: Number(data.liquid) || 0,
        title: String(data.title || "Aspiring Tycoon"),
        avatar: String(data.avatar || "briefcase"),
        corpTag: (data.corpTag as string | null) ?? null,
        companiesCount: 0,
        propertiesCount: 0,
        achievementsCount: 0,
        updatedAt: Number(data.updatedAt || 0),
        createdAt: Number(data.createdAt || 0),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "public_players");
  }
}

export type CorpLeaderboardEntry = {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  activity: number;
  valuation: number;
  treasury: number;
  membersCount: number;
};

export async function getCorporationLeaderboard(
  sort: "activity" | "experience" | "valuation" = "activity",
): Promise<CorpLeaderboardEntry[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to continue");
  try {
    const rankingField = sort === "experience" ? "xp" : sort;
    const snaps = await getDocs(
      query(
        collection(db, "public_corporations"),
        orderBy(rankingField, "desc"),
        limit(10),
      ),
    );
    return snaps.docs
      .map((d) => d.data())
      .filter((data) => !data.dissolved)
      .map((data) => ({
        id: String(data.id),
        name: String(data.name || "Corporation"),
        tag: String(data.tag || "CORP"),
        level: Number(data.level || 1),
        xp: Number(data.xp || 0),
        activity: Number(data.activity || 0),
        valuation: Number(data.valuation || 0),
        treasury: Number(data.treasury || 0),
        membersCount: Number(data.membersCount || 0),
      }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "public_corporations");
    return [];
  }
}
