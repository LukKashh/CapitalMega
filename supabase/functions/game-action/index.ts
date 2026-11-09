import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { apply, tick, reconcileState, netWorth, checkAchievements } from "./game/engine.ts";
import { EMPTY_MODS } from "./game/config.ts";
import type { Ctx, Action } from "./game/engine.ts";
import type { PlayerState } from "./game/types.ts";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const corpActions=new Set(["corpCreate","corpJoin","corpApply","corpAcceptInvite","corpDecideApplication","corpInvite","corpLeave","corpKick","corpSetRank","corpTransferFounder","corpContribute","corpShift","corpFacility","corpDepartment","corpAssignOfficer","corpBuyBusiness","corpSettings","corpDissolve"]);
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 const authorization=req.headers.get("Authorization");if(!authorization?.startsWith("Bearer "))return reply({error:"unauthorized"},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anon||!service)return reply({error:"server_misconfigured"},500);
 const auth=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser();if(authError||!authData.user)return reply({error:"unauthorized"},401);
 let body: Record<string, unknown>;
 try {
  const parsed: unknown = await req.json();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply({ error: "invalid_json" }, 400);
  body = parsed as Record<string, unknown>;
 } catch {
  return reply({ error: "invalid_json" }, 400);
 }
 const action = (body.action ?? null) as Action | null;
 const key = body.key;
 if(action&&(typeof key!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(key)))return reply({error:"invalid_idempotency_key"},400);
 if(action&&(typeof action.type!=="string"||corpActions.has(action.type)||action.type.startsWith("casino")))return reply({error:"unsupported_action_type"},400);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),uid=authData.user.id;
 for(let attempt=0;attempt<4;attempt++){
  const now=Date.now(),{data:row,error:readError}=await admin.from("player_states").select("state,version").eq("user_id",uid).maybeSingle();
  if(readError)return reply({error:"player_read_failed"},500);if(!row)return reply({error:"player_not_provisioned"},409);
  const state=row.state as PlayerState,version=Number(row.version)||1;reconcileState(state,now);
  const ctx:Ctx={s:state,now,ledger:[],stock:[],corpMods:{...EMPTY_MODS}};
  try{tick(ctx);if(action)apply(ctx,action);checkAchievements(ctx)}catch(e){return reply({ok:false,error:e instanceof Error?e.message:"action_failed"},422)}
  const nw=Math.max(0,Math.round(netWorth(state,now).total)),response={ok:true,now,state,corp:null};
  const {data:committed,error:commitError}=await admin.rpc("commit_game_action",{p_user_id:uid,p_idempotency_key:action?key:`tick-${now}-${version}`,p_action_type:action?.type??"tick",p_expected_version:version,p_state:state,p_public_player:{username:state.username||"Player",level:state.level||1,net_worth:nw,corporation_tag:null},p_response:response,p_ledger:ctx.ledger.map(l=>({type:l.type,source:l.source,destination:l.destination,amount:l.amount,entity:l.entity??""})),p_stock:ctx.stock.map(x=>({item_id:x.item,qty:x.qty,edition_limit:x.max})),p_corporation:null});
  if(!commitError)return reply(committed);if(commitError.code==="40001"||String(commitError.message).includes("player_state_conflict"))continue;
  if(String(commitError.message).includes("collectible_sold_out"))return reply({ok:false,error:"This limited edition is sold out"},409);return reply({error:"action_commit_failed",detail:commitError.message},500);
 }
 return reply({error:"busy_retry"},409);
});