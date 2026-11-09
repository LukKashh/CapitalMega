import { CORP_BUSINESSES, CORP_DEPARTMENTS, CORP_FACILITIES } from "./config";
import type { CorpState } from "./types";

export type CorporationLeaderboardEntry = {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  activity: number;
  valuation: number;
};

/**
 * Builds the public, presentation-only corporation ranking projection.
 * This is pure domain code: it does not read or write Firestore.
 */
export function corporationLeaderboardEntry(
  id: string,
  corporation: CorpState,
): CorporationLeaderboardEntry {
  let upgradeSpend = 0;

  for (const [facilityId, level] of Object.entries(corporation.facilities || {})) {
    const facility = CORP_FACILITIES.find((item) => item.id === facilityId);
    if (!facility) continue;
    for (let i = 0; i < level; i++) {
      upgradeSpend += Math.round(facility.cost * Math.pow(facility.growth, i));
    }
  }

  for (const departmentId of Object.keys(corporation.departments || {})) {
    const department = CORP_DEPARTMENTS.find((item) => item.id === departmentId);
    if (department) upgradeSpend += department.cost;
  }

  let businessValuation = 0;
  for (const business of Object.values(corporation.businesses || {})) {
    const definition = CORP_BUSINESSES.find((item) => item.id === business.defId);
    if (definition) {
      upgradeSpend += definition.price;
      businessValuation += definition.price;
    }
  }

  let totalShifts = 0;
  let totalContributions = 0;
  for (const member of Object.values(corporation.members || {})) {
    totalShifts += member.shifts || 0;
    totalContributions += member.total || 0;
  }

  return {
    id,
    name: corporation.name || "Corporation",
    tag: corporation.tag || "CORP",
    level: corporation.level || 1,
    xp: corporation.xp || 0,
    activity:
      totalShifts * 10 +
      Math.floor(totalContributions / 1000) +
      (corporation.completedObjectives?.length || 0) * 50,
    // Keep the pre-existing leaderboard valuation semantics: business
    // purchase value contributes once to upgradeSpend and once to the
    // business holdings subtotal.
    valuation: upgradeSpend + businessValuation + (corporation.treasury || 0),
  };
}
