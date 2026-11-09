import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json({ ok: false, error: "server_configuration_error" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ ok: false, error: "authentication_required" }, 401);
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return json({ ok: false, error: "invalid_session" }, 401);

  const userId = authData.user.id;
  const [player, profile] = await Promise.all([
    supabase.from("player_states")
      .select("state, version, last_action_at, updated_at")
      .eq("user_id", userId).maybeSingle(),
    supabase.from("profiles")
      .select("username, display_name, avatar_key")
      .eq("id", userId).maybeSingle(),
  ]);

  if (player.error || profile.error) return json({ ok: false, error: "player_load_failed" }, 500);
  if (!player.data) return json({ ok: false, error: "player_state_missing" }, 404);

  return json({
    ok: true,
    user: { id: userId, email: authData.user.email ?? null },
    profile: profile.data,
    player: player.data,
    serverTime: Date.now(),
  });
});
