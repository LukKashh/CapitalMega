import { describe, expect, it, vi } from "vitest";
import {
  checkForGameUpdate,
  compareVersions,
  UPDATE_MANIFEST_URL,
} from "./game-update";

describe("game update versioning", () => {
  it("compares numeric versions without lexicographic mistakes", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBe(1);
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
  });

  it("rejects malformed version strings", () => {
    expect(() => compareVersions("latest", "1.0.0")).toThrow(/invalid version/i);
  });

  it("returns an optional update when a newer release is published", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0",
      minimumSupportedVersion: "1.0.0",
      releaseUrl: "https://github.com/LukKashh/CapitalMega/releases/latest",
      releaseNotes: "Improved launch flow.",
      mandatory: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(fetcher).toHaveBeenCalledWith(UPDATE_MANIFEST_URL, expect.objectContaining({
      cache: "no-store",
    }));
    expect(result.updateAvailable).toBe(true);
    expect(result.updateRequired).toBe(false);
  });

  it("marks a client below the minimum supported version as mandatory", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "2.0.0",
      minimumSupportedVersion: "1.5.0",
      releaseUrl: "https://github.com/LukKashh/CapitalMega/releases/latest",
      releaseNotes: "Required update.",
      mandatory: true,
    }), { status: 200 }));

    const result = await checkForGameUpdate(fetcher, "1.4.9");
    expect(result.updateAvailable).toBe(true);
    expect(result.updateRequired).toBe(true);
  });

  it("fails closed on malformed manifests", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "not-a-version",
    }), { status: 200 }));

    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });
});
