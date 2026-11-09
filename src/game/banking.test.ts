import { describe, it, expect } from "vitest";
import { apply, newPlayer, tick, netWorth, checkAchievements, type Ctx } from "./engine";
import { BANKS, BANK_BY_ID, calculateBankCreditLimit, getActiveDebt } from "./banking";
import { EMPTY_MODS } from "./config";
import { ACHIEVEMENTS } from "./achievements";

describe("Banking Feature Logic", () => {
  const baseTime = 1700000000000;

  const createCtx = (s = newPlayer(baseTime), now = baseTime): Ctx => ({
    s,
    now,
    ledger: [],
    stock: [],
    corpMods: EMPTY_MODS,
  });

  it("should have all 12 institutions configured with full metrics", () => {
    expect(BANKS.length).toBe(12);
    for (const bank of BANKS) {
      expect(bank.id).toMatch(/^BNK-\d{3}$/);
      expect(bank.name).toBeTruthy();
      expect(bank.loanApr).toBeGreaterThan(0);
      expect(bank.savingsApy).toBeGreaterThan(0);
      expect(bank.minCredit).toBeGreaterThanOrEqual(10_000);
      expect(bank.maxCredit).toBeGreaterThan(bank.minCredit);
      expect(bank.perkTitle).toBeTruthy();
      expect(BANK_BY_ID[bank.id]).toBe(bank);
    }
  });

  it("should register a bank account and reject duplicate registration", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });

    expect(s.bankAccounts["BNK-001"]).toBeDefined();
    expect(s.bankAccounts["BNK-001"].balance).toBe(0);
    expect(s.bankAccounts["BNK-001"].loans).toEqual([]);

    expect(() => {
      apply(c, { type: "registerBank", bankId: "BNK-001" });
    }).toThrow("Already registered");
  });

  it("enforces a global maximum of two active bank accounts", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });
    apply(c, { type: "registerBank", bankId: "BNK-003" });
    expect(() => apply(c, { type: "registerBank", bankId: "BNK-005" })).toThrow(
      "maximum of two active bank accounts",
    );
    expect(Object.keys(s.bankAccounts)).toHaveLength(2);
  });

  it("enforces each bank's configured player-level account requirement", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    expect(() => apply(c, { type: "registerBank", bankId: "BNK-002" })).toThrow(
      "Requires player level 2",
    );
  });

  it("uses consolidated debt when assessing a second bank loan", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });
    apply(c, { type: "registerBank", bankId: "BNK-003" });
    apply(c, { type: "applyLoan", bankId: "BNK-001", amount: 20_000, category: "business" });
    expect(s.bankAccounts["BNK-001"].loans[0].category).toBe("business");
    expect(() => apply(c, { type: "applyLoan", bankId: "BNK-003", amount: 1 })).toThrow(
      "Loan amount exceeds available credit line",
    );
  });

  it("routes collected business and property income into the linked bank account", () => {
    const s = newPlayer(baseTime, "IncomeTycoon");
    for (const a of ACHIEVEMENTS) s.achievements[a.id] = { at: baseTime };
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });
    s.companies.company_1 = {
      inst: "company_1",
      defId: "lemon",
      boughtAt: baseTime,
      price: 100_000,
      staff: {},
      capLevel: 0,
      branches: 0,
      upgrades: {},
      upgradeValue: 0,
      reserves: 0,
      liabilities: 0,
      uncollected: 5_000,
      suspended: false,
      autoSuspended: false,
      revenueTotal: 5_000,
      expenseTotal: 0,
      history: [],
    };
    s.properties.property_1 = {
      inst: "property_1",
      defId: "p_studio",
      boughtAt: baseTime,
      price: 100_000,
      condition: 100,
      upgrades: {},
      upgradeValue: 0,
      rentTotal: 3_000,
      uncollected: 3_000,
    };

    s.cash = 0;
    apply(c, { type: "linkBusinessIncome", inst: "company_1", bankId: "BNK-001" });
    apply(c, { type: "linkPropertyIncome", inst: "property_1", bankId: "BNK-001" });
    apply(c, { type: "collect" });
    apply(c, { type: "collectRent" });

    expect(s.bankAccounts["BNK-001"].balance).toBe(8_000);
    expect(s.cash).toBe(0);
    expect(s.companies.company_1.incomeBankId).toBe("BNK-001");
    expect(s.properties.property_1.incomeBankId).toBe("BNK-001");
  });

  it("deposits newly generated property income directly into its linked bank", () => {
    const s = newPlayer(baseTime);
    for (const a of ACHIEVEMENTS) s.achievements[a.id] = { at: baseTime };
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });
    s.companies.company_1 = {
      inst: "company_1",
      defId: "lemon",
      boughtAt: baseTime,
      price: 1_000,
      staff: { Vendor: 2 },
      capLevel: 0,
      branches: 0,
      upgrades: {},
      upgradeValue: 0,
      reserves: 100,
      liabilities: 0,
      uncollected: 0,
      incomeBankId: "BNK-001",
      suspended: false,
      autoSuspended: false,
      revenueTotal: 0,
      expenseTotal: 0,
      history: [],
    };
    s.properties.property_1 = {
      inst: "property_1",
      defId: "p_studio",
      boughtAt: baseTime,
      price: 40_000,
      condition: 100,
      upgrades: {},
      upgradeValue: 0,
      rentTotal: 0,
      uncollected: 0,
      incomeBankId: "BNK-001",
    };

    s.cash = 0;
    tick(createCtx(s, baseTime + 3_600_000));

    expect(s.bankAccounts["BNK-001"].balance).toBeGreaterThan(0);
    expect(s.companies.company_1.uncollected).toBe(0);
    expect(s.properties.property_1.uncollected).toBe(0);
    expect(s.stats.rentEarned).toBeGreaterThan(0);
    expect(s.cash).toBe(0);
  });

  it("produces equivalent savings and loan interest after one long tick or many short ticks", () => {
    const initial = newPlayer(baseTime);
    initial.level = 2;
    initial.cash = 150_000;
    const initialCtx = createCtx(initial);
    apply(initialCtx, { type: "registerBank", bankId: "BNK-002" });
    apply(initialCtx, { type: "deposit", bankId: "BNK-002", amount: 100_000 });
    apply(initialCtx, { type: "applyLoan", bankId: "BNK-002", amount: 20_000 });

    const oneTick = structuredClone(initial);
    const manyTicks = structuredClone(initial);
    const day = 86_400_000;
    tick(createCtx(oneTick, baseTime + day));
    for (let hour = 1; hour <= 24; hour++) {
      tick(createCtx(manyTicks, baseTime + hour * 3_600_000));
    }

    expect(manyTicks.bankAccounts["BNK-002"].balance).toBeCloseTo(
      oneTick.bankAccounts["BNK-002"].balance,
      6,
    );
    expect(manyTicks.bankAccounts["BNK-002"].loans[0].remaining).toBeCloseTo(
      oneTick.bankAccounts["BNK-002"].loans[0].remaining,
      6,
    );
  });

  it("should handle cash deposits and withdrawals with balance checks and transaction records", () => {
    const s = newPlayer(baseTime);
    s.cash = 50_000;
    const c = createCtx(s);
    checkAchievements(c); // flush baseline achievements
    apply(c, { type: "registerBank", bankId: "BNK-001" });

    const cashBeforeDeposit = s.cash;
    apply(c, { type: "deposit", bankId: "BNK-001", amount: 20_000 });
    expect(s.cash).toBe(cashBeforeDeposit - 20_000);
    expect(s.bankAccounts["BNK-001"].balance).toBe(20_000);
    expect(s.bankAccounts["BNK-001"].transactions.length).toBe(1);
    expect(s.bankAccounts["BNK-001"].transactions[0].type).toBe("deposit");
    expect(s.bankAccounts["BNK-001"].transactions[0].amount).toBe(20_000);

    // Fail to deposit more than available cash
    expect(() => {
      apply(c, { type: "deposit", bankId: "BNK-001", amount: 999_999 });
    }).toThrow("Insufficient cash");

    // Withdraw 5,000
    const cashBeforeWithdraw = s.cash;
    apply(c, { type: "withdraw", bankId: "BNK-001", amount: 5_000 });
    expect(s.cash).toBe(cashBeforeWithdraw + 5_000);
    expect(s.bankAccounts["BNK-001"].balance).toBe(15_000);
    expect(s.bankAccounts["BNK-001"].transactions.length).toBe(2);
    expect(s.bankAccounts["BNK-001"].transactions[1].type).toBe("withdrawal");

    // Fail to withdraw more than account balance
    expect(() => {
      apply(c, { type: "withdraw", bankId: "BNK-001", amount: 20_000 });
    }).toThrow("Insufficient funds");
  });

  it("should calculate credit limits accurately based on bank category and player assets", () => {
    const s = newPlayer(baseTime);
    s.cash = 100_000;

    // Wide-scale bank (Meridian Bank BNK-001)
    const meridian = BANK_BY_ID["BNK-001"];
    const limitWide = calculateBankCreditLimit(meridian, s, baseTime);
    expect(limitWide).toBeGreaterThanOrEqual(meridian.minCredit);

    // Real-estate bank (Estate Capital Bank BNK-005)
    const realEstateBank = BANK_BY_ID["BNK-005"];
    const limitRE = calculateBankCreditLimit(realEstateBank, s, baseTime);
    // Baseline starter credit when player has no properties yet
    expect(limitRE).toBe(realEstateBank.minCredit);

    // Business bank (Venture Commercial Bank BNK-009)
    const bizBank = BANK_BY_ID["BNK-009"];
    const limitBiz = calculateBankCreditLimit(bizBank, s, baseTime);
    expect(limitBiz).toBe(bizBank.minCredit);
  });

  it("should handle loan application, credit checking, and repayments", () => {
    const s = newPlayer(baseTime);
    s.cash = 5_000;
    const c = createCtx(s);
    checkAchievements(c); // flush any starter achievements
    apply(c, { type: "registerBank", bankId: "BNK-001" });

    const meridian = BANK_BY_ID["BNK-001"];
    const maxCredit = calculateBankCreditLimit(meridian, s, baseTime);

    // Exceeding credit limit should throw
    expect(() => {
      apply(c, { type: "applyLoan", bankId: "BNK-001", amount: maxCredit + 50_000 });
    }).toThrow("Loan amount exceeds available credit line");

    // Borrow 15,000
    const cashBeforeBorrow = s.cash;
    apply(c, { type: "applyLoan", bankId: "BNK-001", amount: 15_000 });
    expect(s.cash).toBe(cashBeforeBorrow + 15_000);
    const acc = s.bankAccounts["BNK-001"];
    expect(acc.loans.length).toBe(1);
    const loan = acc.loans[0];
    expect(loan.principal).toBe(15_000);
    expect(loan.category).toBe("personal");
    expect(loan.remaining).toBe(15_000);
    expect(loan.status).toBe("active");
    expect(getActiveDebt(acc)).toBe(15_000);

    // Partial repayment: 5,000
    const cashBeforeRepay = s.cash;
    apply(c, {
      type: "repayLoan",
      bankId: "BNK-001",
      loanId: loan.id,
      amount: 5_000,
    });
    expect(s.cash).toBe(cashBeforeRepay - 5_000);
    expect(loan.remaining).toBe(10_000);
    expect(loan.status).toBe("active");

    // Full repayment with extra amount (should cap at remaining 10,000)
    const cashBeforeFullRepay = s.cash;
    apply(c, {
      type: "repayLoan",
      bankId: "BNK-001",
      loanId: loan.id,
      amount: 20_000, // exceeds remaining 10,000
    });
    expect(s.cash).toBe(cashBeforeFullRepay - 10_000); // Exactly remaining debited
    expect(loan.remaining).toBe(0);
    expect(loan.status).toBe("repaid");
    expect(getActiveDebt(acc)).toBe(0);
  });

  it("should accumulate real-time loan interest and deposit savings yield over elapsed time", () => {
    const s = newPlayer(baseTime);
    s.level = 2;
    s.cash = 150_000;
    const c = createCtx(s);
    checkAchievements(c);
    apply(c, { type: "registerBank", bankId: "BNK-002" });

    // Deposit 100,000 into high-yield Continental Trust (3.6% APY)
    apply(c, { type: "deposit", bankId: "BNK-002", amount: 100_000 });

    // Borrow 20,000
    apply(c, { type: "applyLoan", bankId: "BNK-002", amount: 20_000 });

    const acc = s.bankAccounts["BNK-002"];
    const initialBalance = acc.balance;
    const loan = acc.loans[0];
    const initialDebt = loan.remaining;

    // Advance 1 day (86,400,000 ms)
    const nextDay = baseTime + 86_400_000;
    tick(createCtx(s, nextDay));

    // Deposit yield should have increased balance
    expect(acc.balance).toBeGreaterThan(initialBalance);
    // Loan interest should have increased remaining debt
    expect(loan.remaining).toBeGreaterThan(initialDebt);
    expect(loan.accruedInterest).toBeGreaterThan(0);
    expect(loan.principalRemaining).toBe(20_000);
  });

  it("applies repayments to accrued interest before principal", () => {
    const s = newPlayer(baseTime);
    s.cash = 10_000;
    const c = createCtx(s);
    apply(c, { type: "registerBank", bankId: "BNK-001" });
    apply(c, { type: "applyLoan", bankId: "BNK-001", amount: 15_000 });
    const loan = s.bankAccounts["BNK-001"].loans[0];

    c.now = baseTime + 86_400_000;
    tick(c);
    const accruedBefore = loan.accruedInterest ?? 0;
    const principalBefore = loan.principalRemaining ?? 0;
    expect(accruedBefore).toBeGreaterThan(0);

    apply(c, { type: "repayLoan", bankId: "BNK-001", loanId: loan.id, amount: 5_000 });
    expect(loan.accruedInterest).toBeCloseTo(0, 6);
    expect(loan.principalRemaining).toBeCloseTo(principalBefore - (5_000 - accruedBefore), 6);
  });

  it("should settle tax liability and reset period income breakdown", () => {
    const s = newPlayer(baseTime);
    s.cash = 50_000;
    const c = createCtx(s);
    checkAchievements(c);

    s.tax.liability = 12_500;
    s.tax.periodIncome.business = 50_000;
    s.tax.periodIncome.rental = 25_000;

    const cashBefore = s.cash;
    const taxDue = s.tax.liability;
    apply(c, { type: "settleTax" });
    expect(s.cash).toBe(cashBefore - taxDue);
    expect(s.tax.liability).toBe(0);
    expect(s.tax.periodIncome.business).toBe(0);
    expect(s.tax.periodIncome.rental).toBe(0);

    // Settling when liability is 0 throws error
    expect(() => {
      apply(c, { type: "settleTax" });
    }).toThrow("No tax liability to settle");
  });

  it("should reflect bank balances as liquid assets and loans as liabilities in net worth", () => {
    const s = newPlayer(baseTime);
    s.cash = 10_000;
    const c = createCtx(s);
    checkAchievements(c);
    // clear any initial tax from rewards for precise debt liability check
    s.tax.liability = 0;
    apply(c, { type: "registerBank", bankId: "BNK-001" });

    const nw1 = netWorth(s, baseTime).total;

    // Depositing cash moves it from cash to bank balance - net worth shouldn't drop!
    apply(c, { type: "deposit", bankId: "BNK-001", amount: 10_000 });
    const nw2 = netWorth(s, baseTime).total;
    expect(nw2).toBeCloseTo(nw1, 1);

    // Taking a loan gives cash but adds liability - net worth remains balanced
    const nwBeforeLoan = netWorth(s, baseTime).total;
    apply(c, { type: "applyLoan", bankId: "BNK-001", amount: 10_000 });
    const nw3 = netWorth(s, baseTime);
    expect(nw3.liabilities).toBe(10_000); // exactly 10,000 loan debt
    expect(nw3.total).toBeCloseTo(nwBeforeLoan, 1);
  });
});
