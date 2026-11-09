import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Clock } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { COMPANIES, type CompanyDef } from "@/game/config";
import {
  capacityUpgradeCost,
  capacityUpgradeHours,
  companyEcon,
  companyValuation,
  personalMods,
} from "@/game/engine";
import { corpMods } from "@/game/corp";
import { duration, money } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameImg,
  GameScrollContainer,
  Loading,
  PageHeader,
  Pill,
  Progress,
  Row,
  Segmented,
  Stat,
} from "@/components/game/ui";
import { Button } from "@/components/ui/button";
import { companyImage } from "@/components/game/art";
import { BuildingSprite } from "@/components/game/BuildingSprite";
import { WALLET_REFRESH_MS, liveCompanyWallet, liveRentWallet } from "@/components/game/wallet";
import { OverviewPanel } from "@/components/game/OverviewPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PersonalBalanceBadge } from "@/components/game/PersonalBalanceBadge";

export const Route = createFileRoute("/_authenticated/empire")({
  head: () => ({
    meta: [
      { title: "Business Empire — Capitalfortune" },
      { name: "description", content: "Manage and acquire companies." },
      { property: "og:title", content: "Business Empire — Capitalfortune" },
      { property: "og:description", content: "Manage and acquire companies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmpirePage,
});

const statusTone = (s: string) =>
  (s === "Profitable"
    ? "gain"
    : s === "Break-even"
      ? "muted"
      : s === "Unprofitable"
        ? "warn"
        : "loss") as "gain" | "muted" | "warn" | "loss";

function EmpirePage() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, WALLET_REFRESH_MS);
  const { run, pending } = useAct();
  const [tab, setTab] = useState<"owned" | "market" | "report">("owned");
  const [detail, setDetail] = useState<CompanyDef | null>(null);
  const p = useMemo(() => (data ? personalMods(data.state) : null), [data]);
  const cm = useMemo(() => (data ? corpMods(data.corp) : null), [data]);
  if (!data || !p || !cm) return <Loading />;
  const s = data.state;
  const owned = Object.values(s.companies);
  const econ = owned.map((o) => ({ o, e: companyEcon(o, p, cm, now) }));
  const totals = econ.reduce(
    (a, { o, e }) => ({
      rev: a.rev + e.revenue,
      exp: a.exp + e.expenses,
      val: a.val + companyValuation(o),
      unc: a.unc + liveCompanyWallet(o, e.net, s.lastTick, now),
      inv: a.inv + o.price + o.upgradeValue,
      life: a.life + o.revenueTotal - o.expenseTotal,
    }),
    { rev: 0, exp: 0, val: 0, unc: 0, inv: 0, life: 0 },
  );
  const up = s.capacity.upgrading;
  const capCost = capacityUpgradeCost(s.capacity.level);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 mb-2">
        <div className="flex items-start justify-between gap-2">
          <PageHeader
            title="Business Empire"
            subtitle={`${owned.length}/${s.capacity.slots} company slots used`}
          />
          <PersonalBalanceBadge />
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "owned", label: "My companies" },
            { id: "market", label: "Marketplace" },
            { id: "report", label: "Report" },
          ]}
        />
      </div>

      <GameScrollContainer>
        {tab === "owned" && (
          <div className="space-y-3">
            {owned.length === 0 ? (
              <Empty
                icon={<Building2 className="h-8 w-8" />}
                title="No companies yet"
                text="Earn your first $1,000 with the clicker, then buy Sunny Lemonade Stands from the marketplace."
                action={<Button onClick={() => setTab("market")}>Browse marketplace</Button>}
              />
            ) : (
              econ.map(({ o, e }) => {
                const d = COMPANIES.find((c) => c.id === o.defId)!;
                return (
                  <Link key={o.inst} to="/empire/$inst" params={{ inst: o.inst }}>
                    <Card className="mb-3 flex flex-col gap-3 p-4">
                      <div className="flex gap-4">
                        <BuildingSprite
                          businessDefId={d.id}
                          fit="cover"
                          className="game-art h-20 w-24 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 shadow-xs"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold">{d.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {d.industry} · {o.branches} branches · {e.staff}/{e.need} staff
                              </div>
                            </div>
                            <Pill tone={statusTone(e.status)}>{e.status}</Pill>
                          </div>
                          <div className="num mt-1 text-xs text-gain">
                            Wallet: {money(liveCompanyWallet(o, e.net, s.lastTick, now))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Revenue/h
                          </div>
                          <div className="num text-xs font-semibold">{money(e.revenue)}</div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Expenses/h
                          </div>
                          <div className="num text-xs font-semibold">{money(e.expenses)}</div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Net/h
                          </div>
                          <div
                            className={`num text-xs font-semibold ${e.net >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            {money(e.net)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}

            {/* Business Wallet Tab Relocated to Bottom, with Occupancy and '+1 Extra Slot' Upgrade in Upper Right Corner */}
            <Card className="border-primary/40 bg-card/90 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Business wallet · {money(totals.rev - totals.exp)}/h
                  </div>
                  <div className="num text-2xl font-bold text-gain mt-0.5">{money(totals.unc)}</div>
                </div>

                {/* Upper Right Corner: Occupancy Value and '+1 Extra Slot' Upgrade Button */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Occupancy:</span>
                    <span className="rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-primary-glow">
                      {owned.length}/{s.capacity.slots} Slots
                    </span>
                  </div>

                  {up ? (
                    <div className="flex items-center gap-1">
                      <Pill tone="primary" className="text-[10px] py-0.5 px-1.5">
                        <Clock className="mr-0.5 h-3 w-3 inline" />
                        {duration(up.endsAt - now)}
                      </Pill>
                    </div>
                  ) : (
                    <Confirm
                      trigger={
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 text-[11px] px-2 font-medium border border-primary/30 rounded-lg hover:border-primary/60 transition-colors"
                          disabled={s.cash < capCost}
                        >
                          +1 Extra Slot · {money(capCost)}
                        </Button>
                      }
                      title="Start capacity upgrade?"
                      description={
                        <>
                          Costs {money(capCost)} and takes{" "}
                          {duration(capacityUpgradeHours(s.capacity.level) * 3600_000)} of real
                          time. You can't buy companies until it completes.
                        </>
                      }
                      onConfirm={() => run({ type: "capacityUpgrade" }, "Upgrade started")}
                    />
                  )}
                </div>
              </div>

              {up && (
                <div className="mt-2 flex items-center gap-2">
                  <Progress
                    className="h-1.5 flex-1"
                    value={
                      1 - (up.endsAt - now) / (capacityUpgradeHours(s.capacity.level) * 3600_000)
                    }
                  />
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                    {duration(up.endsAt - now)} left
                  </span>
                </div>
              )}

              <Button
                className="mt-3 w-full bg-gradient-primary h-9 text-xs font-semibold"
                disabled={pending || totals.unc < 0.01}
                onClick={() => run({ type: "collect" }, "Transferred to balance")}
              >
                Transfer {money(totals.unc)} to balance
              </Button>
            </Card>
          </div>
        )}

        {tab === "market" && (
          <div className="space-y-3 px-1">
            <p className="px-1 text-[11px] text-muted-foreground">
              Browse available companies. Select a listing for full financial details.
            </p>
            {[...COMPANIES]
              .sort((a, b) => a.price - b.price)
              .map((d) => (
                <Card
                  key={d.id}
                  onClick={() => setDetail(d)}
                  className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:border-primary/40"
                >
                  <BuildingSprite
                    businessDefId={d.id}
                    fit="cover"
                    className="game-art h-14 w-16 shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 via-muted/30 to-card shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{d.industry}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Base revenue{" "}
                      <span className="num font-semibold text-gain">{money(d.revenue)}/h</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-sm font-bold text-foreground">{money(d.price)}</div>
                    <div className="text-[10px] text-muted-foreground">View details</div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-3">
            <OverviewPanel />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Stat label="Revenue /h" value={money(totals.rev)} />
              <Stat label="Expenses /h" value={money(totals.exp)} />
              <Stat
                label="Net profit /h"
                value={money(totals.rev - totals.exp)}
                tone={totals.rev >= totals.exp ? "gain" : "loss"}
              />
              <Stat label="Valuation" value={money(totals.val)} />
              <Stat label="Invested" value={money(totals.inv)} />
              <Stat
                label="Lifetime ROI"
                value={totals.inv ? `${((totals.life / totals.inv) * 100).toFixed(1)}%` : "—"}
                tone={totals.life >= 0 ? "gain" : "loss"}
              />
            </div>
            <Card>
              <div className="mb-2 text-sm font-semibold">Sale history</div>
              {s.soldCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No companies sold yet.</p>
              ) : (
                s.soldCompanies.map((x, i) => (
                  <Row key={i} label={x.name} value={money(x.payout)} />
                ))
              )}
            </Card>
          </div>
        )}
      </GameScrollContainer>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {detail && (
            <>
              <SheetHeader className="flex flex-row items-center justify-between pr-6">
                <SheetTitle>{detail.name}</SheetTitle>
                <PersonalBalanceBadge />
              </SheetHeader>
              <BuildingSprite
                businessDefId={detail.id}
                fit="cover"
                className="game-art mt-3 h-48 w-full rounded-2xl bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 p-2 shadow-sm"
              />
              <p className="mt-1 text-sm text-muted-foreground">{detail.modelDesc}</p>
              <div className="mt-3 divide-y divide-border">
                <Row label="Price" value={money(detail.price)} />
                <Row label="Base revenue /h" value={money(detail.revenue)} />
                <Row label="Fixed expenses /h" value={money(detail.fixedExpense)} />
                <Row label="Starting reserves" value={money(detail.reserves)} />
                <Row
                  label="Existing liabilities"
                  value={money(detail.liabilities)}
                  tone={detail.liabilities ? "warn" : undefined}
                />
                <Row
                  label="Starting workforce"
                  value={`${detail.startStaff} (cap ${detail.staffCapacity})`}
                />
                <Row
                  label="Roles"
                  value={detail.roles.map((r) => `${r.role} $${r.salary}/h`).join(", ")}
                />
                <Row
                  label="Branches"
                  value={
                    detail.branch
                      ? `Up to ${detail.branch.max}, from ${money(detail.branch.cost)}`
                      : "Not available"
                  }
                />
                <Row
                  label="Offline income"
                  value={
                    detail.offlineEligible ? `Up to ${detail.offlineMaxHours}h` : "Not eligible"
                  }
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Staffing rule: {detail.shortageRule}
              </p>
              <Confirm
                trigger={
                  <Button
                    className="mt-4 h-11 w-full bg-gradient-primary"
                    disabled={
                      pending || s.cash < detail.price || !!up || owned.length >= s.capacity.slots
                    }
                  >
                    {up
                      ? "Capacity upgrade in progress"
                      : owned.length >= s.capacity.slots
                        ? "No free slots"
                        : s.cash < detail.price
                          ? `Need ${money(detail.price - s.cash)} more`
                          : `Buy for ${money(detail.price)}`}
                  </Button>
                }
                title={`Buy ${detail.name}?`}
                description={
                  <>
                    {money(detail.price)} will be deducted from your balance. You must own it for at
                    least 6 hours before reselling (80% of valuation).
                  </>
                }
                onConfirm={() =>
                  run({ type: "buyCompany", defId: detail.id }, `Acquired ${detail.name}`).then(
                    () => setDetail(null),
                  )
                }
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
