import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Read-only boot endpoint. Loading a session must never tick/commit player state:
 * the game-action endpoint owns all state transitions.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) return json({ error: "server_misconfigured" }, 500);

  // Validate the caller's JWT before using the server-only service role.
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "unauthorized" }, 401);

  // A single bounded SELECT avoids the full-state write/retry path on app startup.
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: player, error: stateError } = await admin
    .from("player_states")
    .select("state")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (stateError) {
    console.error("game-session state read failed", { code: stateError.code, message: stateError.message });
    return json({ error: "game_state_unavailable" }, 503);
  }
  if (!player) return json({ error: "player_not_provisioned" }, 409);

  return json({
    ok: true,
    now: Date.now(),
    state: player.state,
    corp: null,
  });
});
