import { supabase } from "@/integrations/supabase/client";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  level: number;
  netWorth: number;
  corpTag: string | null;
};

export type CorpLeaderboardEntry = {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  activity: number;
  valuation: number;
};

export async function listCorporations() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Please sign in to continue");
  const { data, error } = await supabase
    .from("public_corporations")
    .select("corporation_id, name, tag, level, member_count")
    .order("member_count", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.corporation_id,
    name: c.name,
    tag: c.tag,
    level: c.level,
    members: c.member_count,
    recruitment: "open",
    description: "Player-run corporation",
    invited: false,
    applied: false,
  }));
}

export async function getLedger() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Please sign in to continue");
  const { data, error } = await supabase
    .from("game_ledger")
    .select("id, entry_type, source, destination, amount, entity_id, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.entry_type,
    source: row.source,
    destination: row.destination,
    amount: row.amount,
    entity: row.entity_id,
    created_at: row.created_at,
  }));
}

export async function getCollectibleStock() {
  const { data, error } = await supabase.from("collectible_stock").select("item_id, sold");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.item_id, Number(row.sold) || 0]));
}

export async function getLeaderboard(
  sort: "networth" | "experience" = "networth",
): Promise<LeaderboardEntry[]> {
  const column = sort === "experience" ? "level" : "net_worth";
  const { data, error } = await supabase
    .from("public_players")
    .select("user_id, username, level, net_worth, corporation_tag")
    .order(column, { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    username: row.username || "Anonymous Tycoon",
    level: Number(row.level) || 1,
    netWorth: Math.max(0, Math.round(Number(row.net_worth) || 0)),
    corpTag: row.corporation_tag,
  }));
}

export async function getCorporationLeaderboard(
  sort: "activity" | "experience" | "valuation" = "activity",
): Promise<CorpLeaderboardEntry[]> {
  const column = sort === "experience" ? "xp" : sort;
  const { data, error } = await supabase
    .from("public_corporations")
    .select("corporation_id, name, tag, level, xp, activity, valuation")
    .order(column, { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.corporation_id,
    name: row.name || "Corporation",
    tag: row.tag || "CORP",
    level: Number(row.level) || 1,
    xp: Number(row.xp) || 0,
    activity: Number(row.activity) || 0,
    valuation: Number(row.valuation) || 0,
  }));
}
