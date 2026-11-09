import type { PlayerState } from "./types";
import { companyValuation, propertyValue, netWorth } from "./engine";

export type BankCategory = "Wide-scale" | "Real-estate" | "Business-finance";

export interface BankDef {
  id: string;
  name: string;
  category: BankCategory;
  description: string;
  loanApr: number; // e.g. 0.065 for 6.5% APR
  savingsApy: number; // e.g. 0.032 for 3.2% APY
  creditMultiplier: number; // share of relevant assets offered as credit line
  minCredit: number; // guaranteed starter credit line
  maxCredit: number; // upper institutional ceiling
  perkTitle: string;
  perkDescription: string;
  tierRequired: number; // Player level minimum to unlock (1 for starter, up to 5)
}

export const BANKS: BankDef[] = [
  // ------------------------------------------------------------ Wide-scale
  {
    id: "BNK-001",
    name: "Meridian Bank",
    category: "Wide-scale",
    description:
      "General-purpose financing. Balanced commercial, property, and consumer banking with low maintenance fees.",
    loanApr: 0.065, // 6.5% APR
    savingsApy: 0.028, // 2.8% APY
    creditMultiplier: 0.2, // 20% of total Net Worth
    minCredit: 25_000,
    maxCredit: 15_000_000,
    perkTitle: "Universal Prime Credit",
    perkDescription: "Balanced credit line assessed against your total global net worth.",
    tierRequired: 1,
  },
  {
    id: "BNK-002",
    name: "Continental Trust",
    category: "Wide-scale",
    description:
      "Broad commercial financing with premium reserve yields and flexible institutional repayment schedules.",
    loanApr: 0.072,
    savingsApy: 0.036, // Premium 3.6% APY
    creditMultiplier: 0.22,
    minCredit: 50_000,
    maxCredit: 25_000_000,
    perkTitle: "High-Yield Reserves",
    perkDescription: "Premium 3.6% APY compounding daily on positive reserve balances.",
    tierRequired: 2,
  },
  {
    id: "BNK-003",
    name: "Union National Bank",
    category: "Wide-scale",
    description:
      "Centuries-old national banking institution providing accessible entry liquidity for growing conglomerates.",
    loanApr: 0.058, // Low 5.8% APR
    savingsApy: 0.022,
    creditMultiplier: 0.18,
    minCredit: 20_000,
    maxCredit: 10_000_000,
    perkTitle: "Low-APR Borrowing",
    perkDescription: "Lowest base borrowing APR among general-purpose commercial banks.",
    tierRequired: 1,
  },
  {
    id: "BNK-004",
    name: "Horizon Financial",
    category: "Wide-scale",
    description:
      "Modern financial group specializing in rapid liquidity distribution and automated portfolio bridging.",
    loanApr: 0.069,
    savingsApy: 0.031,
    creditMultiplier: 0.25,
    minCredit: 35_000,
    maxCredit: 30_000_000,
    perkTitle: "Expedited Liquidity",
    perkDescription: "Expands credit lines up to 25% of net worth for aggressive empire growth.",
    tierRequired: 3,
  },

  // ------------------------------------------------------------ Real-estate
  {
    id: "BNK-005",
    name: "Estate Capital Bank",
    category: "Real-estate",
    description:
      "Premier real-estate mortgage lender. Offers leveraged debt backed directly by residential and commercial holdings.",
    loanApr: 0.052, // 5.2% APR mortgage rate
    savingsApy: 0.025,
    creditMultiplier: 0.35, // 35% of Property Portfolio
    minCredit: 50_000,
    maxCredit: 40_000_000,
    perkTitle: "Mortgage Collateralization",
    perkDescription:
      "Borrow up to 35% of your total property portfolio value at competitive mortgage rates.",
    tierRequired: 1,
  },
  {
    id: "BNK-006",
    name: "Landmark Financial",
    category: "Real-estate",
    description:
      "Commercial property financing and developer syndication. Provides capital for high-occupancy assets.",
    loanApr: 0.059,
    savingsApy: 0.03,
    creditMultiplier: 0.4,
    minCredit: 100_000,
    maxCredit: 60_000_000,
    perkTitle: "Commercial Syndication",
    perkDescription:
      "Generous 40% collateral multiplier on retail plazas, hotels, and office complexes.",
    tierRequired: 2,
  },
  {
    id: "BNK-007",
    name: "Granite Property Bank",
    category: "Real-estate",
    description:
      "Institutional real-estate trust offering fixed-rate property acquisitions and emergency escrow facilities.",
    loanApr: 0.048, // Very low 4.8% APR
    savingsApy: 0.02,
    creditMultiplier: 0.3,
    minCredit: 75_000,
    maxCredit: 35_000_000,
    perkTitle: "Fixed-Rate Guarantee",
    perkDescription:
      "Ultra-low 4.8% APR borrowing rates for conservative long-term property investors.",
    tierRequired: 3,
  },
  {
    id: "BNK-008",
    name: "Urban Holdings Bank",
    category: "Real-estate",
    description:
      "Urban development and residential tower financing with high-yield escrow accounts for tenant receipts.",
    loanApr: 0.062,
    savingsApy: 0.038, // High savings yield
    creditMultiplier: 0.45,
    minCredit: 120_000,
    maxCredit: 80_000_000,
    perkTitle: "High-Leverage Escrow",
    perkDescription:
      "Leverage up to 45% of real estate value plus high-yield 3.8% APY property reserves.",
    tierRequired: 4,
  },

  // ------------------------------------------------------------ Business-finance
  {
    id: "BNK-009",
    name: "Venture Commercial Bank",
    category: "Business-finance",
    description:
      "Venture debt and enterprise line-of-credit provider. Unlocks working capital backed by operational business value.",
    loanApr: 0.068,
    savingsApy: 0.032,
    creditMultiplier: 0.3, // 30% of Business Valuation
    minCredit: 40_000,
    maxCredit: 50_000_000,
    perkTitle: "Enterprise Working Capital",
    perkDescription:
      "Access credit based on your active companies' market valuation and operating cash reserves.",
    tierRequired: 1,
  },
  {
    id: "BNK-010",
    name: "Industrial Finance Group",
    category: "Business-finance",
    description:
      "Heavy industry and logistics financing. Capital expenditure loans for factories, mines, and refineries.",
    loanApr: 0.055,
    savingsApy: 0.027,
    creditMultiplier: 0.35,
    minCredit: 80_000,
    maxCredit: 75_000_000,
    perkTitle: "Industrial CapEx Lines",
    perkDescription:
      "Discounted 5.5% APR loans tailored for heavy industrial production facilities.",
    tierRequired: 2,
  },
  {
    id: "BNK-011",
    name: "Enterprise Growth Bank",
    category: "Business-finance",
    description:
      "High-growth venture lender specializing in rapid franchise scaling and branch expansion facilities.",
    loanApr: 0.075,
    savingsApy: 0.042, // Top tier 4.2% APY
    creditMultiplier: 0.4,
    minCredit: 150_000,
    maxCredit: 90_000_000,
    perkTitle: "Venture Growth Facility",
    perkDescription:
      "Maximum 40% business valuation collateral limit paired with top-tier 4.2% APY savings.",
    tierRequired: 3,
  },
  {
    id: "BNK-012",
    name: "Commerce First Bank",
    category: "Business-finance",
    description:
      "Merchant banking and cash management conglomerate serving global supply chains and wholesale operations.",
    loanApr: 0.061,
    savingsApy: 0.034,
    creditMultiplier: 0.32,
    minCredit: 60_000,
    maxCredit: 65_000_000,
    perkTitle: "Merchant Treasury",
    perkDescription:
      "Streamlined merchant credit line with balanced yields for day-to-day operations.",
    tierRequired: 1,
  },
];

export const BANK_BY_ID: Record<string, BankDef> = Object.fromEntries(BANKS.map((b) => [b.id, b]));

/**
 * Calculates the total available credit line (maximum total borrowing power)
 * for a specific bank based on its category and player assets.
 */
export function calculateBankCreditLimit(bank: BankDef, state: PlayerState, now: number): number {
  if (bank.category === "Real-estate") {
    let propVal = 0;
    for (const pr of Object.values(state.properties || {})) {
      propVal += propertyValue(pr);
    }
    const assetBased = propVal * bank.creditMultiplier;
    return Math.min(bank.maxCredit, Math.max(bank.minCredit, Math.floor(assetBased)));
  }

  if (bank.category === "Business-finance") {
    let bizVal = 0;
    for (const co of Object.values(state.companies || {})) {
      bizVal += companyValuation(co) + (co.reserves || 0);
    }
    const assetBased = bizVal * bank.creditMultiplier;
    return Math.min(bank.maxCredit, Math.max(bank.minCredit, Math.floor(assetBased)));
  }

  // Wide-scale: based on total net worth
  const totalNw = netWorth(state, now).total;
  const assetBased = totalNw * bank.creditMultiplier;
  return Math.min(bank.maxCredit, Math.max(bank.minCredit, Math.floor(assetBased)));
}

/**
 * Returns current active debt in a specific bank account.
 */
export function getActiveDebt(acc?: PlayerState["bankAccounts"][string]): number {
  if (!acc || !acc.loans) return 0;
  return acc.loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.remaining || 0), 0);
}

/** Consolidated outstanding exposure across every institution. */
export function getTotalActiveDebt(state: PlayerState, now = state.lastTick): number {
  const elapsedDays = Math.max(0, now - state.lastTick) / 86400000;
  return Object.values(state.bankAccounts || {}).reduce((sum, account) => {
    const debt = (account.loans || [])
      .filter((loan) => loan.status === "active")
      .reduce(
        (loanSum, loan) => loanSum + loan.remaining * Math.pow(1 + loan.interestRate, elapsedDays),
        0,
      );
    return sum + debt;
  }, 0);
}

/** Remaining borrowing capacity at this institution after all cross-bank debt. */
export function getAvailableBankCredit(bank: BankDef, state: PlayerState, now: number): number {
  return Math.max(0, calculateBankCreditLimit(bank, state, now) - getTotalActiveDebt(state, now));
}

export const MAX_ACTIVE_BANK_ACCOUNTS = 2;

export function supportsBusinessIncome(bank: BankDef): boolean {
  return bank.category === "Wide-scale" || bank.category === "Business-finance";
}

export function supportsPropertyIncome(bank: BankDef): boolean {
  return bank.category === "Wide-scale" || bank.category === "Real-estate";
}
