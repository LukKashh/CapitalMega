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
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return json({ error: "server_misconfigured" }, 500);
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return json({ error: "unauthorized" }, 401);

  const userId = authData.user.id;
  const [profileResult, stateResult] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_key, created_at").eq("id", userId).maybeSingle(),
    supabase.from("player_states").select("state, version, last_action_at, updated_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileResult.error || stateResult.error) return json({ error: "game_session_read_failed" }, 500);
  if (!profileResult.data || !stateResult.data) return json({ error: "player_not_provisioned" }, 409);
  return json({
    user: { id: userId, email: authData.user.email ?? null },
    profile: profileResult.data,
    player: stateResult.data,
  });
});
