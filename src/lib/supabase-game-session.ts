import { supabase } from "@/integrations/supabase/client";

export type SupabaseGameSession = {
  ok: true;
  user: { id: string; email: string | null };
  profile: {
    username: string | null;
    display_name: string;
    avatar_key: string;
  } | null;
  player: {
    state: Record<string, unknown>;
    version: number;
    last_action_at: string;
    updated_at: string;
  };
  serverTime: number;
};

export class GameSessionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GameSessionError";
  }
}

/**
 * Loads the authenticated player's private save through the server-side
 * game-session Edge Function. The caller never supplies a player ID and the
 * function applies the user's RLS-scoped session.
 */
export async function loadSupabaseGameSession(): Promise<SupabaseGameSession> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new GameSessionError(sessionError.message);
  if (!sessionData.session) throw new GameSessionError("Please sign in to continue", 401);

  const { data, error } = await supabase.functions.invoke<SupabaseGameSession>("game-session", {
    method: "GET",
  });

  if (error) {
    const status = "context" in error && error.context instanceof Response
      ? error.context.status
      : undefined;
    throw new GameSessionError(error.message || "Unable to load game session", status);
  }
  if (!data || data.ok !== true || !data.player?.state) {
    throw new GameSessionError("The server returned an invalid game session");
  }
  return data;
}
