import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Grid3x3, List } from "lucide-react";
import { useGame, useNow } from "@/hooks/use-game";
import {
  CATEGORIES,
  COLLECTIBLES,
  COLLECTIBLE_BY_ID,
  COLLECTIONS,
  RARITIES,
  currentValue,
  demandLabel,
} from "@/game/collectibles";
import { getCollectibleStock } from "@/lib/game.functions";
import { duration, money, pct } from "@/lib/format";
import {
  Card,
  Empty,
  GameScrollContainer,
  Loading,
  PageHeader,
  Pill,
  Progress,
  Segmented,
} from "@/components/game/ui";
import { CollectibleIcon } from "@/components/game/CollectibleIcon";
import { AssetsTabs } from "@/components/game/AssetsTabs";
import { PersonalBalanceBadge } from "@/components/game/PersonalBalanceBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/collectibles")({
  head: () => ({
    meta: [
      { title: "Collectibles — Capitalfortune" },
      { name: "description", content: "Luxury assets, collections and valuations." },
      { property: "og:title", content: "Collectibles — Capitalfortune" },
      { property: "og:description", content: "Luxury assets, collections and valuations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollectiblesPage,
});

type Sort = "price" | "value" | "rarity" | "change" | "demand" | "name";

function CollectiblesPage() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 30_000);
  const { data: stock } = useQuery({
    queryKey: ["collectible-stock"],
    queryFn: () => getCollectibleStock(),
    staleTime: 30_000,
  });
  const [tab, setTab] = useState<"market" | "inventory" | "collections">("market");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cat, setCat] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [edition, setEdition] = useState("all");
  const [avail, setAvail] = useState("all");
  const [sort, setSort] = useState<Sort>("price");
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const items = useMemo(() => {
    const arr = COLLECTIBLES.map((it) => {
      const v = currentValue(it, now);
      const prev = currentValue(it, now - 7 * 86400_000);
      const sold = stock?.[it.id] ?? 0;
      const released = !it.releaseAt || it.releaseAt <= now;
      const left = it.limited ? it.limited - sold : Infinity;
      return { it, v, ch: v / prev - 1, left, released, demand: demandLabel(it, now) };
    }).filter(
      (x) =>
        (cat === "all" || x.it.category === cat) &&
        (rarity === "all" || x.it.rarity === rarity) &&
        (edition === "all" || (edition === "limited" ? !!x.it.limited : !x.it.limited)) &&
        (avail === "all" ||
          (avail === "available"
            ? x.released && x.left > 0
            : avail === "upcoming"
              ? !x.released
              : x.left <= 0)) &&
        (!q || x.it.name.toLowerCase().includes(q.toLowerCase())) &&
        (!maxPrice || x.it.price <= Number(maxPrice)),
    );
    const dOrd = { High: 2, Moderate: 1, Low: 0 } as Record<string, number>;
    arr.sort((a, b) =>
      sort === "price"
        ? a.it.price - b.it.price
        : sort === "value"
          ? b.v - a.v
          : sort === "rarity"
            ? RARITIES.indexOf(b.it.rarity) - RARITIES.indexOf(a.it.rarity)
            : sort === "change"
              ? b.ch - a.ch
              : sort === "demand"
                ? dOrd[b.demand]! - dOrd[a.demand]!
                : a.it.name.localeCompare(b.it.name),
    );
    return arr;
  }, [now, stock, cat, rarity, edition, avail, sort, q, maxPrice]);

  if (!data) return <Loading />;
  const s = data.state;
  const inv = Object.values(s.collectibles);
  const owned = new Set(inv.map((o) => o.itemId));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-1">
        <AssetsTabs active="col" />
        <div className="flex items-start justify-between gap-2">
          <PageHeader
            title="Collectibles"
            subtitle="300 items · direct purchases only, no random drops"
          />
          <PersonalBalanceBadge />
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "market", label: "Marketplace" },
            { id: "inventory", label: `Inventory (${inv.length})` },
            { id: "collections", label: "Collections" },
          ]}
        />
      </div>

      {tab === "market" &&
        (() => {
          const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
          const currentPage = Math.min(page, totalPages);
          const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

          return (
            <GameScrollContainer>
              {/* Product Type (Category) Quick Selection Tabs */}
              <div className="shrink-0 mb-2 flex gap-1 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCat("all");
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
                    cat === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All Types
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCat(c.id);
                      setPage(1);
                    }}
                    className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
                      cat === c.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Search and Secondary Filters */}
              <div className="shrink-0 mb-2 grid grid-cols-2 gap-1.5">
                <Input
                  placeholder="Search products..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="col-span-2 h-8 text-xs"
                />
                <F
                  value={rarity}
                  onChange={(v) => {
                    setRarity(v);
                    setPage(1);
                  }}
                  items={[
                    ["all", "All rarities"],
                    ...RARITIES.map((r) => [r, r] as [string, string]),
                  ]}
                />
                <F
                  value={edition}
                  onChange={(v) => {
                    setEdition(v);
                    setPage(1);
                  }}
                  items={[
                    ["all", "All editions"],
                    ["standard", "Standard"],
                    ["limited", "Limited edition"],
                  ]}
                />
              </div>

              {/* Compact list header with item count and view toggle */}
              <div className="shrink-0 mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{items.length} items</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Grid"
                    onClick={() => setView("grid")}
                    className={`rounded p-1 ${view === "grid" ? "bg-muted text-foreground" : ""}`}
                  >
                    <Grid3x3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="List"
                    onClick={() => setView("list")}
                    className={`rounded p-1 ${view === "list" ? "bg-muted text-foreground" : ""}`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Listings Grid (showing 2 Product rows per page on mobile/desktop, max 12 per page) */}
              <div
                className={
                  "min-h-0 pr-1 " + (view === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2")
                }
              >
                {pagedItems.map(({ it, v, ch, left, released }) => (
                  <Link key={it.id} to="/collectibles/$id" params={{ id: it.id }}>
                    <Card
                      className={
                        view === "grid"
                          ? "flex h-full items-center gap-2 p-2 hover:border-primary/50 transition-colors"
                          : "flex items-center gap-2 p-2 hover:border-primary/50 transition-colors"
                      }
                    >
                      <CollectibleIcon
                        category={it.category}
                        rarity={it.rarity}
                        className="h-9 w-9 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="truncate text-xs font-semibold">{it.name}</div>
                          {owned.has(it.id) && (
                            <Pill tone="gain" className="shrink-0 px-1.5 py-0 text-[9px]">
                              Owned
                            </Pill>
                          )}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {it.rarity} · {CATEGORIES.find((c) => c.id === it.category)?.name}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="num text-xs font-semibold">{money(it.price)}</span>
                          <span
                            className={`num text-[10px] ${ch >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            {pct(ch, 1, true)}
                          </span>
                        </div>
                        {it.limited && (
                          <div className="mt-0.5 text-[9px] text-amber-400">
                            {!released
                              ? `Releases in ${duration(it.releaseAt! - now)}`
                              : left > 0
                                ? `${left} of ${it.limited} remaining`
                                : "Sold out"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 mb-2 flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 gap-1 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <div className="font-mono text-muted-foreground">
                    Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
                    {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 gap-1 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </GameScrollContainer>
          );
        })()}

      {tab === "inventory" &&
        (inv.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <Empty
              title="No collectibles yet"
              text="Buy an item from the marketplace — every copy gets its own ownership record."
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
            {inv.map((o) => {
              const it = COLLECTIBLE_BY_ID[o.itemId]!;
              const v = currentValue(it, now);
              return (
                <Link key={o.inst} to="/collectibles/$id" params={{ id: it.id }}>
                  <Card className="flex items-center gap-3 p-3">
                    <CollectibleIcon
                      category={it.category}
                      rarity={it.rarity}
                      className="h-12 w-12 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Paid {money(o.price)} ·{" "}
                        {now < o.holdUntil
                          ? `hold ${duration(o.holdUntil - now)}`
                          : it.restrictedResale
                            ? "resale restricted"
                            : "sellable"}
                      </div>
                    </div>
                    <div className={`num text-sm ${v >= o.price ? "text-gain" : "text-loss"}`}>
                      {money(v)}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === "collections" && (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
          {COLLECTIONS.map((col) => {
            const have = col.items.filter((i) => owned.has(i)).length;
            const done = have === col.items.length;
            return (
              <Card key={col.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{col.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Reward {money(col.reward.cash)}
                      {col.reward.xp ? ` + ${col.reward.xp} XP` : ""} · ongoing +
                      {pct(col.bonus.value)} {col.bonus.key.replace("Pct", "")}
                    </div>
                  </div>
                  {done ? (
                    <Pill tone="gain">Active</Pill>
                  ) : s.collectionsRewarded.includes(col.id) ? (
                    <Pill tone="warn">Inactive</Pill>
                  ) : (
                    <Pill>
                      {have}/{col.items.length}
                    </Pill>
                  )}
                </div>
                <Progress value={have / col.items.length} className="mt-2" />
                <div className="mt-2 flex flex-wrap gap-1">
                  {col.items.map((i) => (
                    <Link key={i} to="/collectibles/$id" params={{ id: i }}>
                      <Pill tone={owned.has(i) ? "gain" : "muted"}>
                        {COLLECTIBLE_BY_ID[i]?.name}
                      </Pill>
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function F({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
