import type { StatKey } from "./achievements";
import type { CasinoState } from "./casino";

export type OrderKind = "market" | "limit" | "stop" | "tp";
export type OrderStatus =
  "Open" | "Triggered" | "Partially Filled" | "Executed" | "Cancelled" | "Expired";
export type Order = {
  id: string;
  market: "stock" | "crypto";
  sym: string;
  side: "buy" | "sell";
  kind: OrderKind;
  qty: number;
  filled: number;
  limit?: number;
  trigger?: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  reservedCash: number;
  fees: number;
  avgPrice: number;
};
export type Holding = { qty: number; reserved: number; cost: number };

export type OwnedCompany = {
  inst: string;
  defId: string;
  boughtAt: number;
  price: number;
  staff: Record<string, number>;
  capLevel: number;
  branches: number;
  upgrades: Record<string, number>;
  upgradeValue: number;
  reserves: number;
  liabilities: number;
  uncollected: number;
  incomeBankId?: string;
  suspended: boolean;
  autoSuspended: boolean;
  revenueTotal: number;
  expenseTotal: number;
  history: { t: number; rev: number; exp: number }[];
};

export type OfflineReport = {
  awaySec: number;
  lines: { name: string; hours: number; amount: number; eligible: boolean; note: string }[];
  rent: number;
  rp: number;
  total: number;
  bonusPct: number;
  at: number;
};

export type Notification = {
  id: string;
  t: number;
  kind: "info" | "achievement" | "major" | "warn" | "level";
  text: string;
};

export type PlayerState = {
  v: 1;
  username: string;
  createdAt: number;
  cash: number;
  reservedCash: number;
  xp: number;
  level: number;
  levelRewarded: number;
  clickCapBonus: number;
  clicker: { level: number; count: number };
  clickTokens: number;
  clickTokenAt: number;
  lastTick: number;
  companies: Record<string, OwnedCompany>;
  soldCompanies: { name: string; soldAt: number; payout: number }[];
  capacity: { slots: number; level: number; upgrading: { endsAt: number; cost: number } | null };
  research: {
    built: boolean;
    slots: number;
    active: { id: string; endsAt: number }[];
    done: string[];
    rp: number;
    rpTotal: number;
  };
  stocks: { holdings: Record<string, Holding>; lastEvalTick: number; lastDivDay: number };
  crypto: { holdings: Record<string, Holding>; lastEvalTick: number };
  orders: Order[];
  properties: Record<
    string,
    {
      inst: string;
      defId: string;
      boughtAt: number;
      price: number;
      condition: number;
      upgrades: Record<string, number>;
      upgradeValue: number;
      rentTotal: number;
      uncollected?: number;
      incomeBankId?: string;
    }
  >;
  soldProperties: { name: string; soldAt: number; payout: number }[];
  collectibles: Record<
    string,
    { inst: string; itemId: string; boughtAt: number; price: number; holdUntil: number }
  >;
  collectibleSales: { itemId: string; soldAt: number; price: number; payout: number }[];
  collectionsRewarded: string[];
  achievements: Record<string, { at: number; cycle?: number }>;
  stats: Record<StatKey, number>;
  history: {
    hourly: { t: number; nw: number; cash: number }[];
    daily: { t: number; nw: number; cash: number }[];
  };
  notifications: Notification[];
  lastOffline: OfflineReport | null;
  bankAccounts: Record<
    string,
    {
      inst: string;
      defId: string;
      balance: number;
      createdAt: number;
      transactions: {
        id: string;
        type:
          | "deposit"
          | "withdrawal"
          | "loan"
          | "repayment"
          | "tax"
          | "business_income"
          | "property_income";
        amount: number;
        at: number;
      }[];
      loans: {
        id: string;
        category?: "personal" | "business" | "real-estate";
        principal: number;
        principalRemaining?: number;
        accruedInterest?: number;
        interestRate: number;
        remaining: number;
        nextPayment: number;
        status: "active" | "repaid" | "defaulted";
      }[];
    }
  >;
  corp: {
    id: string | null;
    pending: string[];
    cooldownUntil: number;
    lastShiftAt: number;
    joinedAt: number;
  };
  profile: { title: string; bio: string; avatar: string; theme: string; featured: string | null };
  tax: {
    liability: number;
    periodIncome: {
      business: number;
      rental: number;
      investment: number;
      personal: number;
    };
    lastSettlementAt: number;
  };
  seq: number;
  casino?: CasinoState;
};

export type LedgerEntry = {
  type: string;
  source: string;
  destination: string;
  amount: number;
  entity?: string;
  corp_id?: string;
  meta?: unknown;
};

export type CorpMember = {
  name: string;
  rank: string;
  joinedAt: number;
  contribDay: number;
  contribToday: number;
  total: number;
  shifts: number;
  dept: string | null;
};
export type CorpObjective = {
  id: string;
  kind: "funds" | "shifts";
  title: string;
  target: number;
  progress: number;
  participants: string[];
  minParticipants: number;
  expiresAt: number;
  reward: { corpXp: number; treasury: number; memberXp: number };
  milestone: boolean;
};
export type CorpState = {
  id: string;
  name: string;
  tag: string;
  founderId: string;
  description: string;
  recruitment: "open" | "application" | "invitation";
  createdAt: number;
  level: number;
  xp: number;
  treasury: number;
  members: Record<string, CorpMember>;
  removed: Record<string, number>;
  applications: Record<string, { name: string; at: number }>;
  invites: Record<string, { name: string; at: number }>;
  facilities: Record<string, number>;
  departments: Record<string, { officer: string | null; at: number }>;
  businesses: Record<
    string,
    { inst: string; defId: string; boughtAt: number; revenueTotal: number }
  >;
  objectives: CorpObjective[];
  objectiveCooldownUntil: number;
  objectiveSeq: number;
  milestoneIdx: number;
  completedObjectives: { title: string; at: number; success: boolean }[];
  lastTick: number;
  log: { t: number; text: string; amount?: number }[];
  pendingXp: Record<string, number>;
  dissolved?: boolean;
};

export type BankAction =
  | { type: "registerBank"; bankId: string }
  | { type: "deposit"; bankId: string; amount: number }
  | { type: "withdraw"; bankId: string; amount: number }
  | {
      type: "applyLoan";
      bankId: string;
      amount: number;
      category?: "personal" | "business" | "real-estate";
    }
  | { type: "repayLoan"; bankId: string; loanId: string; amount: number }
  | { type: "linkBusinessIncome"; inst: string; bankId: string | null }
  | { type: "linkPropertyIncome"; inst: string; bankId: string | null }
  | { type: "settleTax" };

export class GameError extends Error {}
