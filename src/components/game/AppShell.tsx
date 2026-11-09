import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MenuContext } from "@/context/menu";
import {
  Award,
  BarChart3,
  Dices,
  Briefcase,
  Building2,
  Coins,
  FlaskConical,
  Maximize,
  Minimize,
  Gem,
  Home,
  LineChart,
  LogOut,
  User,
  Users,
  Trophy,
  Landmark,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame, useAct } from "@/hooks/use-game";
import { logOut } from "@/lib/firebase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BankingView } from "./BankingView";
import { TaxView } from "./TaxView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "./ui";
import { OfflineReportDialog } from "./OfflineReport";

const NAV = [
  { to: "/realestate", label: "Assets", icon: Gem, also: ["/collectibles"] },
  { to: "/markets", label: "Trade-HUB", icon: LineChart },
  { to: "/home", label: "Tap", icon: Home, center: true },
  { to: "/empire", label: "Empire", icon: Building2 },
  { to: "/corporation", label: "Corp", icon: Briefcase },
] as const;

const MORE = [
  { to: "/leaderboard", label: "Online Leaderboard", icon: Trophy },
  { to: "/corporation", label: "Corporation", icon: Users },
  { to: "/casino", label: "Casino", icon: Dices },
  { to: "/research", label: "Research & Development", icon: FlaskConical },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/stats", label: "Statistics & Net Worth", icon: BarChart3 },
  { to: "/profile", label: "Private Profile & Settings", icon: User },
] as const;

export function AppShell() {
  const { data, isLoading, error, refetch } = useGame();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menu, setMenu] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"banking" | "tax" | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await logOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading)
    return (
      <div className="min-h-screen">
        <Loading />
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn't load your save: {error instanceof Error ? error.message : "unknown error"}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  const s = data.state;

  return (
    <MenuContext.Provider value={{ openMenu: () => setMenu(true) }}>
      <div className="game-shell h-screen overflow-hidden flex flex-col bg-background text-foreground">
        <main className="game-content mx-auto w-full max-w-2xl flex-1 overflow-x-hidden overflow-y-auto px-3.5 pb-14 pt-2 flex flex-col min-h-0">
          <Outlet />
        </main>

        <nav className="game-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#942929] bg-background/95 backdrop-blur pb-safe">
          <div className="game-nav-inner mx-auto grid max-w-2xl grid-cols-5 border-[#942929]">
            {NAV.map((n) => {
              const active =
                path.startsWith(n.to) || ("also" in n && n.also.some((a) => path.startsWith(a)));
              return "center" in n ? (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-label="Clicker"
                  className="game-nav-center flex flex-col items-center justify-end pb-1"
                >
                  <span
                    className={cn(
                      "game-nav-center-badge -mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-glow bg-gradient-primary text-primary-foreground shadow-glow ring-4 ring-background",
                      !active && "opacity-85",
                    )}
                  >
                    <Coins className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px]",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {n.label}
                  </span>
                </Link>
              ) : (
                <Link
                  key={n.to}
                  to={n.to}
                  data-active={active}
                  className="game-nav-link flex flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground"
                >
                  <n.icon className="game-icon h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent
            side="right"
            className="w-[90vw] max-w-[340px] p-0 flex flex-col h-full overflow-hidden bg-background border-l border-border"
          >
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-lg font-bold text-foreground">
                {menuPanel === "banking"
                  ? "Bank & Loans"
                  : menuPanel === "tax"
                    ? "Tax"
                    : "Navigation"}
              </SheetTitle>
            </SheetHeader>

            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 space-y-4">
              {menuPanel ? (
                <div className="min-w-0 w-full max-w-full space-y-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuPanel(null)}
                    className="gap-2"
                  >
                    &larr; Back to Navigation
                  </Button>
                  {menuPanel === "banking" ? <BankingView /> : <TaxView />}
                </div>
              ) : (
                <>
                  {s && (
                    <Link
                      to="/profile"
                      onClick={() => setMenu(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/30 hover:border-primary transition-all group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/15 p-1 border border-primary/30 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {s.username || "Tycoon"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-primary font-medium">LV {s.level}</span>
                        </div>
                      </div>
                    </Link>
                  )}

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                      Financial Services
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuPanel("banking")}
                      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-3.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Landmark className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          Bank & Loans
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Browse banks, manage accounts, and review loans.
                        </span>
                      </span>
                      <span className="text-primary">&rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuPanel("tax")}
                      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-amber-500/60 hover:bg-amber-500/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                        <Receipt className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">Tax</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Review tax liabilities and settle outstanding taxes.
                        </span>
                      </span>
                      <span className="text-amber-400">&rarr;</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                      Menu Options
                    </div>
                    {MORE.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenu(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/70",
                          path === item.to
                            ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                            : "text-foreground/90",
                        )}
                      >
                        <item.icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                      System
                    </div>
                    <FullscreenToggle />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border bg-card/40">
              <Button
                variant="ghost"
                onClick={() => {
                  setMenu(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-loss hover:bg-loss/10 border border-loss/20"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {!s.username && <UsernameDialog />}
        {s.username && s.lastOffline && <OfflineReportDialog report={s.lastOffline} />}
      </div>
    </MenuContext.Provider>
  );
}

function UsernameDialog() {
  const { run, pending } = useAct();
  const [name, setName] = useState("");
  return (
    <Dialog open>
      <DialogContent className="max-w-sm [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Choose your tycoon name</DialogTitle>
          <DialogDescription>
            You start with $0 and no assets. Tap the coin on Home to earn your first dollars.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run({ type: "setProfile", username: name }, "Welcome, " + name);
          }}
          className="space-y-3"
        >
          <Input
            autoFocus
            placeholder="e.g. GoldenMogul"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="h-11"
          />
          <Button
            type="submit"
            disabled={pending || name.length < 3}
            className="h-11 w-full bg-gradient-primary"
          >
            Start my empire
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    setSupported(!!document.documentElement.requestFullscreen);
    const sync = () => setOn(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!supported) return null;
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  const Icon = on ? Minimize : Maximize;
  return (
    <Button
      variant="ghost"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted"
    >
      <Icon className="h-5 w-5 text-primary" />
      {on ? "Exit full screen" : "Full screen"}
    </Button>
  );
}
