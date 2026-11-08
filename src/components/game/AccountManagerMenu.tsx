import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/game/ui";
import { ArrowLeft, Landmark, Trophy, UserCheck } from "lucide-react";
import { ProfileView } from "./ProfileView";
import { AchievementsView } from "./AchievementsView";
import { BankingView } from "./BankingView";

export function AccountManagerMenu({ onClose }: { onClose?: () => void }) {
  const [view, setView] = useState<"main" | "profile" | "achievements" | "banking">("main");

  if (view === "profile") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("main")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account Manager
          </Button>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Public Profile
          </span>
        </div>
        <ProfileView />
      </div>
    );
  }

  if (view === "achievements") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("main")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account Manager
          </Button>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Achievements & Statistics
          </span>
        </div>
        <AchievementsView />
      </div>
    );
  }

  if (view === "banking") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("main")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account Manager
          </Button>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Banking & Tax Panel
          </span>
        </div>
        <BankingView />
      </div>
    );
  }

  // Initial Account Manager State (Main view with H1 heading and 3 navigation options only)
  return (
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account Manager</h1>
        <p className="text-xs text-muted-foreground">
          Select a management module to access your profile, records, or banking services.
        </p>
      </div>

      <div className="grid gap-3">
        {/* Option 1: Public Profile */}
        <Card
          className="p-4 cursor-pointer hover:border-primary/60 transition-all border-border/80 bg-card/90 group"
          onClick={() => setView("profile")}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>1. Public Profile</span>
                <span className="text-xs text-primary font-normal">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground">
                View & customize title, bio, avatar emblem, and empire overview.
              </div>
            </div>
          </div>
        </Card>

        {/* Option 2: Achievements & Statistics */}
        <Card
          className="p-4 cursor-pointer hover:border-primary/60 transition-all border-border/80 bg-card/90 group"
          onClick={() => setView("achievements")}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>2. Achievements & Statistics</span>
                <span className="text-xs text-amber-400 font-normal">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Track executive statistics, lifetime metrics, and milestone unlocks.
              </div>
            </div>
          </div>
        </Card>

        {/* Option 3: Banking & Tax Panel */}
        <Card
          className="p-4 cursor-pointer hover:border-primary/60 transition-all border-border/80 bg-card/90 group"
          onClick={() => setView("banking")}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Landmark className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>3. Banking & Tax Panel</span>
                <span className="text-xs text-emerald-400 font-normal">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Manage 12 banking institutions, deposits, credit lines, and tax compliance.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
