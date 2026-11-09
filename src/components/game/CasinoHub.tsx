import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Coins, Crown, Gift, Gem, History, House, LockKeyhole, ShieldCheck, Sparkles, Spade, Star, Trophy, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Pill } from "@/components/game/ui";
import { useGame } from "@/hooks/use-game";
import { CASINO } from "@/game/config";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { casinoLoyaltyProgress, CASINO_LOYALTY_TIERS } from "@/game/casino-loyalty";

type Section = "connecting" | "home" | "games" | "wallet" | "loyalty" | "activity";
const GAME_CARDS = [
  { id: "Roulette", icon: "🎡", tag: "CLASSIC", note: "European wheel · 37 pockets", tone: "from-rose-500/30 to-orange-500/10" },
  { id: "Blackjack", icon: "🂡", tag: "TABLE", note: "Beat the dealer to 21", tone: "from-amber-500/30 to-yellow-500/10" },
  { id: "Mines", icon: "💎", tag: "INSTANT", note: "Find gems · avoid the mines", tone: "from-cyan-500/30 to-blue-500/10" },
  { id: "Keno", icon: "🔢", tag: "DRAW", note: "Pick numbers from 1 to 80", tone: "from-violet-500/30 to-fuchsia-500/10" },
  { id: "Hi-Lo", icon: "🃏", tag: "CARD", note: "Predict the next card", tone: "from-emerald-500/30 to-teal-500/10" },
] as const;

export function CasinoHub({ onClose, onPlay }: { onClose: () => void; onPlay: (game: (typeof GAME_CARDS)[number]["id"]) => void }) {
  const { data } = useGame();
  const [section, setSection] = useState<Section>("connecting");
  const [entering, setEntering] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSection("home"), 1500);
    return () => window.clearTimeout(id);
  }, []);
  const state = data?.state;
  const casino = state?.casino;
  const chips = casino?.chips ?? 0;
  const cash = state?.cash ?? 0;
  const loyaltyXp = Math.max(0, casino?.stats.wagered ?? 0);
  const loyalty = casinoLoyaltyProgress(loyaltyXp);
  const tier = loyalty.tier.name;
  const progress = loyalty.progress * 100;
  const activity = useMemo(() => casino?.last ? [casino.last] : [], [casino?.last]);
  const openGame = (game: (typeof GAME_CARDS)[number]["id"]) => {
    setEntering(true);
    window.setTimeout(() => onPlay(game), 520);
  };
  return (
    <section className="casino-hub fixed inset-0 z-[82] flex min-h-0 flex-col overflow-hidden bg-[#090812] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Capital Casino">
      <header className="flex shrink-0 items-center justify-between border-b border-violet-400/15 bg-[#100d1c]/95 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/30 bg-violet-500/15 text-violet-200"><Spade className="h-5 w-5" /></div>
          <div className="min-w-0"><div className="truncate text-sm font-black tracking-[.12em]">CAPITAL <span className="text-violet-300">CASINO</span></div><div className="text-[9px] uppercase tracking-[.2em] text-violet-200/60">{section === "connecting" ? "Secure game gateway" : "Virtual casino · chips only"}</div></div>
        </div>
        {section !== "connecting" && <Button size="icon" variant="ghost" aria-label="Close casino" onClick={onClose}><X className="h-5 w-5" /></Button>}
      </header>

      {section === "connecting" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-violet-300/35 bg-violet-500/10 shadow-[0_0_70px_#8154f455]">
            <span className="absolute inset-0 animate-ping rounded-full border border-violet-300/25" /><Spade className="h-11 w-11 text-violet-200" />
          </div>
          <div><h2 className="text-xl font-black">Connecting to Casino Network</h2><p className="mt-2 text-xs text-violet-100/55">Verifying player session · syncing chip wallet · opening tables</p></div>
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300" /></div>
          <Pill tone="gain"><ShieldCheck className="mr-1 inline h-3 w-3" /> Encrypted game session</Pill>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {section === "home" ? (
              <div className="space-y-4 px-4 py-4">
                <div className="relative overflow-hidden rounded-2xl border border-violet-300/25 bg-gradient-to-br from-[#332058] via-[#19132d] to-[#100f1e] p-4 shadow-[0_12px_45px_#5c36a52b]">
                  <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-2xl" />
                  <div className="relative flex items-center justify-between"><Pill tone="gold">WELCOME BACK</Pill><span className="text-[10px] uppercase tracking-widest text-violet-100/65">Player LV {state?.level ?? 1}</span></div>
                  <h1 className="relative mt-3 text-2xl font-black tracking-tight">The tables are open.</h1>
                  <p className="relative mt-1 text-xs text-violet-100/65">Your private virtual casino floor is ready.</p>
                  <div className="relative mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/50">Casino chips</div><div className="mt-1 flex items-center gap-1.5 text-xl font-black text-amber-300"><Coins className="h-4 w-4" />{chips.toLocaleString()}</div><div className="text-[10px] text-white/45">Worth {money(chips * CASINO.chipValue)}</div></div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/50">Game wallet</div><div className="mt-1 text-xl font-black text-emerald-300">{money(cash)}</div><div className="text-[10px] text-white/45">In-game cash balance</div></div>
                  </div>
                  <Button onClick={() => setSection("games")} className="relative mt-4 h-12 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 font-black shadow-[0_6px_24px_#8b5cf680]"><Spade className="mr-2 h-4 w-4" /> ENTER THE CASINO <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <QuickAction icon={<Wallet />} label="Wallet" onClick={() => setSection("wallet")} />
                  <QuickAction icon={<Crown />} label="Loyalty" onClick={() => setSection("loyalty")} />
                  <QuickAction icon={<History />} label="Activity" onClick={() => setSection("activity")} />
                </div>

                <div className="flex items-center justify-between"><div><div className="text-sm font-black">Featured tables</div><div className="text-[10px] text-white/45">Pick up where you left off</div></div><button onClick={() => setSection("games")} className="text-xs font-bold text-violet-300">View all →</button></div>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_CARDS.slice(0,4).map((g) => <button key={g.id} onClick={() => openGame(g.id)} className={cn("casino-game-card min-h-[118px] rounded-xl border border-violet-300/15 bg-gradient-to-br p-3 text-left transition-all active:scale-[.98]",g.tone)}><div className="flex items-start justify-between"><span className="text-3xl">{g.icon}</span><span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[8px] tracking-widest text-white/60">{g.tag}</span></div><div className="mt-2 text-sm font-black">{g.id}</div><div className="text-[10px] text-white/55">{g.note}</div></button>)}
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-3"><div className="flex items-center gap-2 text-xs font-bold text-amber-200"><Gift className="h-4 w-4" /> Loyalty club</div><p className="mt-1 text-[10px] text-white/55">Build status through virtual-chip play and unlock cosmetic club perks.</p><button onClick={() => setSection("loyalty")} className="mt-2 text-[11px] font-bold text-amber-200">View loyalty program →</button></div>
              </div>
            ) : section === "games" ? (
              <div className="space-y-3 px-4 py-4">
                <Subhead title="Casino floor" subtitle="Choose a table to launch its live game interface" back={() => setSection("home")} />
                {GAME_CARDS.map((g) => <button key={g.id} onClick={openGame} className={cn("flex w-full items-center gap-3 rounded-xl border border-violet-300/20 bg-gradient-to-r p-3 text-left transition-all active:scale-[.99]",g.tone)}><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-3xl">{g.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{g.id}</span><span className="mt-0.5 block text-[10px] text-white/55">{g.note}</span><span className="mt-1 block text-[8px] font-bold tracking-widest text-violet-200/70">{g.tag}</span></span><ArrowRight className="h-4 w-4 text-violet-200" /></button>)}
                <Card className="border-violet-300/15 bg-[#171325] p-3 text-[10px] text-white/50">More tables can be unlocked as the game expands. All play uses server-authoritative virtual casino chips.</Card>
              </div>
            ) : section === "wallet" ? (
              <div className="space-y-4 px-4 py-4">
                <Subhead title="Player wallet" subtitle="Virtual cash and casino chip exchange" back={() => setSection("home")} />
                <div className="grid grid-cols-2 gap-2"><WalletMetric label="Available cash" value={money(cash)} tone="text-emerald-300" /><WalletMetric label="Casino chips" value={chips.toLocaleString()} tone="text-amber-300" /></div>
                <Card className="space-y-3 border-violet-300/20 bg-[#171325] p-4"><div className="flex items-center gap-2 text-sm font-black"><Coins className="h-4 w-4 text-amber-300" /> Chip exchange</div><p className="text-xs leading-relaxed text-white/55">Open the casino tables to buy chips with in-game cash or cash chips back into your in-game balance. Rate: 1 chip = {money(CASINO.chipValue)}.</p><Button className="w-full bg-violet-600" onClick={() => openGame("Roulette")}>Open chip cashier <ArrowRight className="ml-2 h-4 w-4" /></Button></Card>
                <div className="rounded-xl border border-white/10 p-3 text-[10px] text-white/45">This wallet is a game mechanic. It does not connect to payment methods, bank cards, cryptocurrency, or real-money withdrawals.</div>
              </div>
            ) : section === "loyalty" ? (
              <div className="space-y-4 px-4 py-4">
                <Subhead title="Royal loyalty club" subtitle="Progress, status and in-game rewards" back={() => setSection("home")} />
                <div className="rounded-2xl border border-amber-300/25 bg-gradient-to-br from-[#46331d] via-[#241a22] to-[#171325] p-4"><div className="flex items-center justify-between"><Pill tone="gold">CURRENT TIER</Pill><Crown className="h-7 w-7 text-amber-200" /></div><div className="mt-3 text-2xl font-black text-amber-100">{tier} Member</div><div className="mt-1 text-xs text-white/55">{Math.floor(loyaltyXp).toLocaleString()} loyalty points accumulated</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-100 transition-all duration-700" style={{width: Math.max(0,Math.min(100,progress))+"%"}} /></div><div className="mt-2 flex justify-between text-[9px] text-white/45"><span>{loyalty.remaining.toLocaleString()} points to {loyalty.next?.name ?? "max tier"}</span><span>{Math.round(progress)}%</span></div></div>
                <div className="space-y-2">{CASINO_LOYALTY_TIERS.map((x)=><div key={x.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200"><Star className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block text-xs">{x.name}</b><span className="text-[10px] text-white/45">{x.threshold.toLocaleString()} points · {x.reward}</span></span>{tier===x.name&&<BadgeCheck className="h-5 w-5 text-emerald-300" />}</div>)}</div>
                <Card className="border-violet-300/15 bg-[#171325] p-3"><div className="flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4 text-violet-200" /> How points work</div><p className="mt-1 text-[10px] text-white/50">Points mirror cumulative virtual chips wagered. No paid membership and no cash-equivalent loyalty rewards.</p></Card>
              </div>
            ) : (
              <div className="space-y-3 px-4 py-4">
                <Subhead title="Latest round" subtitle="Most recently completed virtual round" back={() => setSection("home")} />
                {activity.length ? activity.map((a,i)=><Card key={i} className="border-white/10 bg-[#171325] p-3"><div className="flex items-center justify-between"><b className="text-sm capitalize">{a.game}</b><span className="text-[10px] text-white/45">{new Date(a.at).toLocaleString()}</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-white/50">Bet {a.bet.toLocaleString()} chips</span><b className={a.payout>=a.bet?"text-emerald-300":"text-rose-300"}>{a.payout>=a.bet?"+":""}{(a.payout-a.bet).toLocaleString()} net</b></div></Card>) : <Card className="border-white/10 bg-[#171325] p-5 text-center"><Clock3 className="mx-auto h-7 w-7 text-violet-200" /><b className="mt-2 block text-sm">No completed rounds yet</b><p className="mt-1 text-[10px] text-white/45">A completed game result will appear here.</p><Button className="mt-3 bg-violet-600" onClick={() => setSection("games")}>Browse games</Button></Card>}
                <div className="text-[10px] text-white/40">Full lifetime statistics remain available in the casino tables.</div>
              </div>
            )}
          </div>
          {section !== "connecting" && <nav className="grid shrink-0 grid-cols-4 border-t border-violet-300/15 bg-[#100d1c]/95 px-2 py-2">
            <NavButton active={section==="home"} icon={<House />} label="Home" onClick={() => setSection("home")} />
            <NavButton active={section==="games"} icon={<Spade />} label="Games" onClick={() => setSection("games")} />
            <NavButton active={section==="wallet"} icon={<Wallet />} label="Wallet" onClick={() => setSection("wallet")} />
            <NavButton active={section==="loyalty"} icon={<Crown />} label="Loyalty" onClick={() => setSection("loyalty")} />
          </nav>}
          {entering && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090812]/95 backdrop-blur-sm"><div className="text-center"><Spade className="mx-auto h-12 w-12 animate-pulse text-violet-200" /><div className="mt-3 text-sm font-black tracking-widest">OPENING GAME TABLE</div><div className="mt-1 text-[10px] text-white/50">Syncing your chip balance…</div></div></div>}
        </>
      )}
      <div className="shrink-0 border-t border-violet-300/10 px-3 py-1.5 text-center text-[8px] tracking-wide text-white/30">SIMULATED IN-GAME CASINO · VIRTUAL CHIPS ONLY · NO REAL-MONEY GAMBLING</div>
    </section>
  );
}

function QuickAction({ icon, label, onClick }: {icon: React.ReactNode;label:string;onClick:()=>void}) {
  return <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-violet-300/15 bg-white/[.035] px-2 py-3 text-violet-100 transition active:scale-95"><span className="h-5 w-5">{icon}</span><span className="text-[10px] font-bold">{label}</span></button>;
}
function WalletMetric({label,value,tone}:{label:string;value:string;tone:string}) {
  return <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] uppercase tracking-widest text-white/45">{label}</div><div className={cn("mt-1 text-lg font-black",tone)}>{value}</div></div>;
}
function Subhead({title,subtitle,back}:{title:string;subtitle:string;back:()=>void}) {
  return <div><button onClick={back} className="mb-2 flex items-center gap-1 text-[11px] font-bold text-violet-300"><ArrowLeft className="h-3 w-3" /> Back</button><h2 className="text-xl font-black">{title}</h2><p className="mt-0.5 text-[10px] text-white/45">{subtitle}</p></div>;
}
function NavButton({active,icon,label,onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}) {
  return <button onClick={onClick} className={cn("flex flex-col items-center gap-1 rounded-lg py-2 text-[9px] font-bold transition",active?"text-violet-200":"text-white/40")}><span className={cn("h-5 w-5",active&&"drop-shadow-[0_0_8px_#b99cff]")}>{icon}</span>{label}</button>;
}
