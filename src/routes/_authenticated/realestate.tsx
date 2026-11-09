import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Home, Lock } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { PROPERTIES } from "@/game/config";
import { conditionLabel, personalMods, propertyEcon, UNLOCKS } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { money, pct } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameImg,
  GameScrollContainer,
  Loading,
  PageHeader,
  Pill,
  Segmented,
} from "@/components/game/ui";
import { propertyImage } from "@/components/game/art";
import { BuildingSprite } from "@/components/game/BuildingSprite";
import { WALLET_REFRESH_MS, liveRentWallet } from "@/components/game/wallet";
import { Button } from "@/components/ui/button";
import { PersonalBalanceBadge } from "@/components/game/PersonalBalanceBadge";
import { AssetsTabs } from "@/components/game/AssetsTabs";

export const Route = createFileRoute("/_authenticated/realestate")({
  head: () => ({
    meta: [
      { title: "Real Estate — Capitalfortune" },
      { name: "description", content: "Rental property investments." },
      { property: "og:title", content: "Real Estate — Capitalfortune" },
      { property: "og:description", content: "Rental property investments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RealEstatePage,
});

function RealEstatePage() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, WALLET_REFRESH_MS);
  const { run, pending } = useAct();
  const [tab, setTab] = useState<"owned" | "market">("owned");
  const [cat, setCat] = useState("All");
  const p = useMemo(() => (data ? personalMods(data.state) : null), [data]);
  const cm = useMemo(() => (data ? corpMods(data.corp) : null), [data]);
  if (!data || !p || !cm) return <Loading />;
  const s = data.state;
  const owned = Object.values(s.properties);
  const propertyRows = owned.map((pr) => ({ pr, e: propertyEcon(pr, p, cm, now) }));
  const cats = ["All", ...new Set(PROPERTIES.map((x) => x.category))];
  const locked = s.level < UNLOCKS.realEstate;
  const rentNet = propertyRows.reduce((total, row) => total + row.e.net, 0);
  const rentWallet = propertyRows.reduce(
    (total, row) => total + liveRentWallet(row.pr, row.e.net, s.lastTick, now),
    0,
  );
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-1">
        <AssetsTabs active="re" />
        <div className="flex items-start justify-between gap-2">
          <PageHeader
            title="Real Estate"
            subtitle="Rental property investments · resale at 75% of value"
          />
          <PersonalBalanceBadge />
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "owned", label: `My properties (${owned.length})` },
            { id: "market", label: "Marketplace" },
          ]}
        />
      </div>

      {tab === "owned" &&
        (owned.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <Empty
              icon={<Home className="h-8 w-8" />}
              title="No properties yet"
              text="Buy a rental to start earning rent every hour."
              action={<Button onClick={() => setTab("market")}>Browse properties</Button>}
            />
          </div>
        ) : (
          <GameScrollContainer className="space-y-2.5">
            <Card className="border-primary/40">
              <div className="text-xs text-muted-foreground">Rent wallet · {money(rentNet)}/h</div>
              <div className="num text-2xl font-bold text-gain">{money(rentWallet)}</div>
              <Button
                className="mt-2 w-full bg-gradient-primary"
                disabled={pending || rentWallet < 0.01}
                onClick={() => run({ type: "collectRent" }, "Transferred to balance")}
              >
                Transfer to balance
              </Button>
            </Card>
            {propertyRows.map(({ pr, e }) => {
              const d = PROPERTIES.find((x) => x.id === pr.defId)!;
              return (
                <Link key={pr.inst} to="/realestate/$inst" params={{ inst: pr.inst }}>
                  <Card className="mb-2 flex gap-3 p-3">
                    <BuildingSprite
                      propertyCategory={d.category}
                      propertyName={d.name}
                      fit="cover"
                      className="h-20 w-24 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 p-1 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.category} · {d.location}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Pill
                          tone={pr.condition >= 65 ? "gain" : pr.condition >= 40 ? "warn" : "loss"}
                        >
                          {conditionLabel(pr.condition)}
                        </Pill>
                        <Pill>{pct(e.occupancy, 0)} occupied</Pill>
                      </div>
                      <div className={`num mt-1 text-sm ${e.net >= 0 ? "text-gain" : "text-loss"}`}>
                        {money(e.net)}/h net · wallet{" "}
                        {money(liveRentWallet(pr, e.net, s.lastTick, now))}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </GameScrollContainer>
        ))}

      {tab === "market" && (
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="shrink-0 px-1">
            {locked && (
              <Card className="mb-2 flex items-center gap-2 border-warn/40 text-sm py-2 px-3">
                <Lock className="h-4 w-4 text-warn shrink-0" />
                <span>Property purchases unlock at Player Level {UNLOCKS.realEstate}.</span>
              </Card>
            )}
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {cats.map((c) => (
                <Button
                  variant="ghost"
                  size="sm"
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <GameScrollContainer className="space-y-3 px-1">
            {PROPERTIES.filter(
              (x) => (cat === "All" || x.category === cat) && !owned.some((o) => o.defId === x.id),
            )
              .sort((a, b) => a.price - b.price)
              .map((d) => (
                <Card key={d.id} className="flex items-center gap-3 p-3">
                  <BuildingSprite
                    propertyCategory={d.category}
                    propertyName={d.name}
                    fit="cover"
                    className="game-art h-14 w-16 shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 via-muted/30 to-card p-1 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {d.category} · {d.location}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px]">
                      <span className="text-muted-foreground">
                        Rent <span className="num font-semibold text-gain">{money(d.rent)}/h</span>
                      </span>
                      <span className="text-muted-foreground">
                        Price{" "}
                        <span className="num font-semibold text-foreground">{money(d.price)}</span>
                      </span>
                    </div>
                  </div>
                  <Confirm
                    trigger={
                      <Button
                        size="sm"
                        className="h-8 shrink-0 px-3 text-[11px] bg-gradient-primary"
                        disabled={locked || pending || s.cash < d.price}
                      >
                        Buy
                      </Button>
                    }
                    title={`Buy ${d.name}?`}
                    description={`${money(d.price)} from your balance. Rent = base × occupancy × demand, minus expenses.`}
                    onConfirm={() =>
                      run({ type: "buyProperty", defId: d.id }, "Property purchased")
                    }
                  />
                </Card>
              ))}
          </GameScrollContainer>
        </div>
      )}
    </div>
  );
}
