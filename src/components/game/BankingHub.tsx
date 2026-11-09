import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Landmark, LockKeyhole, ShieldCheck, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Pill } from "@/components/game/ui";
import { useGame } from "@/hooks/use-game";
import { BANK_BY_ID } from "@/game/banking";
import { BankingView as BankingWorkspace } from "./BankingView";
import { cn } from "@/lib/utils";

type Screen = "connecting" | "hub" | "apps" | "offers" | "bank";

export function BankingHub({ onClose }: { onClose: () => void }) {
  const { data } = useGame();
  const [screen, setScreen] = useState<Screen>("connecting");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setScreen("hub"), 1900);
    return () => window.clearTimeout(id);
  }, []);

  const accountIds = Object.keys(data?.state?.bankAccounts ?? {});
  const selectedBank = selectedBankId ? BANK_BY_ID[selectedBankId] : null;

  const leaveBank = () => {
    setSelectedBankId(null);
    setScreen("hub");
  };

  return (
    <section className="banking-hub fixed inset-0 z-[80] flex min-h-0 flex-col overflow-hidden bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Banking HUB">
      <header className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-wide">BANKING HUB</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {screen === "connecting" ? "Secure gateway" : selectedBank?.name ?? "Connected environment"}
            </div>
          </div>
        </div>
        {screen !== "connecting" && (
          <Button variant="ghost" size="icon" aria-label="End connection" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </header>

      {screen === "connecting" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-primary/40 bg-primary/5">
            <span className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
            <LockKeyhole className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black tracking-wide">Establishing a Secure Connection</h2>
            <p className="text-xs text-muted-foreground">Authenticating credentials · Encrypting session · Opening gateway</p>
          </div>
          <div className="h-1.5 w-52 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse rounded-full bg-primary" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gain">
            <ShieldCheck className="h-4 w-4" /> Secure channel initialising
          </div>
        </div>
      ) : screen === "hub" ? (
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center gap-3 overflow-y-auto px-4 py-5">
          <div className="mb-3 text-center">
            <Pill tone="gain">Connection secured</Pill>
            <h1 className="mt-3 text-2xl font-black tracking-tight">Welcome to Banking</h1>
            <p className="mt-1 text-xs text-muted-foreground">Choose where you want to go.</p>
          </div>
          <HubAction icon={<Landmark />} title="My Banking Apps" description="Access your registered banking institutions" onClick={() => setScreen("apps")} />
          <HubAction icon={<Store />} title="View Banking Service Offers" description="Explore institutions and available account offers" onClick={() => setScreen("offers")} />
          <Button variant="outline" className="mt-2 h-12 w-full border-loss/40 text-loss hover:bg-loss/10" onClick={onClose}>End Connection</Button>
        </div>
      ) : screen === "apps" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => setScreen("hub")} className="mb-3 gap-2"><ArrowLeft className="h-4 w-4" /> Banking HUB</Button>
          <h2 className="mb-1 text-lg font-black">My Banking Apps</h2>
          <p className="mb-4 text-xs text-muted-foreground">Select an institution to access its banking environment.</p>
          {accountIds.length === 0 ? (
            <Card className="space-y-2 p-5 text-center">
              <Landmark className="mx-auto h-7 w-7 text-primary" />
              <div className="text-sm font-bold">No registered banking apps</div>
              <p className="text-xs text-muted-foreground">Visit service offers to open your first bank account.</p>
              <Button size="sm" onClick={() => setScreen("offers")}>View service offers</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {accountIds.map((id) => {
                const bank = BANK_BY_ID[id];
                const balance = data?.state?.bankAccounts?.[id]?.balance ?? 0;
                if (!bank) return null;
                return <button key={id} onClick={() => { setSelectedBankId(id); setScreen("bank"); }} className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/80 p-4 text-left transition-colors hover:border-primary/50">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{bank.name}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">Digital banking · {bank.category}</span></span>
                  <span className="text-right"><span className="block text-xs font-black text-gain">{balance.toLocaleString()}</span><span className="text-[9px] uppercase text-muted-foreground">Balance</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                </button>;
              })}
            </div>
          )}
        </div>
      ) : screen === "offers" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <Button variant="ghost" size="sm" onClick={() => setScreen("hub")} className="mb-2 gap-2"><ArrowLeft className="h-4 w-4" /> Banking HUB</Button>
          <div className="mb-3 px-1"><h2 className="text-lg font-black">Banking Service Offers</h2><p className="text-xs text-muted-foreground">Compare institutions and open an account.</p></div>
          <BankingWorkspace />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
            <Button variant="ghost" size="sm" onClick={leaveBank} className="gap-1"><ArrowLeft className="h-4 w-4" /> My Apps</Button>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{selectedBank?.name ?? "Bank App"}</span>
            <Pill tone="gain">Connected</Pill>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <BankingWorkspace bankFilterId={selectedBankId ?? undefined} />
          </div>
        </div>
      )}
    </section>
  );
}

function HubAction({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn("flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-primary/25 bg-card/80 p-4 text-left transition-colors active:scale-[0.99] hover:border-primary/60 hover:bg-primary/5")}>
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs leading-snug text-muted-foreground">{description}</span></span>
    <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
  </button>;
}
