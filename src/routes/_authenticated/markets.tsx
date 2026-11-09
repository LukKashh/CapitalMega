import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ListOrdered, Lock, Search, Wallet } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { cryptoNow, stocksNow, UNLOCKS } from "@/game/engine";
import {
  cryptoPriceAtTick,
  cryptoTick,
  stockPriceAtTick,
  stockTick,
  upcomingStockListing,
} from "@/game/market";
import { duration, money, pct, price } from "@/lib/format";
import { Card, Empty, GameScrollContainer, Loading, Pill, Segmented } from "@/components/game/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetInspectView } from "@/components/game/AssetInspectView";
import { PersonalBalanceBadge } from "@/components/game/PersonalBalanceBadge";

export const Route = createFileRoute("/_authenticated/markets")({
  head: () => ({
    meta: [
      { title: "Unified Global Exchange Gateway — Capitalfortune" },
      { name: "description", content: "Simulated stock and crypto exchanges." },
      { property: "og:title", content: "Unified Global Exchange Gateway — Capitalfortune" },
      { property: "og:description", content: "Simulated stock and crypto exchanges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketsPage,
});

type Tab = "stocks" | "crypto";

// Stock specific filters: Highest Growth in a Day; Biggest dip in a Day; Highest Dividends; Biggest capitalization; Lowest cap.
type StockFilter = "growth" | "dip" | "dividends" | "marketCapDesc" | "marketCapAsc";

// Crypto specific filters: Highest Growth in a Day; Biggest dip in a Day; Stables; High volatility.
type CryptoFilter = "growth" | "dip" | "stables" | "volatility";

function MarketsPage() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 10_000);
  const { run, pending } = useAct();
  const [tab, setTab] = useState<Tab>("stocks");
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [pf, setPf] = useState<Tab>("stocks");
  const [portfolioTab, setPortfolioTab] = useState<"holdings" | "orders">("holdings");

  // Selected asset for modal inspection pop-up window
  const [selectedAsset, setSelectedAsset] = useState<{
    market: "stock" | "crypto";
    sym: string;
  } | null>(null);

  // Specific filters (search removed as requested)
  const [stockFilter, setStockFilter] = useState<StockFilter>("growth");
  const [cryptoFilter, setCryptoFilter] = useState<CryptoFilter>("growth");

  // Pagination (6 items per page)
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const st = stocksNow(now);
  const cr = cryptoNow(now);

  const rows = useMemo(() => {
    const sk = stockTick(now);
    const ck = cryptoTick(now);

    const stockRows = st.list.map((s) => {
      const p = stockPriceAtTick(s, sk);
      const prev = stockPriceAtTick(s, sk - 288);
      const cap = p * s.shares;
      return { s, p, ch: p / prev - 1, cap };
    });

    const cryptoRows = cr.list.map((c) => {
      const p = cryptoPriceAtTick(c, ck);
      const prev = cryptoPriceAtTick(c, ck - 720);
      return { c, p, ch: p / prev - 1 };
    });

    // Apply Stock Filter
    if (stockFilter === "growth") {
      stockRows.sort((a, b) => b.ch - a.ch);
    } else if (stockFilter === "dip") {
      stockRows.sort((a, b) => a.ch - b.ch);
    } else if (stockFilter === "dividends") {
      stockRows.sort((a, b) => b.s.dividendYield - a.s.dividendYield);
    } else if (stockFilter === "marketCapDesc") {
      stockRows.sort((a, b) => b.cap - a.cap);
    } else if (stockFilter === "marketCapAsc") {
      stockRows.sort((a, b) => a.cap - b.cap);
    }

    // Apply Crypto Filter
    if (cryptoFilter === "growth") {
      cryptoRows.sort((a, b) => b.ch - a.ch);
    } else if (cryptoFilter === "dip") {
      cryptoRows.sort((a, b) => a.ch - b.ch);
    } else if (cryptoFilter === "stables") {
      const volMap: Record<string, number> = {
        low: 1,
        moderate: 2,
        high: 3,
        "very high": 4,
        extreme: 5,
      };
      cryptoRows.sort((a, b) => (volMap[a.c.profile] ?? 99) - (volMap[b.c.profile] ?? 99));
    } else if (cryptoFilter === "volatility") {
      const volMap: Record<string, number> = {
        low: 1,
        moderate: 2,
        high: 3,
        "very high": 4,
        extreme: 5,
      };
      cryptoRows.sort((a, b) => (volMap[b.c.profile] ?? 0) - (volMap[a.c.profile] ?? 0));
    }

    return { stocks: stockRows, crypto: cryptoRows };
  }, [now, st, cr, stockFilter, cryptoFilter]);

  if (!data) return <Loading />;
  const s = data.state;
  const upcoming = upcomingStockListing(now);

  const holdings = [
    ...Object.entries(s.stocks.holdings).map(([sym, h]) => {
      const d = st.map[sym];
      const p = d ? stockPriceAtTick(d, stockTick(now)) : 0;
      const dy = d && d.dividendYield > 0 ? d.dividendYield : 0;
      return {
        market: "stock" as const,
        sym,
        name: d?.name ?? sym,
        h,
        value: h.qty * p,
        pl: h.qty * p - h.cost,
        dy,
        divDay: (h.qty * p * dy) / 365,
      };
    }),
    ...Object.entries(s.crypto.holdings).map(([sym, h]) => {
      const d = cr.map[sym];
      const p = d ? cryptoPriceAtTick(d, cryptoTick(now)) : 0;
      return {
        market: "crypto" as const,
        sym,
        name: d?.name ?? sym,
        h,
        value: h.qty * p,
        pl: h.qty * p - h.cost,
        dy: 0,
        divDay: 0,
      };
    }),
  ];
  const shown = holdings.filter((h) => h.market === (pf === "stocks" ? "stock" : "crypto"));
  const sum = (a: typeof holdings) => a.reduce((t, h) => t + h.value, 0);
  const walletTotal = sum(holdings);
  const typeTotal = sum(shown);
  const typePl = shown.reduce((t, h) => t + h.pl, 0);
  const divDay = shown.reduce((t, h) => t + h.divDay, 0);

  const activeRows = tab === "stocks" ? rows.stocks : rows.crypto;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 mb-2">
        {/* Centered Menu UI Header Text with Personal Balance Indicator */}
        <div className="flex items-center justify-between gap-2 py-1 px-1">
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Global Exchange HUB
            </h1>
          </div>
          <PersonalBalanceBadge />
        </div>

        {/* Shortened Centered Private Portfolio Window Button */}
        <div className="flex justify-center">
          <Button
            variant={showPortfolio ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPortfolio(!showPortfolio)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold shadow-sm rounded-xl border border-primary/40 bg-card/85 hover:bg-card transition"
          >
            <Wallet className="h-4 w-4 text-gold" />
            <span>Private Portfolio</span>
          </Button>
        </div>

        {/* Separate Pop-up Window Box over main game screen with Wallet contents & Order History */}
        <Dialog open={showPortfolio} onOpenChange={setShowPortfolio}>
          <DialogContent className="max-w-md bg-card border-primary/45 p-5 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Private Portfolio & Orders</span>
                <span className="num text-xs font-bold text-gain">{money(walletTotal)}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={portfolioTab === "holdings" ? "secondary" : "ghost"}
                    onClick={() => setPortfolioTab("holdings")}
                    className="h-7 text-xs font-semibold px-2.5"
                  >
                    Holdings ({holdings.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={portfolioTab === "orders" ? "secondary" : "ghost"}
                    onClick={() => setPortfolioTab("orders")}
                    className="h-7 text-xs font-semibold px-2.5 gap-1"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    Orders ({s.orders.length})
                  </Button>
                </div>
              </div>

              {portfolioTab === "holdings" ? (
                <div>
                  <Segmented
                    value={pf}
                    onChange={setPf}
                    options={[
                      { id: "stocks", label: "Stocks" },
                      { id: "crypto", label: "Crypto" },
                    ]}
                  />
                  <div className="my-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground">
                        {pf === "stocks" ? "Stocks" : "Crypto"} value
                      </div>
                      <div className="num font-semibold">{money(typeTotal)}</div>
                      <div className={`num text-[11px] ${typePl >= 0 ? "text-gain" : "text-loss"}`}>
                        {money(typePl, { sign: true })}
                      </div>
                    </div>
                    {pf === "stocks" ? (
                      <div className="sm:text-right">
                        <div className="text-[10px] text-muted-foreground">Dividend income</div>
                        <div className="num font-semibold text-gain">{money(divDay)}/day</div>
                        <div className="text-[10px] text-muted-foreground">
                          Yield: {pct(typeTotal > 0 ? (divDay * 365) / typeTotal : 0, 2)}
                        </div>
                      </div>
                    ) : (
                      <div className="sm:text-right">
                        <div className="text-[10px] text-muted-foreground">Holdings Count</div>
                        <div className="num font-semibold">{shown.length} assets</div>
                      </div>
                    )}
                  </div>

                  {shown.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No {pf} owned yet.
                    </p>
                  ) : (
                    <div className="max-h-60 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
                      {shown.map((h) => (
                        <div
                          key={h.market + h.sym}
                          onClick={() => {
                            setShowPortfolio(false);
                            setSelectedAsset({ market: h.market, sym: h.sym });
                          }}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-xs">{h.sym}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {h.h.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                              units
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="num text-xs font-semibold">{money(h.value)}</div>
                            <div
                              className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}
                            >
                              {money(h.pl, { sign: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Order History inside Popup Dialog Window */
                <div className="max-h-64 overflow-y-auto overscroll-contain pr-1 space-y-1.5">
                  {s.orders.length === 0 ? (
                    <Empty title="No orders" text="Your order history will appear here." />
                  ) : (
                    s.orders.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-xs">
                              {o.side.toUpperCase()} {o.sym}{" "}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {o.kind}
                                {o.limit ? ` @ ${price(o.limit)}` : ""}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {o.filled.toLocaleString(undefined, { maximumFractionDigits: 4 })}/
                              {o.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} filled
                              · {date(o.createdAt)}
                            </div>
                          </div>
                          <Pill
                            tone={
                              o.status === "Executed"
                                ? "gain"
                                : o.status === "Cancelled" || o.status === "Expired"
                                  ? "muted"
                                  : "primary"
                            }
                          >
                            {o.status}
                          </Pill>
                        </div>
                        {(o.status === "Open" ||
                          o.status === "Partially Filled" ||
                          o.status === "Triggered") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 h-6 text-[10px]"
                            disabled={pending}
                            onClick={() =>
                              run({ type: "cancelOrder", id: o.id }, "Order cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Exchange Tabs: Stocks | Crypto */}
        <Segmented
          value={tab}
          onChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          options={[
            { id: "stocks", label: "Stocks" },
            { id: "crypto", label: "Crypto" },
          ]}
        />

        {s.level < (tab === "stocks" ? UNLOCKS.stocks : UNLOCKS.crypto) && (
          <Card className="flex items-center gap-2 border-warn/40 text-xs py-2 px-3">
            <Lock className="h-3.5 w-3.5 text-warn shrink-0" />
            <span>
              Trading unlocks at Player Level {tab === "stocks" ? UNLOCKS.stocks : UNLOCKS.crypto}.
              You can browse now.
            </span>
          </Card>
        )}

        {/* Specific Product Filters Bar */}
        {tab === "stocks" ? (
          <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: "growth" as const, label: "Top gainers" },
              { id: "dip" as const, label: "Top losers" },
              { id: "dividends" as const, label: "Dividends" },
              { id: "marketCapDesc" as const, label: "Largest cap" },
              { id: "marketCapAsc" as const, label: "Smallest cap" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setStockFilter(f.id);
                  setPage(1);
                }}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  stockFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: "growth" as const, label: "Top gainers" },
              { id: "dip" as const, label: "Top losers" },
              { id: "stables" as const, label: "Stable" },
              { id: "volatility" as const, label: "High volatility" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setCryptoFilter(f.id);
                  setPage(1);
                }}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  cryptoFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {tab === "stocks" && (
          <div className="px-1 text-[11px] text-muted-foreground">
            Next IPO: {upcoming.name} in {duration(upcoming.at - now)}
          </div>
        )}
        {tab === "crypto" && (
          <div className="px-1 text-[11px] text-muted-foreground">24/7 market</div>
        )}
      </div>

      <GameScrollContainer>
        {tab === "stocks"
          ? (pagedRows as typeof rows.stocks).map((r) => (
              <div
                key={r.s.ticker}
                onClick={() => setSelectedAsset({ market: "stock", sym: r.s.ticker })}
                className="game-market-row flex cursor-pointer items-center justify-between gap-2 px-3 py-2"
              >
                <span className="game-market-monogram">{r.s.ticker.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                    <span>{r.s.ticker}</span>
                    {r.s.generated && <Pill tone="primary">New</Pill>}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">{r.s.name}</div>
                </div>
                <Sparkline
                  values={Array.from({ length: 18 }, (_, i) =>
                    stockPriceAtTick(r.s, stockTick(now) - (17 - i) * 16),
                  )}
                  up={r.ch >= 0}
                />
                <div className="shrink-0 text-right">
                  <div className="num text-xs sm:text-sm font-semibold">{price(r.p)}</div>
                  <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                    {pct(r.ch, 2, true)}
                  </div>
                </div>
              </div>
            ))
          : (pagedRows as typeof rows.crypto).map((r) => (
              <div
                key={r.c.symbol}
                onClick={() => setSelectedAsset({ market: "crypto", sym: r.c.symbol })}
                className="game-market-row flex cursor-pointer items-center justify-between gap-2 px-3 py-2"
              >
                <span className="game-market-monogram">{r.c.symbol.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs sm:text-sm">{r.c.symbol}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{r.c.name}</div>
                </div>
                <Sparkline
                  values={Array.from({ length: 18 }, (_, i) =>
                    cryptoPriceAtTick(r.c, cryptoTick(now) - (17 - i) * 40),
                  )}
                  up={r.ch >= 0}
                />
                <div className="shrink-0 text-right">
                  <div className="num text-xs sm:text-sm font-semibold">{price(r.p)}</div>
                  <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                    {pct(r.ch, 2, true)}
                  </div>
                </div>
              </div>
            ))}

        {/* Pagination Navigation Controls (6 items per page) */}
        {totalPages > 1 && (
          <div className="mt-3 mb-2 flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 text-xs"
            >
              Previous
            </Button>
            <div className="font-mono text-muted-foreground text-[11px]">
              Page <span className="font-bold text-foreground">{currentPage}</span> of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 gap-1 text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </GameScrollContainer>

      {/* Pop-up Window Dialog for inspecting specific stock or crypto listings */}
      <Dialog open={!!selectedAsset} onOpenChange={(o) => !o && setSelectedAsset(null)}>
        <DialogContent className="max-w-lg bg-card border-primary/45 p-5 max-h-[85vh] overflow-y-auto">
          {selectedAsset && (
            <AssetInspectView
              market={selectedAsset.market}
              sym={selectedAsset.sym}
              onClose={() => setSelectedAsset(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  const low = Math.min(...values),
    high = Math.max(...values);
  const points = values
    .map(
      (v, i) =>
        `${(i * 58) / Math.max(1, values.length - 1)},${24 - ((v - low) / (high - low || 1)) * 22}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 58 26"
      aria-hidden="true"
      className={`game-sparkline ${up ? "text-gain" : "text-loss"}`}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
