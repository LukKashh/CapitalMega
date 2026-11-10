import { describe, expect, it, vi } from "vitest";
import { checkForGameUpdate, compareVersions, UPDATE_MANIFEST_URL } from "./game-update";

const releaseUrl = "https://github.com/LukKashh/CapitalMega/releases/latest";
const apkUrl = "https://github.com/LukKashh/CapitalMega/releases/download/v1.1.0/Capitalfortune.apk";
const checksum = "a".repeat(64);

describe("game update versioning", () => {
  it("compares numeric versions without lexicographic mistakes", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBe(1);
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
  });

  it("rejects malformed version strings", () => {
    expect(() => compareVersions("latest", "1.0.0")).toThrow(/invalid version/i);
  });

  it("requires a newer release and exposes its verified APK metadata", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0", minimumSupportedVersion: "1.0.0", releaseUrl,
      apkUrl, apkSha256: checksum, releaseNotes: "Improved launch flow.", mandatory: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(fetcher).toHaveBeenCalledWith(UPDATE_MANIFEST_URL, expect.objectContaining({ cache: "no-store" }));
    expect(result.updateAvailable).toBe(true);
    expect(result.updateRequired).toBe(true);
    expect(result.downloadUrl).toBe(apkUrl);
    expect(result.apkSha256).toBe(checksum);
  });

  it("uses the release page when no direct APK asset is configured", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0", minimumSupportedVersion: "1.0.0", releaseUrl,
      releaseNotes: "Required update.", mandatory: true,
    }), { status: 200 }));
    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(result.updateRequired).toBe(true);
    expect(result.downloadUrl).toBe(releaseUrl);
  });

  it("does not require an update when the installed version is current", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.0.0", minimumSupportedVersion: "1.0.0", releaseUrl,
      releaseNotes: "Current release.", mandatory: false,
    }), { status: 200 }));
    const result = await checkForGameUpdate(fetcher, "1.0.0");
    expect(result.updateAvailable).toBe(false);
    expect(result.updateRequired).toBe(false);
  });

  it("fails closed on malformed manifests", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ latestVersion: "not-a-version" }), { status: 200 }));
    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });

  it("rejects non-HTTPS APK asset URLs", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0", minimumSupportedVersion: "1.0.0", releaseUrl,
      apkUrl: "http://downloads.example.com/game.apk", apkSha256: checksum,
      releaseNotes: "Required update.", mandatory: true,
    }), { status: 200 }));
    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });

  it("requires a valid SHA-256 whenever a direct APK URL is configured", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      latestVersion: "1.1.0", minimumSupportedVersion: "1.0.0", releaseUrl, apkUrl,
      apkSha256: "not-a-checksum", releaseNotes: "Required update.", mandatory: true,
    }), { status: 200 }));
    await expect(checkForGameUpdate(fetcher, "1.0.0")).rejects.toThrow(/invalid release manifest/i);
  });
});
