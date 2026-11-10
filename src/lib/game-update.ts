export type GameUpdateManifest = {
  latestVersion: string;
  minimumSupportedVersion: string;
  releaseUrl: string;
  releaseNotes: string;
  mandatory: boolean;
};

export type GameUpdateStatus = {
  currentVersion: string;
  latestVersion: string;
  minimumSupportedVersion: string;
  updateAvailable: boolean;
  updateRequired: boolean;
  releaseUrl: string;
  releaseNotes: string;
};

export const CURRENT_APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
export const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/LukKashh/CapitalMega/remix/supabase-android-independent/public/update-manifest.json";

function versionParts(version: string): number[] | null {
  if (!/^\\d+(?:\\.\\d+){1,3}$/.test(version)) return null;
  return version.split(".").map((part) => Number.parseInt(part, 10));
}

/** Returns -1, 0 or 1. Invalid versions are rejected rather than guessed. */
export function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  if (!a || !b) throw new Error("The update service returned an invalid version number.");
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function isValidManifest(value: unknown): value is GameUpdateManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return (
    typeof manifest.latestVersion === "string" &&
    versionParts(manifest.latestVersion) !== null &&
    typeof manifest.minimumSupportedVersion === "string" &&
    versionParts(manifest.minimumSupportedVersion) !== null &&
    typeof manifest.releaseUrl === "string" &&
    manifest.releaseUrl.startsWith("https://") &&
    typeof manifest.releaseNotes === "string" &&
    typeof manifest.mandatory === "boolean"
  );
}

export async function checkForGameUpdate(
  fetcher: typeof fetch = fetch,
  currentVersion = CURRENT_APP_VERSION,
): Promise<GameUpdateStatus> {
  const response = await fetcher(UPDATE_MANIFEST_URL, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Couldn't check for updates. Check your connection and retry.");

  const payload: unknown = await response.json();
  if (!isValidManifest(payload)) {
    throw new Error("The update service returned an invalid release manifest.");
  }

  const updateAvailable = compareVersions(payload.latestVersion, currentVersion) > 0;
  const updateRequired =
    updateAvailable &&
    (payload.mandatory || compareVersions(payload.minimumSupportedVersion, currentVersion) > 0);

  return {
    currentVersion,
    latestVersion: payload.latestVersion,
    minimumSupportedVersion: payload.minimumSupportedVersion,
    updateAvailable,
    updateRequired,
    releaseUrl: payload.releaseUrl,
    releaseNotes: payload.releaseNotes,
  };
}
