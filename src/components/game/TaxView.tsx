import { AlertTriangle, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Pill } from "@/components/game/ui";
import { useGame, useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { BALANCE } from "@/game/config";
import { cn } from "@/lib/utils";

export function TaxView() {
  const { data } = useGame();
  const { run, pending } = useAct();
  if (!data) return null;

  const state = data.state;
  const tax = state.tax;
  const warning = tax.liability >= BALANCE.tax.thresholds.warning;
  const danger = tax.liability >= BALANCE.tax.thresholds.danger;

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "relative space-y-4 overflow-hidden p-4",
          danger
            ? "border-loss bg-loss/10"
            : warning
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-primary/30 bg-card",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Receipt className={cn("h-4 w-4", danger ? "text-loss" : "text-primary")} />
            Capital Fortune Internal Revenue Authority
          </div>
          <Pill
            tone={danger ? "loss" : warning ? "gold" : "gain"}
            className="text-[10px] font-mono"
          >
            {danger ? "CRITICAL LIABILITY" : warning ? "HIGH LIABILITY" : "COMPLIANT"}
          </Pill>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                Accumulated Tax Liability
              </div>
              <div
                className={cn(
                  "num text-2xl font-black tracking-tight",
                  danger ? "text-loss" : warning ? "text-amber-400" : "text-foreground",
                )}
              >
                {money(tax.liability)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tax accrued from business, rental, investment, and personal income.
              </p>
            </div>
            <Button
              className={cn(
                "h-10 w-full text-xs font-bold",
                danger
                  ? "bg-loss text-white hover:bg-loss/90"
                  : warning
                    ? "bg-amber-600 text-white hover:bg-amber-500"
                    : "bg-gradient-primary",
              )}
              onClick={() => run({ type: "settleTax" }, "Tax liability settled in full")}
              disabled={pending || tax.liability <= 0 || state.cash < tax.liability}
            >
              {tax.liability <= 0
                ? "No Outstanding Taxes"
                : state.cash < tax.liability
                  ? "Insufficient Cash to Settle"
                  : `Settle All Taxes (${money(tax.liability)})`}
            </Button>
          </div>
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/40 p-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Income by Category
              </span>
              <span className="text-[9px] font-mono opacity-70">Active Period</span>
            </div>
            {Object.entries(tax.periodIncome).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between text-[11px]">
                <span className="capitalize text-muted-foreground">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="num font-semibold">{money(amount)}</span>
                  <span className="rounded border border-border/40 bg-muted/80 px-1.5 py-0.5 text-[9px] font-mono">
                    {(BALANCE.tax.rates[category as keyof typeof BALANCE.tax.rates] * 100).toFixed(
                      0,
                    )}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {danger && (
          <div className="flex items-center gap-2 rounded-lg border border-loss/30 bg-loss/15 p-2.5 text-[10px] font-bold text-loss">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Tax liability exceeds the configured safety threshold.
          </div>
        )}
      </Card>
    </div>
  );
}
