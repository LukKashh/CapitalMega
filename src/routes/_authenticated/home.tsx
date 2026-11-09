import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlayerTier } from "@/components/game/art";
import { useClicker, useGame, useOptimisticTaps } from "@/hooks/use-game";
import { clickBase, clickCap, clickReq, mult, personalMods, xpForLevel } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { BALANCE } from "@/game/config";
import { money } from "@/lib/format";
import { Loading } from "@/components/game/ui";
import { useMenu } from "@/context/menu";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Clicker — Capitalfortune" },
      { name: "description", content: "Tap to earn your fortune." },
      { property: "og:title", content: "Clicker — Capitalfortune" },
      { property: "og:description", content: "Tap to earn your fortune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

type PopItem = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  wave: number;
  rotStart: number;
  rotEnd: number;
  scale: number;
  duration: number;
};

type LiquidRipple = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
};

function HomePage() {
  const { data } = useGame();
  const opt = useOptimisticTaps(data);
  const { tap, buffer } = useClicker();
  const { openMenu } = useMenu();
  const [pops, setPops] = useState<PopItem[]>([]);
  const [ripples, setRipples] = useState<LiquidRipple[]>([]);
  const popId = useRef(0);
  const rippleId = useRef(0);
  if (!data) return <Loading />;
  const s = data.state;
  const p = personalMods(s);
  const cm = corpMods(data.corp);
  const value = clickBase(s.clicker.level) * mult("clickPct", p, cm);
  const req = clickReq(s.clicker.level);
  const cap = clickCap(s, p);
  const maxed = s.clicker.level >= BALANCE.clicker.hardCap;
  const shownCount = maxed ? 0 : Math.min(req, s.clicker.count + buffer);
  const xpPct = Math.min(100, ((s.xp + opt.xp) / xpForLevel(s.level)) * 100);

  const createPop = (x: number, y: number): PopItem => {
    const id = ++popId.current;
    // Randomized wavy pattern & randomized upward flow direction
    const dx = (Math.random() - 0.5) * 38; // restrained lateral drift
    const dy = -58 - Math.random() * 34; // short, crisp upward movement
    const wave = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12); // subtle motion variation
    const rotStart = (Math.random() - 0.5) * 12; // subtle initial rotation
    const rotEnd = (Math.random() - 0.5) * 28; // restrained final rotation
    const scale = 0.88 + Math.random() * 0.18; // coin scale
    const duration = 880 + Math.floor(Math.random() * 220); // 880ms - 1100ms responsive feedback
    return { id, x, y, dx, dy, wave, rotStart, rotEnd, scale, duration };
  };

  const triggerTapFeedback = (x: number, y: number, width: number, height: number) => {
    tap();

    const pop = createPop(x, y);
    setPops((list) => [...list.slice(-24), pop]);
    setTimeout(() => setPops((list) => list.filter((q) => q.id !== pop.id)), pop.duration + 50);

    // Size each wave to reach the farthest corner of the live tap surface.
    const farthestCorner = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const ripple: LiquidRipple = {
      id: ++rippleId.current,
      x,
      y,
      size: Math.max(260, farthestCorner * 2.12),
      duration: 2200,
    };
    setRipples((list) => [...list.slice(-11), ripple]);
    setTimeout(
      () => setRipples((list) => list.filter((item) => item.id !== ripple.id)),
      ripple.duration + 360,
    );
  };

  const handleFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    triggerTapFeedback(x, y, rect.width, rect.height);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      triggerTapFeedback(rect.width / 2, rect.height / 2, rect.width, rect.height);
    }
  };

  return (
    <div className="tapper-scene flex h-full flex-col justify-between overflow-hidden py-1">
      {/* Header Components: Unified Profile & Balance Card */}
      <div className="shrink-0 flex items-center justify-between gap-2 pt-1 pb-1">
        {/* Top-left: Fixed Size Profile Box with Balance Sub-Tab Window */}
        {(() => {
          const tierInfo = getPlayerTier(s.level);
          return (
            <Link
              to="/profile"
              aria-label={`Account Manager & Profile - ${tierInfo.tierName} ${tierInfo.romanSublevel}`}
              title="Open Account Manager"
              className="game-panel flex items-center gap-2 rounded-2xl border border-border/70 bg-card/85 px-2.5 py-1.5 backdrop-blur-md shadow-panel home-profile-card shrink-0 overflow-hidden hover:border-primary/60 transition-all cursor-pointer group"
            >
              <div className="relative shrink-0 flex items-center">
                <div className="relative h-9 w-9 rounded-xl border border-primary-glow/70 bg-gradient-to-b from-primary/15 to-card/60 p-0.5 flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.35)] overflow-hidden transition-transform group-hover:scale-105">
                  <img
                    src={tierInfo.badgePath}
                    alt={`${tierInfo.tierName} badge`}
                    className="h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background bg-gain shadow-[0_0_5px_rgba(34,197,94,0.9)]" />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5 overflow-hidden">
                <div className="flex items-center justify-between gap-1 min-w-0">
                  <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {s.username || "Tycoon"}
                  </span>
                  <span className="shrink-0 rounded bg-gradient-to-r from-purple-900/90 to-indigo-900/90 px-1 py-0.2 text-[8px] font-extrabold tracking-wider text-primary-glow border border-primary/40">
                    LV {s.level}
                  </span>
                </div>
                {/* Sub-Tab Window for Balance Value */}
                <div className="flex items-center gap-1 rounded-md bg-muted/40 border border-primary/25 px-1.5 py-0.5 min-w-0 overflow-hidden justify-between">
                  <div className="flex items-center gap-0.5 min-w-0 truncate">
                    <Wallet className="h-2.5 w-2.5 text-gold shrink-0" />
                    <span className="num text-[10px] font-bold text-gain truncate">
                      {money(s.cash + opt.cash)}
                    </span>
                  </div>
                  <span className="num text-[8px] font-mono text-muted-foreground shrink-0">
                    {Math.floor(xpPct)}%
                  </span>
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Top Header Text */}
        <div className="flex flex-1 items-center justify-center px-2">
          <span className="brand-name home-brand text-lg sm:text-2xl font-extrabold tracking-wider text-center select-none truncate drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]">
            Capital<span>fortune</span>
          </span>
        </div>

        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          onClick={openMenu}
          className="shrink-0 h-9 w-9 rounded-lg border border-border/60 bg-card/60 hover:bg-card"
        >
          <Menu className="game-icon h-4 w-4" />
        </Button>
      </div>

      {/* Unified Clicker UI Container (Clickable Area + Bottom Status merged inside) */}
      <div className="home-clicker-frame relative my-1 w-full flex-1 min-h-[260px] rounded-[1.65rem] border border-primary/30 bg-[#0b0b15] shadow-[0_18px_48px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between overflow-hidden">
        {/* Interactive Clickable Area (Middle Prompt & Emoji removed) */}
        <div
          onPointerDown={handleFramePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Tap anywhere within frame to generate wealth"
          className="home-tap-surface relative flex-1 w-full select-none cursor-pointer overflow-hidden touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-glow flex items-center justify-center group"
        >
          {/* Cyberpunk Frames Window Corner Accents */}
          <div className="pointer-events-none absolute inset-2 rounded-xl border border-primary/15" />
          <div className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 border-l-2 border-t-2 border-primary-glow/80" />
          <div className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 border-r-2 border-t-2 border-primary-glow/80" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-3.5 w-3.5 border-b-2 border-l-2 border-primary-glow/80" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 border-b-2 border-r-2 border-primary-glow/80" />

          {/* Living liquid surface and ambient caustic lighting */}
          <div className="home-liquid-base pointer-events-none absolute inset-0" />
          <div className="home-liquid-grid pointer-events-none absolute inset-0" />

          {/* Each tap launches a surface wave sized to travel across the entire panel. */}
          {ripples.map((ripple) => (
            <div
              key={ripple.id}
              className="home-liquid-ripple pointer-events-none absolute z-[2]"
              style={
                {
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                  "--ripple-duration": `${ripple.duration}ms`,
                } as React.CSSProperties
              }
            >
              <span className="home-liquid-ring home-liquid-ring-a" />
              <span className="home-liquid-ring home-liquid-ring-b" />
              <span className="home-liquid-ring home-liquid-ring-c" />
              <span className="home-liquid-impact" />
              <span className="home-liquid-caustic" />
            </div>
          ))}

          <div className="home-tap-center pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3">
            <div className="home-tap-orbit absolute rounded-full" />
            <div className="home-tap-medallion relative flex items-center justify-center">
              <div className="home-tap-medallion-glint absolute inset-0 rounded-full" />
              <img
                src="/assets/aistudio/file_000000001f808246b3f630ace71f936f_d89c4e38.png"
                alt=""
                draggable={false}
                className="home-tap-coin relative z-[1] h-full w-full select-none object-contain"
              />
            </div>
            <div className="relative z-[2] flex flex-col items-center gap-1.5">
              <span className="home-tap-label text-[11px] sm:text-xs font-extrabold tracking-[0.24em] text-foreground/90">
                TAP TO EARN
              </span>
              <span className="home-tap-caption text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/80">
                ANYWHERE ON THIS PANEL
              </span>
            </div>
          </div>

          {/* Upward floating reward feedback */}
          {pops.map((pp) => (
            <div
              key={pp.id}
              className="home-tap-reward pointer-events-none absolute z-30"
              style={
                {
                  left: pp.x,
                  top: pp.y,
                  "--drift-x": `${pp.dx}px`,
                  "--drift-y": `${pp.dy}px`,
                  "--wave-x": `${pp.wave}px`,
                  "--rot-start": `${pp.rotStart}deg`,
                  "--rot-end": `${pp.rotEnd}deg`,
                  "--anim-scale": pp.scale,
                  "--anim-duration": `${pp.duration}ms`,
                } as React.CSSProperties
              }
            >
              {/* Floating Cash Text */}
              <div className="float-cash-text num font-bold text-xs sm:text-sm text-gain whitespace-nowrap drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]">
                +{money(value)}
              </div>

              {/* Reward coin launches from the impact with fluid particle wake. */}
              <div className="float-small-coin home-reward-coin relative">
                <span className="home-reward-materialise absolute inset-0 z-[2] flex items-center justify-center">
                  <img
                    src="/assets/aistudio/file_000000001f808246b3f630ace71f936f_d89c4e38.png"
                    alt=""
                    draggable={false}
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                  />
                </span>
                <span className="home-reward-trail" />
                <span className="home-reward-particle home-reward-particle-a" />
                <span className="home-reward-particle home-reward-particle-b" />
                <span className="home-reward-particle home-reward-particle-c" />
                <span className="home-reward-particle home-reward-particle-d" />
              </div>
            </div>
          ))}
        </div>

        {/* Merged Bottom Section within Clicker UI Container */}
        <div className="home-clicker-footer shrink-0 w-full border-t border-white/[0.07] bg-[#10101b]/95 px-3 py-2.5 text-left backdrop-blur-xl flex items-center justify-between gap-2 z-10">
          {/* Cash-Tap Liquidity */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-foreground tracking-wide truncate">
              Cash-Tap Liquidity:
            </span>
            <span className="num text-xs sm:text-sm font-bold text-gain shrink-0">
              +{money(value)}
            </span>
          </div>

          {/* Clicks Remaining Counter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <span className="font-medium">Clicks Remaining:</span>
            <span className="num font-bold text-primary-glow">
              {maxed ? "0" : Math.max(0, req - shownCount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
