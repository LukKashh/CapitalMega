export const CASINO_LOYALTY_TIERS = [
  { id: "bronze", name: "Bronze", threshold: 0, multiplier: 1, reward: "Welcome status" },
  { id: "silver", name: "Silver", threshold: 1000, multiplier: 1.02, reward: "Silver lounge access" },
  { id: "gold", name: "Gold", threshold: 5000, multiplier: 1.05, reward: "Gold profile frame" },
  { id: "platinum", name: "Platinum", threshold: 15000, multiplier: 1.08, reward: "Platinum showcase" },
  { id: "diamond", name: "Diamond", threshold: 50000, multiplier: 1.12, reward: "Prestige tier" },
] as const;

export type CasinoLoyaltyTier = (typeof CASINO_LOYALTY_TIERS)[number]["id"];
export type CasinoLoyaltyState = {
  points: number;
  tier: CasinoLoyaltyTier;
  rewardsClaimed: string[];
  streak: number;
  lastVisitAt: number;
};

export function casinoLoyaltyTier(points: number): CasinoLoyaltyTier {
  let tier: CasinoLoyaltyTier = "bronze";
  for (const item of CASINO_LOYALTY_TIERS) {
    if (points >= item.threshold) tier = item.id;
  }
  return tier;
}

export function casinoLoyaltyProgress(points: number) {
  const current = [...CASINO_LOYALTY_TIERS].reverse().find((tier) => points >= tier.threshold) ?? CASINO_LOYALTY_TIERS[0];
  const next = CASINO_LOYALTY_TIERS.find((tier) => tier.threshold > points);
  return {
    tier: current,
    next,
    progress: next ? Math.min(1, (points - current.threshold) / (next.threshold - current.threshold)) : 1,
    remaining: next ? Math.max(0, next.threshold - points) : 0,
  };
}
