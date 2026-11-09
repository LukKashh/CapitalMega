import { describe, expect, it } from "vitest";
import { CORP_BUSINESSES, CORP_DEPARTMENTS, CORP_FACILITIES } from "./config";
import { corporationLeaderboardEntry } from "./leaderboard";
import type { CorpState } from "./types";

function makeCorporation(overrides: Partial<CorpState> = {}): CorpState {
  return {
    id: "corp-test",
    name: "Test Corporation",
    tag: "TEST",
    founderId: "founder",
    description: "",
    recruitment: "open",
    createdAt: 0,
    level: 1,
    xp: 0,
    treasury: 0,
    members: {},
    removed: {},
    applications: {},
    invites: {},
    facilities: {},
    departments: {},
    businesses: {},
    objectives: [],
    objectiveCooldownUntil: 0,
    objectiveSeq: 0,
    milestoneIdx: 0,
    completedObjectives: [],
    lastTick: 0,
    log: [],
    pendingXp: {},
    ...overrides,
  };
}

describe("corporationLeaderboardEntry", () => {
  it("returns a minimal zero-activity projection for an empty corporation", () => {
    expect(corporationLeaderboardEntry("corp-test", makeCorporation())).toEqual({
      id: "corp-test",
      name: "Test Corporation",
      tag: "TEST",
      level: 1,
      xp: 0,
      activity: 0,
      valuation: 0,
    });
  });

  it("preserves the existing valuation and activity aggregation", () => {
    const facility = CORP_FACILITIES.find((item) => item.id !== "f_hq")!;
    const department = CORP_DEPARTMENTS[0]!;
    const business = CORP_BUSINESSES[0]!;
    const corporation = makeCorporation({
      level: 4,
      xp: 250,
      treasury: 12_000,
      facilities: { [facility.id]: 2 },
      departments: { [department.id]: { officer: null, at: 0 } },
      businesses: {
        business1: {
          inst: "business1",
          defId: business.id,
          boughtAt: 0,
          revenueTotal: 0,
        },
      },
      members: {
        player1: {
          name: "Player One",
          rank: "Member",
          joinedAt: 0,
          contribDay: 0,
          contribToday: 0,
          total: 2_500,
          shifts: 2,
          dept: null,
        },
      },
      completedObjectives: [{ title: "Objective", at: 0, success: true }],
    });

    const facilitySpend =
      Math.round(facility.cost * Math.pow(facility.growth, 0)) +
      Math.round(facility.cost * Math.pow(facility.growth, 1));

    expect(corporationLeaderboardEntry("corp-test", corporation)).toEqual({
      id: "corp-test",
      name: "Test Corporation",
      tag: "TEST",
      level: 4,
      xp: 250,
      activity: 72,
      valuation: 12_000 + facilitySpend + department.cost + business.price * 2,
    });
  });
});
