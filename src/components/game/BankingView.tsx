import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Pill } from "@/components/game/ui";
import { useGame, useAct, useNow } from "@/hooks/use-game";
import {
  BANKS,
  BANK_BY_ID,
  calculateBankCreditLimit,
  getAvailableBankCredit,
  MAX_ACTIVE_BANK_ACCOUNTS,
  supportsBusinessIncome,
  supportsPropertyIncome,
  type BankCategory,
} from "@/game/banking";
import { money } from "@/lib/format";
import {
  CreditCard,
  Landmark,
  Building,
  Building2,
  CheckCircle2,
  History,
  TrendingUp,
  Wallet,
  Percent,
  Sparkles,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function bankBrand(bankId: string) {
  const bankNumber = Number(bankId.split("-")[1]) || 1;
  const hue = (bankNumber * 47 + 185) % 360;
  return {
    accent: `hsl(${hue} 72% 58%)`,
    soft: `hsl(${hue} 72% 58% / 0.12)`,
    border: `hsl(${hue} 72% 58% / 0.42)`,
  };
}

export function BankingView() {
  const { data } = useGame();
  const { run, pending } = useAct();
  const now = useNow(data?.offset ?? 0);
  const [registering, setRegistering] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<BankCategory | "All">("All");
  const [activeAccountTab, setActiveAccountTab] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState<string>("");
  const [loanAmountInput, setLoanAmountInput] = useState<string>("");
  const [loanCategoryInput, setLoanCategoryInput] = useState<
    "personal" | "business" | "real-estate"
  >("personal");
  const [bankAppTab, setBankAppTab] = useState<
    "overview" | "institutions" | "accounts" | "payments" | "loans" | "services" | "activity"
  >("overview");

  const accounts = useMemo(() => data?.state?.bankAccounts || {}, [data?.state?.bankAccounts]);

  if (!data) return null;
  const s = data.state;
  const registeredBankIds = Object.keys(accounts);
  const allActiveLoans = Object.entries(accounts).flatMap(([bankId, account]) =>
    (account.loans || [])
      .filter((loan) => loan.status === "active")
      .map((loan) => {
        const bank = BANK_BY_ID[account.defId];
        const elapsedDays = Math.max(0, now - s.lastTick) / 86400000;
        const dailyRate = loan.interestRate || (bank?.loanApr ?? 0) / 365;
        const existingInterest =
          loan.accruedInterest ?? Math.max(0, loan.remaining - loan.principal);
        const principalRemaining =
          loan.principalRemaining ?? Math.max(0, loan.remaining - existingInterest);
        const projectedInterest = loan.remaining * (Math.pow(1 + dailyRate, elapsedDays) - 1);
        return {
          ...loan,
          bankId,
          bankName: bank?.name ?? bankId,
          currentRemaining: loan.remaining + projectedInterest,
          currentAccruedInterest: existingInterest + projectedInterest,
          currentPrincipalRemaining: principalRemaining,
        };
      }),
  );
  const consolidatedDebt = allActiveLoans.reduce((sum, loan) => sum + loan.currentRemaining, 0);

  const categories: (BankCategory | "All")[] = [
    "All",
    "Wide-scale",
    "Real-estate",
    "Business-finance",
  ];
  const filteredBanks = BANKS.filter((b) => selectedCat === "All" || b.category === selectedCat);
  const totalBankReserves = registeredBankIds.reduce(
    (total, bankId) => total + (accounts[bankId]?.balance || 0),
    0,
  );
  const isAccountOperation =
    bankAppTab === "payments" ||
    bankAppTab === "loans" ||
    bankAppTab === "services" ||
    bankAppTab === "activity";

  const bankingSections = [
    { id: "overview", label: "Overview", description: "Financial snapshot", icon: Wallet },
    { id: "institutions", label: "Institutions", description: "Browse banks", icon: Landmark },
    { id: "accounts", label: "My Accounts", description: "Balances and access", icon: Building2 },
    {
      id: "payments",
      label: "Payments",
      description: "Deposits and withdrawals",
      icon: ArrowDownRight,
    },
    { id: "loans", label: "Loans", description: "Credit and repayments", icon: CreditCard },
    { id: "services", label: "Services", description: "Income routing", icon: Building },
    { id: "activity", label: "Activity", description: "Transaction history", icon: History },
  ] as const;
  const activeSection = bankingSections.find((section) => section.id === bankAppTab)!;

  // Modal / dedicated view for bank registration
  if (registering) {
    const bank = BANK_BY_ID[registering];
    if (!bank) return null;
    const estCredit = calculateBankCreditLimit(bank, s, now);
    const brand = bankBrand(bank.id);
    const existingAccount = accounts[bank.id];
    const canRegister =
      !existingAccount &&
      registeredBankIds.length < MAX_ACTIVE_BANK_ACCOUNTS &&
      s.level >= bank.tierRequired;

    return (
      <div className="banking-view min-w-0 w-full max-w-full space-y-4">
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
            <div
              className="h-14 w-14 rounded-2xl border flex items-center justify-center shrink-0 text-lg font-black"
              style={{
                color: brand.accent,
                backgroundColor: brand.soft,
                borderColor: brand.border,
              }}
            >
              {bank.name
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground tracking-tight">{bank.name}</h3>
                <Pill tone="gold" className="text-[10px] font-bold">
                  {bank.category}
                </Pill>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bank.id} &bull;{" "}
                {existingAccount ? "Digital Banking Sign-In" : "New Customer Registration"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {existingAccount ? "Welcome back" : "Open a new account"}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {existingAccount ? `Continue as ${s.username}` : "Digital banking registration"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{bank.description}</p>
          </div>

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

          {!existingAccount && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              {registeredBankIds.length >= MAX_ACTIVE_BANK_ACCOUNTS
                ? "You already have the maximum of two active bank accounts."
                : s.level < bank.tierRequired
                  ? `This institution requires player level ${bank.tierRequired}.`
                  : "Registration creates an account with this institution. Browsing the bank does not create an account."}
            </div>
          )}
          <div className="flex gap-2.5 pt-2">
            {existingAccount ? (
              <Button
                className="flex-1 bg-gradient-primary h-11 text-xs font-bold shadow-lg"
                onClick={() => {
                  setRegistering(null);
                  setActiveAccountTab(bank.id);
                  setBankAppTab("payments");
                  setAmountInput("");
                  setLoanAmountInput("");
                }}
              >
                Sign In to {bank.name}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-gradient-primary h-11 text-xs font-bold shadow-lg"
                onClick={() => {
                  void run(
                    { type: "registerBank", bankId: bank.id },
                    `Registered with ${bank.name}`,
                  );
                  setRegistering(null);
                  setActiveAccountTab(bank.id);
                  setBankAppTab("payments");
                }}
                disabled={pending || !canRegister}
              >
                Create Bank Account
              </Button>
            )}
            <Button variant="outline" className="h-11 text-xs" onClick={() => setRegistering(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="banking-view min-w-0 w-full max-w-full space-y-6">
      <div className="grid min-w-0 gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <nav
          aria-label="Banking sections"
          className="flex min-w-0 gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0 md:self-start"
        >
          {bankingSections.map((section) => {
            const Icon = section.icon;
            const active = bankAppTab === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setBankAppTab(section.id)}
                className={cn(
                  "flex min-w-[112px] shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-colors md:w-full md:px-3 md:py-3",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                    : "border-border/70 bg-card/70 text-foreground hover:border-primary/40 hover:bg-muted/70",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary/15" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{section.label}</span>
                  <span className="mt-0.5 hidden truncate text-[10px] text-muted-foreground md:block">
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <main className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Banking / {activeSection.label}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{activeSection.description}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Available cash
              </div>
              <div className="num text-sm font-black text-gain">{money(s.cash)}</div>
            </div>
          </div>

          {bankAppTab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="space-y-1.5 border-border/70 bg-card/80 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Player cash
                  </div>
                  <div className="num text-lg font-black text-gain">{money(s.cash)}</div>
                  <div className="text-[10px] text-muted-foreground">Ready to deposit or spend</div>
                </Card>
                <Card className="space-y-1.5 border-border/70 bg-card/80 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bank reserves
                  </div>
                  <div className="num text-lg font-black text-foreground">
                    {money(totalBankReserves)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Across {registeredBankIds.length} active account
                    {registeredBankIds.length === 1 ? "" : "s"}
                  </div>
                </Card>
                <Card className="space-y-1.5 border-border/70 bg-card/80 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Outstanding debt
                  </div>
                  <div className="num text-lg font-black text-loss">{money(consolidatedDebt)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {allActiveLoans.length} active loan{allActiveLoans.length === 1 ? "" : "s"}
                  </div>
                </Card>
                <Card className="space-y-1.5 border-border/70 bg-card/80 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Account capacity
                  </div>
                  <div className="num text-lg font-black text-primary">
                    {registeredBankIds.length}/{MAX_ACTIVE_BANK_ACCOUNTS}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Active bank accounts</div>
                </Card>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                <div className="text-sm font-bold text-foreground">Banking workspace</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Each banking function now has its own section. Open an institution, review your
                  accounts, or move directly to payments, loans, services, and activity.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["institutions", "accounts", "payments", "loans"] as const).map((section) => {
                    const item = bankingSections.find((entry) => entry.id === section)!;
                    return (
                      <Button
                        key={section}
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px]"
                        onClick={() => setBankAppTab(section)}
                      >
                        {item.label} <span className="ml-1 text-primary">&rarr;</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {bankAppTab === "accounts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Your bank accounts</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select an account to continue to its payment workspace.
                  </p>
                </div>
                <Pill tone="neutral">
                  {registeredBankIds.length}/{MAX_ACTIVE_BANK_ACCOUNTS} active
                </Pill>
              </div>
              {registeredBankIds.length === 0 ? (
                <Card className="space-y-3 border-dashed border-border/80 bg-card/50 p-5 text-center">
                  <Landmark className="mx-auto h-7 w-7 text-primary" />
                  <div className="text-sm font-bold text-foreground">No bank accounts yet</div>
                  <p className="text-xs text-muted-foreground">
                    Browse the institutions directory to open your first account.
                  </p>
                  <Button
                    size="sm"
                    className="mx-auto"
                    onClick={() => setBankAppTab("institutions")}
                  >
                    Browse institutions
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {registeredBankIds.map((bankId) => {
                    const account = accounts[bankId];
                    const bank = BANK_BY_ID[bankId];
                    if (!account) return null;
                    const brand = bankBrand(bankId);
                    const activeLoans = (account.loans || []).filter(
                      (loan) => loan.status === "active",
                    );
                    return (
                      <Card key={bankId} className="space-y-3 border-border/80 bg-card/80 p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black"
                            style={{
                              color: brand.accent,
                              backgroundColor: brand.soft,
                              borderColor: brand.border,
                            }}
                          >
                            {(bank?.name ?? bankId)
                              .split(" ")
                              .map((word) => word[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-foreground">
                              {bank?.name ?? bankId}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {bank?.category ?? "Financial institution"}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
                          <div>
                            <div className="text-[9px] uppercase text-muted-foreground">
                              Reserves
                            </div>
                            <div className="num mt-0.5 text-sm font-black text-gain">
                              {money(account.balance || 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase text-muted-foreground">
                              Active loans
                            </div>
                            <div className="num mt-0.5 text-sm font-black text-loss">
                              {activeLoans.length}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setActiveAccountTab(bankId);
                            setBankAppTab("payments");
                            setAmountInput("");
                            setLoanAmountInput("");
                          }}
                        >
                          Manage account <span className="ml-1">&rarr;</span>
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isAccountOperation && registeredBankIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
              <div>
                <div className="text-xs font-bold text-foreground">Active account</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Choose which institution this section should manage.
                </div>
              </div>
              <select
                aria-label="Select bank account"
                value={
                  activeAccountTab && registeredBankIds.includes(activeAccountTab)
                    ? activeAccountTab
                    : ""
                }
                onChange={(event) => {
                  setActiveAccountTab(event.target.value || null);
                  setAmountInput("");
                  setLoanAmountInput("");
                }}
                className="h-10 min-w-[180px] max-w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground"
              >
                <option value="">Select an account</option>
                {registeredBankIds.map((bankId) => (
                  <option key={bankId} value={bankId}>
                    {BANK_BY_ID[bankId]?.name ?? bankId}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAccountOperation && registeredBankIds.length === 0 && (
            <Card className="space-y-3 border-dashed border-border/80 bg-card/50 p-5 text-center">
              <Landmark className="mx-auto h-7 w-7 text-primary" />
              <div className="text-sm font-bold text-foreground">A bank account is required</div>
              <p className="text-xs text-muted-foreground">
                Open an account with an institution before using this section.
              </p>
              <Button size="sm" className="mx-auto" onClick={() => setBankAppTab("institutions")}>
                Browse institutions
              </Button>
            </Card>
          )}

          {/* Active Portfolios Section */}
          {isAccountOperation &&
            activeAccountTab &&
            registeredBankIds.includes(activeAccountTab) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 text-primary" /> Account Dashboard
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {registeredBankIds.length} of {MAX_ACTIVE_BANK_ACCOUNTS} accounts active
                  </span>
                </div>

                <div className="grid gap-3">
                  {[activeAccountTab]
                    .filter((bankId): bankId is string => !!bankId)
                    .map((bankId) => {
                      const acc = accounts[bankId];
                      const bankDef = BANK_BY_ID[bankId];
                      if (!acc || !bankDef) return null;
                      const brand = bankBrand(bankId);
                      const isSelected = activeAccountTab === bankId;
                      const parsedAmt = parseFloat(amountInput) || 0;
                      const parsedLoanAmt = parseFloat(loanAmountInput) || 0;

                      const activeLoans = (acc.loans || []).filter((l) => l.status === "active");
                      const currentDebt = activeLoans.reduce((sum, loan) => {
                        const elapsedDays = Math.max(0, now - s.lastTick) / 86400000;
                        const dailyRate = loan.interestRate || bankDef.loanApr / 365;
                        return sum + loan.remaining * Math.pow(1 + dailyRate, elapsedDays);
                      }, 0);
                      const bankCreditLimit = calculateBankCreditLimit(bankDef, s, now);
                      const availableCredit = getAvailableBankCredit(bankDef, s, now);

                      const ownedBusinesses = Object.values(s.companies || {});
                      const ownedProperties = Object.values(s.properties || {});

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
                          {/* Selected institution summary */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3.5">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
                                style={{
                                  color: brand.accent,
                                  backgroundColor: brand.soft,
                                  borderColor: brand.border,
                                }}
                              >
                                {bankDef.name
                                  .split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-black text-foreground">
                                    {bankDef.name}
                                  </span>
                                  <Pill tone="gain" className="py-0 text-[8px] font-bold uppercase">
                                    Active
                                  </Pill>
                                  <Pill
                                    tone="neutral"
                                    className="py-0 text-[9px] font-bold uppercase"
                                  >
                                    {bankDef.category}
                                  </Pill>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  <span>Yield: {(bankDef.savingsApy * 100).toFixed(1)}% APY</span>
                                  <span>•</span>
                                  <span>Loan: {(bankDef.loanApr * 100).toFixed(1)}% APR</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold uppercase text-muted-foreground">
                                Account reserves
                              </div>
                              <div className="num text-base font-black text-gain">
                                {money(acc.balance || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Banking Operations Desk */}
                          {isSelected && (
                            <div className="p-4 pt-2 border-t border-border/80 space-y-5 bg-muted/10">
                              {bankAppTab === "payments" && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                      <Wallet className="h-3.5 w-3.5 text-primary" /> Cash
                                      Management Desk
                                    </span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                      <ShieldCheck className="h-3 w-3 text-gain" /> Instant 24/7
                                      Liquidity
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
                                      disabled={
                                        pending || parsedAmt <= 0 || parsedAmt > (acc.balance || 0)
                                      }
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
                                      onClick={() =>
                                        setAmountInput(Math.floor(acc.balance || 0).toString())
                                      }
                                    >
                                      ALL RESERVES
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {bankAppTab === "loans" && (
                                <div className="space-y-3 border-t border-border/80 pt-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                      <CreditCard className="h-3.5 w-3.5 text-primary" /> Credit
                                      Facilities & Liabilities
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      Borrowing APR: {(bankDef.loanApr * 100).toFixed(1)}%
                                    </span>
                                  </div>

                                  {/* Credit Line Status Bar */}
                                  <div className="p-3 rounded-xl bg-card border border-border/70 space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-muted-foreground">
                                        Total Credit Capacity:
                                      </span>
                                      <span className="num font-bold text-foreground">
                                        {money(bankCreditLimit)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-muted-foreground">
                                        This Bank's Active Loans:
                                      </span>
                                      <span className="num font-bold text-loss">
                                        {money(currentDebt)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-muted-foreground">
                                        Consolidated Debt (All Banks):
                                      </span>
                                      <span className="num font-bold text-loss">
                                        {money(consolidatedDebt)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold border-t border-border/40 pt-1.5">
                                      <span className="text-foreground">Available to Borrow:</span>
                                      <span className="num text-primary">
                                        {money(availableCredit)}
                                      </span>
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

                                      <div className="grid grid-cols-1 gap-2">
                                        <label className="space-y-1">
                                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                            Loan Category
                                          </span>
                                          <select
                                            value={loanCategoryInput}
                                            onChange={(event) =>
                                              setLoanCategoryInput(
                                                event.target.value as
                                                  "personal" | "business" | "real-estate",
                                              )
                                            }
                                            className="h-9 w-full rounded-md border border-border bg-card px-2 text-xs"
                                            disabled={pending}
                                          >
                                            <option value="personal">Personal Loan</option>
                                            <option value="business">Business Loan</option>
                                            <option value="real-estate">Real Estate Loan</option>
                                          </select>
                                        </label>
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
                                            pending ||
                                            parsedLoanAmt <= 0 ||
                                            parsedLoanAmt > availableCredit
                                          }
                                          onClick={() => {
                                            run(
                                              {
                                                type: "applyLoan",
                                                bankId,
                                                amount: parsedLoanAmt,
                                                category: loanCategoryInput,
                                              },
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

                                  {/* Consolidated Loan Portfolio */}
                                  {allActiveLoans.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                          Consolidated Loan Portfolio ({allActiveLoans.length})
                                        </div>
                                        <div className="text-[10px] font-bold text-loss">
                                          Total: {money(consolidatedDebt)}
                                        </div>
                                      </div>
                                      {allActiveLoans.map((loan) => (
                                        <div
                                          key={loan.id}
                                          className="rounded-xl bg-loss/5 p-3 border border-loss/30 flex items-center justify-between gap-3"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-[11px] font-bold text-loss flex items-center gap-1.5">
                                              <TrendingUp className="h-3 w-3" /> {loan.bankName}
                                            </div>
                                            <div className="num text-base font-black text-loss">
                                              {money(loan.currentRemaining)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                              {(loan.category ?? "personal").replace("-", " ")} loan
                                              &bull; Principal outstanding:{" "}
                                              {money(loan.currentPrincipalRemaining)} &bull; Accrued
                                              interest: {money(loan.currentAccruedInterest)} &bull;
                                              APR: {(loan.interestRate * 365 * 100).toFixed(1)}%
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 shrink-0 text-xs border-loss/40 text-loss hover:bg-loss hover:text-white font-bold"
                                            disabled={pending || s.cash <= 0}
                                            onClick={() => {
                                              const pay = Math.min(s.cash, loan.currentRemaining);
                                              void run(
                                                {
                                                  type: "repayLoan",
                                                  bankId: loan.bankId,
                                                  loanId: loan.id,
                                                  amount: pay,
                                                },
                                                `Repaid ${money(pay)} toward loan`,
                                              );
                                            }}
                                          >
                                            Repay
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {bankAppTab === "services" &&
                                (supportsBusinessIncome(bankDef) ||
                                  supportsPropertyIncome(bankDef)) && (
                                  <div className="space-y-3 border-t border-border/80 pt-4">
                                    <div>
                                      <div className="text-xs font-black uppercase tracking-wider text-foreground">
                                        Income Integrations
                                      </div>
                                      <p className="mt-1 text-[10px] text-muted-foreground">
                                        Route newly generated income from eligible assets directly
                                        into this bank account. Previously accrued wallet balances
                                        can still be collected here.
                                      </p>
                                    </div>
                                    {supportsBusinessIncome(bankDef) &&
                                      ownedBusinesses.length > 0 && (
                                        <div className="space-y-2">
                                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                                            Business Income
                                          </div>
                                          {ownedBusinesses.map((company) => (
                                            <label
                                              key={company.inst}
                                              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-2.5"
                                            >
                                              <span className="min-w-0 truncate text-[11px] font-semibold">
                                                {company.inst}
                                              </span>
                                              <select
                                                className="max-w-[58%] rounded-md border border-border bg-background px-2 py-1.5 text-[10px]"
                                                value={company.incomeBankId ?? ""}
                                                onChange={(event) => {
                                                  const bankId = event.target.value || null;
                                                  void run(
                                                    {
                                                      type: "linkBusinessIncome",
                                                      inst: company.inst,
                                                      bankId,
                                                    },
                                                    bankId
                                                      ? "Business income linked to bank account"
                                                      : "Business income unlinked",
                                                  );
                                                }}
                                                disabled={pending}
                                              >
                                                <option value="">Temporary business wallet</option>
                                                {company.incomeBankId &&
                                                  company.incomeBankId !== bankId && (
                                                    <option value={company.incomeBankId}>
                                                      {BANK_BY_ID[company.incomeBankId]?.name ??
                                                        company.incomeBankId}
                                                    </option>
                                                  )}
                                                <option value={bankId}>
                                                  This account — {bankDef.name}
                                                </option>
                                              </select>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    {supportsPropertyIncome(bankDef) &&
                                      ownedProperties.length > 0 && (
                                        <div className="space-y-2">
                                          <div className="text-[10px] font-bold uppercase text-muted-foreground">
                                            Real Estate Income
                                          </div>
                                          {ownedProperties.map((property) => (
                                            <label
                                              key={property.inst}
                                              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-2.5"
                                            >
                                              <span className="min-w-0 truncate text-[11px] font-semibold">
                                                {property.inst}
                                              </span>
                                              <select
                                                className="max-w-[58%] rounded-md border border-border bg-background px-2 py-1.5 text-[10px]"
                                                value={property.incomeBankId ?? ""}
                                                onChange={(event) => {
                                                  const bankId = event.target.value || null;
                                                  void run(
                                                    {
                                                      type: "linkPropertyIncome",
                                                      inst: property.inst,
                                                      bankId,
                                                    },
                                                    bankId
                                                      ? "Property income linked to bank account"
                                                      : "Property income unlinked",
                                                  );
                                                }}
                                                disabled={pending}
                                              >
                                                <option value="">Temporary property wallet</option>
                                                {property.incomeBankId &&
                                                  property.incomeBankId !== bankId && (
                                                    <option value={property.incomeBankId}>
                                                      {BANK_BY_ID[property.incomeBankId]?.name ??
                                                        property.incomeBankId}
                                                    </option>
                                                  )}
                                                <option value={bankId}>
                                                  This account — {bankDef.name}
                                                </option>
                                              </select>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                )}

                              {/* Sub-panel 3: Institutional Audit Log */}
                              {bankAppTab === "activity" &&
                                acc.transactions &&
                                acc.transactions.length > 0 && (
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
                                              {tx.type === "deposit" || tx.type === "loan"
                                                ? "+"
                                                : "-"}
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

          {bankAppTab === "institutions" && (
            <div className="space-y-4">
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
                            <span className="text-muted-foreground truncate">
                              {bank.perkDescription}
                            </span>
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
                                setRegistering(bank.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Open Bank App
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
          )}
        </main>
      </div>
    </div>
  );
}
