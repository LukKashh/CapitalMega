import React from "react";
import { Wallet } from "lucide-react";
import { useGame, useNow } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { WALLET_REFRESH_MS } from "./wallet";
import { cn } from "@/lib/utils";

export interface PersonalBalanceBadgeProps {
  className?: string;
  /** Whether to hide the 'Cash:' text label for tighter spaces */
  compact?: boolean;
}

/**
 * Small round corner frame window cell with yellow wallet icon followed by personal balance.
 * Fixed default box size with value rounded/formatted cleanly.
 */
export function PersonalBalanceBadge({ className, compact = false }: PersonalBalanceBadgeProps) {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, WALLET_REFRESH_MS);
  if (!data) return null;
  const cash = data.state.cash;

  return (
    <div
      className={cn(
        "game-panel inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-card/90 px-2.5 py-1 backdrop-blur-md shadow-xs shrink-0 w-[125px] sm:w-[155px] overflow-hidden justify-between",
        className,
      )}
      title={`Personal Balance: ${money(cash)}`}
    >
      <div className="flex items-center gap-1 shrink-0">
        <Wallet className="h-3.5 w-3.5 text-gold shrink-0" />
        {!compact && (
          <span className="text-[10px] uppercase font-semibold text-muted-foreground shrink-0 hidden xs:inline">
            Cash:
          </span>
        )}
      </div>
      <span className="num text-xs font-bold text-gain truncate text-right min-w-0 flex-1">
        {money(cash)}
      </span>
    </div>
  );
}
