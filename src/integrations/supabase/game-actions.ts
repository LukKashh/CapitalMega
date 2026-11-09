import { supabase } from "@/integrations/supabase/client";
import type { Action } from "@/game/engine";
import type { PlayerState } from "@/game/types";

export type GameActionResult =
  | { ok: true; now: number; state: PlayerState; corp: null; duplicate?: boolean }
  | { ok: false; error: string };

type GameSessionResult =
  | { ok: true; now: number; state: PlayerState; corp: null }
  | { ok: false; error: string };

/** Loads the initial save through a read-only endpoint with a hard timeout. */
export async function getSupabaseGame() {
  const { data, error } = await supabase.functions.invoke<GameSessionResult>("game-session", {
    method: "POST",
    body: {},
    timeout: 12_000,
  });

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("abort")
        ? "The game server timed out while loading. Check your connection and retry."
        : `Couldn't load your save: ${error.message}`,
    );
  }
  if (!data) throw new Error("The game session endpoint returned no data.");
  if (!data.ok) throw new Error(data.error);
  return data;
}

export async function submitSupabaseGameAction(input: { key: string; action: Action }) {
  const { data, error } = await supabase.functions.invoke("game-action", {
    method: "POST",
    body: input,
    timeout: 20_000,
  });
  if (error) throw error;
  if (!data) throw new Error("Game endpoint returned no data.");
  return data as GameActionResult;
}
