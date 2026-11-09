import { supabase } from "@/integrations/supabase/client";

export interface GameSession {
  user: { id: string; email: string | null };
  profile: {
    id: string;
    username: string | null;
    display_name: string;
    avatar_key: string;
    created_at: string;
  };
  player: {
    state: Record<string, unknown>;
    version: number;
    last_action_at: string;
    updated_at: string;
  };
}

/** Fetches the signed-in player's canonical state through the authenticated Edge Function. */
export async function loadGameSession(): Promise<GameSession> {
  const { data, error } = await supabase.functions.invoke<GameSession>("game-session", {
    method: "POST",
    body: {},
  });
  if (error) throw error;
  if (!data) throw new Error("The game session endpoint returned no data.");
  return data;
}
