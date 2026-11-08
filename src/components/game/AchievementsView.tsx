import { Card, Pill, Progress, Row } from "@/components/game/ui";
import { useGame } from "@/hooks/use-game";
import { ACHIEVEMENTS, type StatKey } from "@/game/achievements";
import { money } from "@/lib/format";
import { Trophy, Award, BarChart3, CheckCircle2, Lock } from "lucide-react";

const STAT_LABELS: Record<string, string> = {
  clicks: "Total Clicks / Taps",
  lifetimeEarned: "Lifetime Wealth Earned",
  companiesBought: "Companies Acquired",
  companiesSold: "Companies Sold",
  branches: "Company Branches Built",
  upgrades: "Business Upgrades",
  hires: "Employees Recruited",
  stockTrades: "Stock Market Trades",
  cryptoTrades: "Crypto Trades",
  dividends: "Dividends Collected",
  propertiesBought: "Real Estate Acquired",
  rentEarned: "Property Rent Collected",
  collectiblesBought: "Luxuries Acquired",
  collectionsDone: "Sets Completed",
  researchDone: "R&D Projects Completed",
  level: "Tycoon Level",
  netWorth: "Peak Net Worth",
  corpContributed: "Corp Funds Contributed",
  maintenance: "Maintenance Operations",
  clickerLevel: "Clicker Mastery Level",
};

export function AchievementsView() {
  const { data } = useGame();
  if (!data) return null;
  const s = data.state;
  const unlockedCount = Object.keys(s.achievements).length;
  const totalAchievements = ACHIEVEMENTS.length;
  const progressPct = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-xl border border-primary/30 bg-card/75 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Achievements Unlocked</div>
            <div className="text-base font-bold text-foreground">
              {unlockedCount} / {totalAchievements} ({progressPct}%)
            </div>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {/* Tycoon Statistics */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2 font-bold text-sm text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" />
          Executive Statistics & Records
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-xs">
          {Object.entries(s.stats).map(([k, v]) => {
            const label = STAT_LABELS[k] || k;
            const formatted =
              typeof v === "number" &&
              (k.toLowerCase().includes("earned") ||
                k.toLowerCase().includes("worth") ||
                k.toLowerCase().includes("rent") ||
                k.toLowerCase().includes("dividends"))
                ? money(v)
                : typeof v === "number"
                  ? v.toLocaleString()
                  : String(v);
            return <Row key={k} label={label} value={formatted} />;
          })}
        </div>
      </Card>

      {/* Achievements Catalogue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" />
            Milestone Achievements Catalogue
          </h4>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((ach) => {
            const isDone = !!s.achievements[ach.id];
            const statVal = s.stats[ach.stat as StatKey] || 0;
            const targetVal = ach.target;
            const achProgress = Math.min(100, Math.round((statVal / targetVal) * 100));

            return (
              <Card
                key={ach.id}
                className={`p-3 space-y-2 border transition-all ${
                  isDone ? "border-gain/40 bg-gain/5" : "border-border/70 bg-card/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-gain shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      {ach.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ach.desc}</div>
                  </div>
                  <Pill tone={isDone ? "gain" : "neutral"} className="text-[10px] shrink-0">
                    {ach.tier}
                  </Pill>
                </div>

                <div className="pt-1.5 space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span>
                    <span className="num font-semibold text-foreground">
                      {typeof statVal === "number" && statVal > 1000 ? money(statVal) : statVal} /{" "}
                      {typeof targetVal === "number" && targetVal > 1000
                        ? money(targetVal)
                        : targetVal}
                    </span>
                  </div>
                  <Progress value={isDone ? 100 : achProgress} className="h-1.5" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
