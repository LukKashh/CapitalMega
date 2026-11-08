import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Pill } from "@/components/game/ui";
import { useGame, useAct, useNow } from "@/hooks/use-game";
import {
  BANKS,
  BANK_BY_ID,
  calculateBankCreditLimit,
  getActiveDebt,
  type BankCategory,
  type BankDef,
} from "@/game/banking";
import { netWorth } from "@/game/engine";
import { money } from "@/lib/format";
import { BALANCE } from "@/game/config";
import {
  Building,
  CreditCard,
  Landmark,
  Receipt,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Wallet,
  Percent,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BankingView() {
  const { data } = useGame();
  const { run, pending } = useAct();
  const now = useNow(data?.offset ?? 0);
  const [registering, setRegistering] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<BankCategory | "All">("All");
  const [activeAccountTab, setActiveAccountTab] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [loanAmountInput, setLoanAmountInput] = useState<string>("");

  const accounts = useMemo(() => data?.state?.bankAccounts || {}, [data?.state?.bankAccounts]);

  const totalLoanDebt = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    for (const acc of Object.values(accounts)) {
      const bankDef = BANK_BY_ID[acc.defId];
      for (const loan of acc.loans || []) {
        if (loan.status === "active") {
          const dt = Math.max(0, now - data.state.lastTick);
          const dailyRate =
            loan.interestRate ||
            (bankDef?.loanApr ? bankDef.loanApr / 365 : BALANCE.interest.dailyRate);
          const interest = loan.remaining * dailyRate * (dt / 86400000);
          total += loan.remaining + interest;
        }
      }
    }
    return total;
  }, [accounts, now, data]);

  const totalReserves = useMemo(() => {
    return Object.values(accounts).reduce((acc, a) => acc + (a.balance || 0), 0);
  }, [accounts]);

  // Total available borrowing power across registered banks
  const totalAvailableCredit = useMemo(() => {
    if (!data) return 0;
    let credit = 0;
    for (const bankId of Object.keys(accounts)) {
      const def = BANK_BY_ID[bankId];
      if (def) {
        const limit = calculateBankCreditLimit(def, data.state, now);
        const debt = getActiveDebt(accounts[bankId]);
        credit += Math.max(0, limit - debt);
      }
    }
    return credit;
  }, [accounts, data, now]);

  if (!data) return null;
  const s = data.state;
  const registeredBankIds = Object.keys(accounts);

  const tax = s.tax || {
    liability: 0,
    periodIncome: { business: 0, rental: 0, investment: 0, personal: 0 },
    lastSettlementAt: s.createdAt,
  };

  const isWarning = tax.liability >= BALANCE.tax.thresholds.warning;
  const isDanger = tax.liability >= BALANCE.tax.thresholds.danger;

  const categories: (BankCategory | "All")[] = [
    "All",
    "Wide-scale",
    "Real-estate",
    "Business-finance",
  ];
  const filteredBanks = BANKS.filter((b) => selectedCat === "All" || b.category === selectedCat);

  // Modal / dedicated view for bank registration
  if (registering) {
    const bank = BANK_BY_ID[registering];
    if (!bank) return null;
    const estCredit = calculateBankCreditLimit(bank, s, now);

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRegistering(null)}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Institutions
        </Button>
        <Card className="border-primary/40 bg-card/95 backdrop-blur-md space-y-4 p-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
              <Landmark className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground tracking-tight">{bank.name}</h3>
                <Pill tone="gold" className="text-[10px] font-bold">
                  {bank.category}
                </Pill>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bank.id} &bull; Chartered Commercial Bank
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
            {bank.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Percent className="h-3 w-3 text-loss" /> Borrowing APR
              </div>
              <div className="text-sm font-black text-loss num mt-1">
                {(bank.loanApr * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-gain" /> Savings APY
              </div>
              <div className="text-sm font-black text-gain num mt-1">
                {(bank.savingsApy * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-primary" /> Initial Credit Line
              </div>
              <div className="text-sm font-black text-primary num mt-1">{money(estCredit)}</div>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 p-3.5 text-xs space-y-2 border border-primary/20">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Institutional Privilege: {bank.perkTitle}
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {bank.perkDescription}
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              className="flex-1 bg-gradient-primary h-11 text-xs font-bold shadow-lg"
              onClick={() => {
                run({ type: "registerBank", bankId: bank.id }, `Registered with ${bank.name}`);
                setRegistering(null);
                setActiveAccountTab(bank.id);
              }}
              disabled={pending}
            >
              Open Account & Activate Credit Line
            </Button>
            <Button variant="outline" className="h-11 text-xs" onClick={() => setRegistering(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banking Command Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Bank Reserves */}
        <div className="flex flex-col gap-1 rounded-xl border border-primary/30 bg-card/85 p-3.5 backdrop-blur-md">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-gain" /> Bank Reserves
          </div>
          <div className="num text-xl font-black text-gain tracking-tight">
            {money(totalReserves)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {registeredBankIds.length} active institution{registeredBankIds.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Metric 2: Total Active Debt */}
        <div
          className={cn(
            "flex flex-col gap-1 rounded-xl border p-3.5 backdrop-blur-md transition-all duration-500",
            totalLoanDebt > 0
              ? "border-loss/60 bg-loss/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "border-primary/30 bg-card/85",
          )}
        >
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-loss" /> Total Debt
          </div>
          <div className="num text-xl font-black text-loss tracking-tight">
            {money(totalLoanDebt)}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            {totalLoanDebt > 0 ? "Daily interest compounding" : "Zero liabilities"}
          </div>
        </div>

        {/* Metric 3: Total Credit Capacity */}
        <div className="flex flex-col gap-1 rounded-xl border border-primary/30 bg-card/85 p-3.5 backdrop-blur-md">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" /> Credit Capacity
          </div>
          <div className="num text-xl font-black text-primary tracking-tight">
            {money(totalAvailableCredit)}
          </div>
          <div className="text-[10px] text-muted-foreground">Available to draw</div>
        </div>

        {/* Metric 4: Tax Liability */}
        <div
          className={cn(
            "flex flex-col gap-1 rounded-xl border p-3.5 backdrop-blur-md transition-all duration-500",
            isDanger
              ? "border-loss bg-loss/10"
              : isWarning
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-primary/30 bg-card/85",
          )}
        >
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-amber-400" /> Tax Due
          </div>
          <div
            className={cn(
              "num text-xl font-black tracking-tight",
              isDanger ? "text-loss" : isWarning ? "text-amber-400" : "text-foreground",
            )}
          >
            {money(tax.liability)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isDanger ? "Audit Risk" : isWarning ? "High Dues" : "Tax Compliant"}
          </div>
        </div>
      </div>

      {/* Tax Management Panel */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-500",
          isDanger
            ? "border-loss bg-loss/10 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
            : isWarning
              ? "border-amber-500/60 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "border-primary/30 bg-card",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground">
            <Receipt
              className={cn("h-4 w-4", isDanger ? "text-loss animate-bounce" : "text-primary")}
            />
            <span>Capital Fortune Internal Revenue Authority</span>
          </div>
          <Pill
            tone={isDanger ? "loss" : isWarning ? "gold" : "gain"}
            className="font-mono text-[10px]"
          >
            {isDanger ? "CRITICAL LIABILITY" : isWarning ? "HIGH LIABILITY" : "COMPLIANT"}
          </Pill>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                Accumulated Tax Liability
              </div>
              <div
                className={cn(
                  "num text-2xl font-black tracking-tight",
                  isDanger ? "text-loss" : isWarning ? "text-amber-400" : "text-foreground",
                )}
              >
                {money(tax.liability)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Calculated on income transfers from business wallets, rent collection, investments &
                personal taps.
              </p>
            </div>

            <Button
              className={cn(
                "w-full h-10 font-bold text-xs shadow-md transition-all",
                isDanger
                  ? "bg-loss text-white hover:bg-loss/90"
                  : isWarning
                    ? "bg-amber-600 text-white hover:bg-amber-500"
                    : "bg-gradient-primary",
              )}
              onClick={() => run({ type: "settleTax" }, "Tax liability settled in full")}
              disabled={pending || tax.liability <= 0 || s.cash < tax.liability}
            >
              {tax.liability <= 0
                ? "No Outstanding Taxes"
                : s.cash < tax.liability
                  ? `Insufficient Cash to Settle (${money(tax.liability)})`
                  : `Settle All Taxes (${money(tax.liability)})`}
            </Button>
          </div>

          <div className="space-y-2 rounded-xl bg-muted/40 p-3 border border-border/60">
            <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Income by Category
              </span>
              <span className="text-[9px] font-mono opacity-70">Active Period</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {Object.entries(tax.periodIncome).map(([cat, val]) => (
                <div key={cat} className="flex justify-between items-center text-[11px]">
                  <span className="capitalize text-muted-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="num font-semibold text-foreground">{money(val)}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/40">
                      {(BALANCE.tax.rates[cat as keyof typeof BALANCE.tax.rates] * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isDanger && (
          <div className="mt-1 p-2.5 rounded-lg bg-loss/15 border border-loss/30 text-[10px] text-loss font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            REGULATORY ESCALATION: Tax liability exceeds safety threshold. Settle dues to avoid
            legal freezes.
          </div>
        )}
      </Card>

      {/* Active Portfolios Section */}
      {registeredBankIds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
              <Landmark className="h-3.5 w-3.5 text-primary" /> Active Banking Portfolios (
              {registeredBankIds.length})
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Click institution to manage deposits & credit
            </span>
          </div>

          <div className="grid gap-3">
            {registeredBankIds.map((bankId) => {
              const acc = accounts[bankId];
              const bankDef = BANK_BY_ID[bankId];
              if (!acc || !bankDef) return null;
              const isSelected = activeAccountTab === bankId;
              const parsedAmt = parseFloat(amountInput) || 0;
              const parsedLoanAmt = parseFloat(loanAmountInput) || 0;

              const activeLoans = (acc.loans || []).filter((l) => l.status === "active");
              const currentDebt = activeLoans.reduce((sum, l) => sum + l.remaining, 0);
              const bankCreditLimit = calculateBankCreditLimit(bankDef, s, now);
              const availableCredit = Math.max(0, bankCreditLimit - currentDebt);

              return (
                <Card
                  key={bankId}
                  className={cn(
                    "transition-all duration-300 border overflow-hidden",
                    isSelected
                      ? "border-primary ring-1 ring-primary/30 shadow-xl bg-card"
                      : "border-border/80 hover:border-primary/50 bg-card/80",
                    activeLoans.length > 0 && "border-loss/40",
                  )}
                >
                  {/* Account Header / Summary Bar */}
                  <div
                    className="flex items-center justify-between cursor-pointer p-4 select-none"
                    onClick={() => {
                      setActiveAccountTab(isSelected ? null : bankId);
                      setAmountInput("");
                      setLoanAmountInput("");
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-primary/10 text-primary border border-primary/20",
                        )}
                      >
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-foreground">{bankDef.name}</span>
                          <Pill tone="neutral" className="text-[9px] uppercase font-bold py-0">
                            {bankDef.category}
                          </Pill>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                          <span>Yield: {(bankDef.savingsApy * 100).toFixed(1)}% APY</span>
                          <span>&bull;</span>
                          <span>Loan: {(bankDef.loanApr * 100).toFixed(1)}% APR</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Reserves
                        </div>
                        <div className="num font-black text-base text-gain">
                          {money(acc.balance || 0)}
                        </div>
                      </div>

                      {activeLoans.length > 0 && (
                        <div className="hidden sm:block">
                          <div className="text-[10px] uppercase font-bold text-loss">
                            Active Debt
                          </div>
                          <div className="num font-black text-base text-loss">
                            {money(currentDebt)}
                          </div>
                        </div>
                      )}

                      <ChevronRight
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform duration-200",
                          isSelected && "rotate-90 text-primary",
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Banking Operations Desk */}
                  {isSelected && (
                    <div className="p-4 pt-2 border-t border-border/80 space-y-5 bg-muted/10">
                      {/* Sub-panel 1: Deposits & Withdrawals Desk */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-primary" /> Cash Management Desk
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                            <ShieldCheck className="h-3 w-3 text-gain" /> Instant 24/7 Liquidity
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount ($)"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            className="h-10 text-sm font-mono flex-1 bg-card"
                          />
                          <Button
                            className="bg-gain text-gain-foreground hover:bg-gain/90 h-10 px-5 font-bold text-xs"
                            disabled={pending || parsedAmt <= 0 || parsedAmt > s.cash}
                            onClick={() => {
                              run(
                                { type: "deposit", bankId, amount: parsedAmt },
                                `Deposited ${money(parsedAmt)} into ${bankDef.name}`,
                              );
                              setAmountInput("");
                            }}
                          >
                            Deposit
                          </Button>
                          <Button
                            variant="outline"
                            className="h-10 px-5 font-bold text-xs"
                            disabled={pending || parsedAmt <= 0 || parsedAmt > (acc.balance || 0)}
                            onClick={() => {
                              run(
                                { type: "withdraw", bankId, amount: parsedAmt },
                                `Withdrew ${money(parsedAmt)} from ${bankDef.name}`,
                              );
                              setAmountInput("");
                            }}
                          >
                            Withdraw
                          </Button>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex gap-1.5 flex-wrap">
                          {[1_000, 10_000, 50_000, 250_000].map((preset) => (
                            <Button
                              key={preset}
                              variant="secondary"
                              size="sm"
                              className="h-7 text-[10px] px-2.5 font-mono"
                              onClick={() => setAmountInput(preset.toString())}
                            >
                              +${preset >= 1000 ? `${preset / 1000}k` : preset}
                            </Button>
                          ))}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[10px] px-2.5 font-mono ml-auto"
                            onClick={() => setAmountInput(Math.floor(s.cash).toString())}
                          >
                            MAX CASH
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[10px] px-2.5 font-mono"
                            onClick={() => setAmountInput(Math.floor(acc.balance || 0).toString())}
                          >
                            ALL RESERVES
                          </Button>
                        </div>
                      </div>

                      {/* Sub-panel 2: Credit Line & Loans */}
                      <div className="space-y-3 border-t border-border/80 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-primary" /> Credit Facilities &
                            Liabilities
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Borrowing APR: {(bankDef.loanApr * 100).toFixed(1)}%
                          </span>
                        </div>

                        {/* Credit Line Status Bar */}
                        <div className="p-3 rounded-xl bg-card border border-border/70 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Total Credit Capacity:</span>
                            <span className="num font-bold text-foreground">
                              {money(bankCreditLimit)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Active Loan Balance:</span>
                            <span className="num font-bold text-loss">{money(currentDebt)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold border-t border-border/40 pt-1.5">
                            <span className="text-foreground">Available to Borrow:</span>
                            <span className="num text-primary">{money(availableCredit)}</span>
                          </div>
                        </div>

                        {/* Apply for Loan / Draw Credit */}
                        {availableCredit > 0 && (
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">
                                Draw from Credit Line
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Instant disbursement
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder={`Loan amount (Max ${money(availableCredit)})`}
                                value={loanAmountInput}
                                onChange={(e) => setLoanAmountInput(e.target.value)}
                                className="h-9 text-xs font-mono flex-1 bg-card"
                              />
                              <Button
                                size="sm"
                                className="bg-gradient-primary h-9 px-4 text-xs font-bold"
                                disabled={
                                  pending || parsedLoanAmt <= 0 || parsedLoanAmt > availableCredit
                                }
                                onClick={() => {
                                  run(
                                    { type: "applyLoan", bankId, amount: parsedLoanAmt },
                                    `Approved for ${money(parsedLoanAmt)} credit line`,
                                  );
                                  setLoanAmountInput("");
                                }}
                              >
                                Draw Credit
                              </Button>
                            </div>

                            {/* Percentage Quick Taps */}
                            <div className="flex gap-1.5">
                              {[0.25, 0.5, 0.75, 1.0].map((pct) => {
                                const val = Math.floor(availableCredit * pct);
                                return (
                                  <Button
                                    key={pct}
                                    variant="secondary"
                                    size="sm"
                                    className="h-6 text-[9px] px-2 font-mono flex-1"
                                    onClick={() => setLoanAmountInput(val.toString())}
                                  >
                                    {(pct * 100).toFixed(0)}% ({money(val)})
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Active Loans List */}
                        {activeLoans.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Outstanding Loans ({activeLoans.length})
                            </div>
                            {activeLoans.map((loan) => {
                              const dt = Math.max(0, now - s.lastTick);
                              const dailyRate =
                                loan.interestRate ||
                                (bankDef.loanApr
                                  ? bankDef.loanApr / 365
                                  : BALANCE.interest.dailyRate);
                              const currentRemaining =
                                loan.remaining + loan.remaining * dailyRate * (dt / 86400000);

                              return (
                                <div
                                  key={loan.id}
                                  className="rounded-xl bg-loss/5 p-3 border border-loss/30 flex items-center justify-between gap-3"
                                >
                                  <div>
                                    <div className="text-[11px] font-bold text-loss flex items-center gap-1.5">
                                      <TrendingUp className="h-3 w-3 animate-pulse" /> Outstanding
                                      Debt
                                    </div>
                                    <div className="num text-base font-black text-loss">
                                      {money(currentRemaining)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Principal: {money(loan.principal)} &bull; APR:{" "}
                                      {(dailyRate * 365 * 100).toFixed(1)}%
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs border-loss/40 text-loss hover:bg-loss hover:text-white font-bold"
                                      disabled={pending || s.cash <= 0}
                                      onClick={() => {
                                        const pay = Math.min(s.cash, currentRemaining);
                                        run(
                                          {
                                            type: "repayLoan",
                                            bankId,
                                            loanId: loan.id,
                                            amount: pay,
                                          },
                                          `Repaid ${money(pay)} toward loan`,
                                        );
                                      }}
                                    >
                                      Repay {s.cash >= currentRemaining ? "Full" : "Partial"}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sub-panel 3: Institutional Audit Log */}
                      {acc.transactions && acc.transactions.length > 0 && (
                        <div className="space-y-2 border-t border-border/80 pt-4">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <History className="h-3 w-3" /> Account Activity Log
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              Last {Math.min(acc.transactions.length, 10)} records
                            </span>
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                            {acc.transactions
                              .slice(-10)
                              .reverse()
                              .map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex justify-between items-center text-[10px] p-2.5 rounded-lg bg-card border border-border/40"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "h-5 w-5 rounded-md flex items-center justify-center text-[9px] font-bold",
                                        tx.type === "deposit" || tx.type === "loan"
                                          ? "bg-gain/15 text-gain"
                                          : "bg-loss/15 text-loss",
                                      )}
                                    >
                                      {tx.type === "deposit" || tx.type === "loan" ? (
                                        <ArrowDownRight className="h-3 w-3" />
                                      ) : (
                                        <ArrowUpRight className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-bold uppercase tracking-wider text-foreground">
                                        {tx.type}
                                      </span>
                                      <div className="text-[9px] text-muted-foreground">
                                        {new Date(tx.at).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  <span
                                    className={cn(
                                      "num font-black text-xs",
                                      tx.type === "deposit" || tx.type === "loan"
                                        ? "text-gain"
                                        : "text-foreground",
                                    )}
                                  >
                                    {tx.type === "deposit" || tx.type === "loan" ? "+" : "-"}
                                    {money(tx.amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Institutions Catalogue (12 Banks) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" /> Banking Institutions Directory
            </h4>
            <span className="text-[11px] text-muted-foreground">12 Financial Centers</span>
          </div>
          <div className="h-0.5 w-14 bg-primary/50" />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap",
                selectedCat === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bank Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {filteredBanks.map((bank) => {
            const isRegistered = registeredBankIds.includes(bank.id);
            const estCredit = calculateBankCreditLimit(bank, s, now);

            return (
              <Card
                key={bank.id}
                className={cn(
                  "flex flex-col justify-between p-4.5 space-y-3.5 border transition-all duration-200 group",
                  isRegistered
                    ? "border-gain/40 bg-card/90"
                    : "border-border/80 hover:border-primary/60 bg-card/75",
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl border border-border/60 bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors block">
                          {bank.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          {bank.id} &bull; {bank.category}
                        </span>
                      </div>
                    </div>

                    <Pill
                      tone={isRegistered ? "gain" : "neutral"}
                      className="text-[9px] uppercase font-bold py-0.5 px-2"
                    >
                      {isRegistered ? "ACTIVE" : "AVAILABLE"}
                    </Pill>
                  </div>

                  <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {bank.description}
                  </p>

                  {/* Financial Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-muted/40 border border-border/50 text-center">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground">
                        Borrow APR
                      </div>
                      <div className="text-xs font-black text-loss num mt-0.5">
                        {(bank.loanApr * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground">
                        Savings APY
                      </div>
                      <div className="text-xs font-black text-gain num mt-0.5">
                        {(bank.savingsApy * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground">
                        Credit Line
                      </div>
                      <div className="text-xs font-black text-primary num mt-0.5">
                        {money(estCredit)}
                      </div>
                    </div>
                  </div>

                  {/* Institutional Perk */}
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-md border border-amber-500/20">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span className="font-bold truncate">{bank.perkTitle}:</span>
                    <span className="text-muted-foreground truncate">{bank.perkDescription}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Max Ceiling: {money(bank.maxCredit)}
                  </span>
                  {isRegistered ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-black uppercase tracking-wider border-gain/40 text-gain hover:bg-gain hover:text-gain-foreground gap-1"
                      onClick={() => {
                        setActiveAccountTab(bank.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Manage Desk
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest bg-gradient-primary text-white hover:opacity-95 shadow-md"
                      onClick={() => setRegistering(bank.id)}
                    >
                      Open Account
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
