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

  it("requires the newest client whenever a newer release exists", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0",
      minimumSupportedVersion: "1.0.0",
      releaseUrl: "https://github.com/LukKashh/CapitalMega/releases/latest",
      apkUrl: "https://github.com/LukKashh/CapitalMega/releases/download/v1.1.0/Capitalfortune.apk",
      releaseNotes: "Improved launch flow.",
      mandatory: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(fetcher).toHaveBeenCalledWith(UPDATE_MANIFEST_URL, expect.objectContaining({
      cache: "no-store",
    }));
    expect(result.updateAvailable).toBe(true);
    expect(result.updateRequired).toBe(true);
    expect(result.downloadUrl).toBe("https://github.com/LukKashh/CapitalMega/releases/download/v1.1.0/Capitalfortune.apk");
  });

  it("uses the release page until a direct APK asset URL is configured", async () => {
    const releaseUrl = "https://github.com/LukKashh/CapitalMega/releases/latest";
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0",
      minimumSupportedVersion: "1.0.0",
      releaseUrl,
      releaseNotes: "Required update.",
      mandatory: true,
    }), { status: 200 }));

    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(result.updateRequired).toBe(true);
    expect(result.downloadUrl).toBe(releaseUrl);
  });

  it("does not require an update when the installed version is current", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.0.0",
      minimumSupportedVersion: "1.0.0",
      releaseUrl: "https://github.com/LukKashh/CapitalMega/releases/latest",
      releaseNotes: "Current release.",
      mandatory: false,
    }), { status: 200 }));

    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(result.updateAvailable).toBe(false);
    expect(result.updateRequired).toBe(false);
  });

  it("fails closed on malformed manifests", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "not-a-version",
    }), { status: 200 }));

    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });

  it("rejects non-HTTPS APK asset URLs", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0",
      minimumSupportedVersion: "1.0.0",
      releaseUrl: "https://github.com/LukKashh/CapitalMega/releases/latest",
      apkUrl: "http://downloads.example.com/game.apk",
      releaseNotes: "Required update.",
      mandatory: true,
    }), { status: 200 }));

    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });
});
