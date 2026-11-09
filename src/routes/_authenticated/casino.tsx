import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CasinoHub } from "@/components/game/CasinoHub";
import { Loading } from "@/components/game/ui";
import { useGame } from "@/hooks/use-game";
import { CasinoTable } from "@/components/game/CasinoTable";

export const Route = createFileRoute("/_authenticated/casino")({
  head: () => ({
    meta: [
      { title: "Capital Casino — Capitalfortune" },
      { name: "description", content: "A connected virtual casino with five playable mini-games, virtual chips and loyalty progress." },
    ],
  }),
  component: CasinoPage,
});

function CasinoPage() {
  const { data } = useGame();
  const [tableOpen, setTableOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<"Roulette" | "Blackjack" | "Mines" | "Keno" | "Hi-Lo">("Roulette");
  const navigate = useNavigate();
  if (!data) return <Loading />;
  if (tableOpen) return <div className="casino-table-shell cf-casino-live-route pb-4">
    <div className="cf-game-route-bar mb-3 flex items-center justify-between border-b border-violet-400/20 pb-2">
      <button onClick={() => setTableOpen(false)} className="text-xs font-bold text-primary">‹ CASINO FLOOR</button>
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">VIRTUAL CHIPS · PORTRAIT TABLE</span>
    </div>
    <CasinoTable initialGame={selectedGame} />
  </div>;
  return <CasinoHub onClose={() => navigate({ to: "/home" })} onPlay={(game) => { setSelectedGame(game); setTableOpen(true); }} />;
}
