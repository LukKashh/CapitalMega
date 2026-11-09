import { supabase } from "@/integrations/supabase/client";
import type { Action } from "@/game/engine";
import type { PlayerState } from "@/game/types";

export type GameActionResult =
  | { ok: true; now: number; state: PlayerState; corp: null; duplicate?: boolean }
  | { ok: false; error: string };

export async function getSupabaseGame() {
  const { data, error } = await supabase.functions.invoke("game-action", {
    method: "POST",
    body: {},
  });
  if (error) throw error;
  if (!data) throw new Error("Game endpoint returned no data.");
  return data as { ok: boolean; now: number; state: PlayerState; corp: null; error?: string };
}

export async function submitSupabaseGameAction(input: { key: string; action: Action }) {
  const { data, error } = await supabase.functions.invoke("game-action", {
    method: "POST",
    body: input,
  });
  if (error) throw error;
  if (!data) throw new Error("Game endpoint returned no data.");
  return data as GameActionResult;
}
