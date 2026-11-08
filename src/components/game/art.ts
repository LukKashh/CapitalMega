// Capitalfortune High-Fidelity Vector & Local Asset Library
// Guarantees 100% resilient rendering without broken image icons or missing asset boxes.

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ------------------------------------------------------------ Vector Asset Generators

const SVG_ASSETS: Record<string, string> = {
  // Avatars & Characters
  avatar: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f1f2e"/>
          <stop offset="100%" stop-color="#0b0b12"/>
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="16" fill="url(#bg)"/>
      <rect x="2" y="2" width="116" height="116" rx="14" fill="none" stroke="url(#glow)" stroke-width="2" opacity="0.6"/>
      <circle cx="60" cy="45" r="22" fill="#262638" stroke="url(#glow)" stroke-width="2"/>
      <path d="M 30 100 C 30 72, 90 72, 90 100 Z" fill="url(#glow)" opacity="0.8"/>
      <!-- Crown emblem -->
      <path d="M 50 32 L 54 42 L 60 35 L 66 42 L 70 32 L 68 46 L 52 46 Z" fill="url(#gold)"/>
    </svg>
  `),

  // City Skyline Backdrop
  skyline: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f0926"/>
          <stop offset="60%" stop-color="#1a0b36"/>
          <stop offset="100%" stop-color="#0b0b12"/>
        </linearGradient>
        <linearGradient id="bldg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2d1b4e"/>
          <stop offset="100%" stop-color="#120c24"/>
        </linearGradient>
        <linearGradient id="bldg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="cyan-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <rect width="800" height="240" fill="url(#sky)"/>
      <!-- Stars -->
      <circle cx="100" cy="30" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="250" cy="50" r="1.5" fill="#a78bfa" opacity="0.9"/>
      <circle cx="450" cy="20" r="1" fill="#fff" opacity="0.7"/>
      <circle cx="680" cy="40" r="1.2" fill="#06b6d4" opacity="0.9"/>
      <!-- Background Skyscrapers -->
      <rect x="40" y="80" width="60" height="160" fill="url(#bldg1)"/>
      <rect x="120" y="50" width="80" height="190" fill="url(#bldg2)"/>
      <rect x="220" y="100" width="50" height="140" fill="url(#bldg1)"/>
      <rect x="290" y="40" width="90" height="200" fill="url(#bldg2)"/>
      <rect x="400" y="90" width="70" height="150" fill="url(#bldg1)"/>
      <rect x="490" y="30" width="100" height="210" fill="url(#bldg2)"/>
      <rect x="610" y="70" width="75" height="170" fill="url(#bldg1)"/>
      <rect x="700" y="110" width="60" height="130" fill="url(#bldg2)"/>
      <!-- Neon Spire & Windows -->
      <line x1="335" y1="10" x2="335" y2="40" stroke="#06b6d4" stroke-width="3"/>
      <circle cx="335" cy="10" r="3" fill="#06b6d4"/>
      <line x1="540" y1="5" x2="540" y2="30" stroke="#a78bfa" stroke-width="3"/>
      <circle cx="540" cy="5" r="3" fill="#a78bfa"/>
      <!-- Window Grids -->
      <g fill="#facc15" opacity="0.75">
        <rect x="135" y="70" width="10" height="6" rx="1"/>
        <rect x="155" y="70" width="10" height="6" rx="1"/>
        <rect x="135" y="90" width="10" height="6" rx="1"/>
        <rect x="175" y="90" width="10" height="6" rx="1"/>
        <rect x="310" y="60" width="12" height="8" rx="1" fill="#06b6d4"/>
        <rect x="340" y="60" width="12" height="8" rx="1" fill="#a78bfa"/>
        <rect x="310" y="80" width="12" height="8" rx="1" fill="#a78bfa"/>
        <rect x="340" y="100" width="12" height="8" rx="1" fill="#06b6d4"/>
        <rect x="510" y="50" width="14" height="8" rx="1"/>
        <rect x="540" y="50" width="14" height="8" rx="1"/>
        <rect x="510" y="75" width="14" height="8" rx="1" fill="#06b6d4"/>
        <rect x="550" y="100" width="14" height="8" rx="1"/>
      </g>
      <!-- Bottom Ambient Fade -->
      <rect y="180" width="800" height="60" fill="url(#sky)" opacity="0.6"/>
    </svg>
  `),

  // Business Buildings
  lemon: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 40 70 L 100 35 L 160 70 Z" fill="#facc15"/>
      <rect x="50" y="70" width="100" height="70" fill="#1f1f2e" stroke="#facc15" stroke-width="2"/>
      <circle cx="100" cy="95" r="18" fill="#fef08a"/>
      <text x="100" y="101" font-family="sans-serif" font-weight="bold" font-size="20" fill="#854d0e" text-anchor="middle">🍋</text>
    </svg>
  `),

  cafe: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="35" y="45" width="130" height="95" rx="6" fill="#1f1f2e" stroke="#a78bfa" stroke-width="2"/>
      <path d="M 30 45 L 170 45 L 160 65 L 40 65 Z" fill="#8b5cf6"/>
      <rect x="75" y="80" width="50" height="60" fill="#3b82f6" opacity="0.6"/>
      <text x="100" y="35" font-family="sans-serif" font-weight="bold" font-size="14" fill="#a78bfa" text-anchor="middle">☕ CAFÉ</text>
    </svg>
  `),

  retail: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="30" y="40" width="140" height="100" rx="8" fill="#1f1f2e" stroke="#3b82f6" stroke-width="2"/>
      <rect x="45" y="60" width="110" height="50" rx="4" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/>
      <text x="100" y="90" font-family="sans-serif" font-weight="bold" font-size="16" fill="#93c5fd" text-anchor="middle">🛍️ BOUTIQUE</text>
    </svg>
  `),

  supermarket: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="25" y="40" width="150" height="100" rx="6" fill="#1f1f2e" stroke="#22c55e" stroke-width="2"/>
      <rect x="35" y="25" width="130" height="20" rx="4" fill="#15803d"/>
      <text x="100" y="40" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff" text-anchor="middle">SUPERMARKET</text>
      <text x="100" y="95" font-family="sans-serif" font-size="32" text-anchor="middle">🛒</text>
    </svg>
  `),

  office: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="55" y="25" width="90" height="120" rx="4" fill="#1f1f2e" stroke="#8b5cf6" stroke-width="2"/>
      <g fill="#06b6d4" opacity="0.8">
        <rect x="65" y="35" width="20" height="14" rx="2"/>
        <rect x="90" y="35" width="20" height="14" rx="2"/>
        <rect x="115" y="35" width="20" height="14" rx="2"/>
        <rect x="65" y="55" width="20" height="14" rx="2"/>
        <rect x="90" y="55" width="20" height="14" rx="2"/>
        <rect x="115" y="55" width="20" height="14" rx="2"/>
        <rect x="65" y="75" width="20" height="14" rx="2"/>
        <rect x="90" y="75" width="20" height="14" rx="2"/>
        <rect x="115" y="75" width="20" height="14" rx="2"/>
      </g>
    </svg>
  `),

  factory: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 30 130 L 30 70 L 65 90 L 65 70 L 100 90 L 100 70 L 135 90 L 135 130 Z" fill="#1f1f2e" stroke="#f97316" stroke-width="2"/>
      <rect x="145" y="40" width="20" height="90" fill="#334155" stroke="#f97316" stroke-width="1.5"/>
      <circle cx="155" cy="25" r="10" fill="#94a3b8" opacity="0.4"/>
      <circle cx="165" cy="15" r="14" fill="#94a3b8" opacity="0.2"/>
    </svg>
  `),

  warehouse: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 25 65 L 100 35 L 175 65 L 175 135 L 25 135 Z" fill="#1f1f2e" stroke="#06b6d4" stroke-width="2"/>
      <rect x="75" y="80" width="50" height="55" fill="#0284c7"/>
      <text x="100" y="115" font-family="sans-serif" font-size="24" text-anchor="middle">📦</text>
    </svg>
  `),

  refinery: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <rect x="40" y="45" width="40" height="90" rx="20" fill="#1f1f2e" stroke="#eab308" stroke-width="2"/>
      <rect x="95" y="35" width="40" height="100" rx="20" fill="#1f1f2e" stroke="#eab308" stroke-width="2"/>
      <line x1="80" y1="70" x2="95" y2="70" stroke="#facc15" stroke-width="4"/>
      <text x="115" y="90" font-family="sans-serif" font-size="24" text-anchor="middle">⚡</text>
    </svg>
  `),

  mine: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 20 140 Q 100 40 180 140 Z" fill="#1e1b4b" stroke="#a78bfa" stroke-width="2"/>
      <path d="M 75 140 C 75 100, 125 100, 125 140 Z" fill="#0b0b12"/>
      <text x="100" y="90" font-family="sans-serif" font-size="28" text-anchor="middle">💎</text>
    </svg>
  `),

  farm: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
      <rect width="200" height="160" rx="12" fill="#151522"/>
      <path d="M 40 80 L 100 45 L 160 80 L 160 135 L 40 135 Z" fill="#1f1f2e" stroke="#22c55e" stroke-width="2"/>
      <rect x="80" y="85" width="40" height="50" fill="#166534"/>
      <text x="100" y="70" font-family="sans-serif" font-size="26" text-anchor="middle">🌾</text>
    </svg>
  `),

  // Real Estate Properties
  house: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <path d="M 80 130 L 200 50 L 320 130 Z" fill="#1f1f2e" stroke="#a78bfa" stroke-width="3"/>
      <rect x="100" y="130" width="200" height="90" fill="#1f1f2e" stroke="#a78bfa" stroke-width="2"/>
      <rect x="175" y="160" width="50" height="60" fill="#8b5cf6"/>
      <circle cx="215" cy="190" r="3" fill="#facc15"/>
      <rect x="120" y="150" width="35" height="35" rx="4" fill="#38bdf8" opacity="0.8"/>
      <rect x="245" y="150" width="35" height="35" rx="4" fill="#38bdf8" opacity="0.8"/>
    </svg>
  `),

  apartment: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="120" y="30" width="160" height="190" rx="8" fill="#1f1f2e" stroke="#3b82f6" stroke-width="3"/>
      <g fill="#60a5fa" opacity="0.85">
        <rect x="140" y="50" width="30" height="25" rx="3"/>
        <rect x="185" y="50" width="30" height="25" rx="3"/>
        <rect x="230" y="50" width="30" height="25" rx="3"/>
        <rect x="140" y="90" width="30" height="25" rx="3"/>
        <rect x="185" y="90" width="30" height="25" rx="3"/>
        <rect x="230" y="90" width="30" height="25" rx="3"/>
        <rect x="140" y="130" width="30" height="25" rx="3"/>
        <rect x="185" y="130" width="30" height="25" rx="3"/>
        <rect x="230" y="130" width="30" height="25" rx="3"/>
      </g>
    </svg>
  `),

  commercial: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="90" y="40" width="220" height="170" rx="10" fill="#1f1f2e" stroke="#06b6d4" stroke-width="3"/>
      <rect x="110" y="60" width="180" height="110" rx="6" fill="#0891b2" opacity="0.4"/>
      <text x="200" y="125" font-family="sans-serif" font-weight="bold" font-size="20" fill="#cffafe" text-anchor="middle">COMMERCIAL PLAZA</text>
    </svg>
  `),

  mall: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="60" y="60" width="280" height="140" rx="12" fill="#1f1f2e" stroke="#ec4899" stroke-width="3"/>
      <path d="M 60 90 L 200 40 L 340 90 Z" fill="#be185d" opacity="0.6"/>
      <text x="200" y="140" font-family="sans-serif" font-weight="bold" font-size="22" fill="#fbcfe8" text-anchor="middle">SHOPPING MALL</text>
    </svg>
  `),

  hotel: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" rx="16" fill="#151522"/>
      <rect x="110" y="25" width="180" height="195" rx="10" fill="#1f1f2e" stroke="#facc15" stroke-width="3"/>
      <text x="200" y="65" font-family="sans-serif" font-weight="bold" font-size="18" fill="#fef08a" text-anchor="middle">GRAND HOTEL</text>
      <text x="200" y="140" font-family="sans-serif" font-size="48" text-anchor="middle">🏨</text>
    </svg>
  `),

  // Achievements Ranks
  bronze: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#78350f" stroke="#b45309" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fef08a"/>
    </svg>
  `),

  silver: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#334155" stroke="#94a3b8" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#f8fafc"/>
    </svg>
  `),

  gold: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#713f12" stroke="#facc15" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fef08a"/>
    </svg>
  `),

  master: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#581c87" stroke="#a78bfa" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#e9d5ff"/>
    </svg>
  `),

  elite: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="42" fill="#831843" stroke="#f472b6" stroke-width="4"/>
      <polygon points="50,22 57,38 74,38 60,49 65,66 50,55 35,66 40,49 26,38 43,38" fill="#fce7f3"/>
    </svg>
  `),

  // Collectibles
  car: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🏎️</text>
    </svg>
  `),

  watch: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">⌚</text>
    </svg>
  `),

  art: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🖼️</text>
    </svg>
  `),

  diamond: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">💎</text>
    </svg>
  `),

  goldbars: encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140">
      <rect width="200" height="140" rx="12" fill="#151522"/>
      <text x="100" y="85" font-family="sans-serif" font-size="54" text-anchor="middle">🪙</text>
    </svg>
  `),
};

// ------------------------------------------------------------ Local PNG File Paths

const LOCAL_ART_MAP: Record<string, string> = {
  car: "/assets/aistudio/file_000000002ac48246976a6431e00dba05_6e171ce7.png",
  watch: "/assets/aistudio/file_0000000041f48246b5da8b69d26a1b63_29c44a09.png",
  art: "/assets/aistudio/file_00000000b628824698b8fdbdb82e878d_a12dd038.png",
  diamond: "/assets/aistudio/file_000000001ccc82469b04d9f9243507e3_35141442.png",
  goldbars: "/assets/aistudio/file_000000009874824685d1bea8dfb105ee_fc40623f.png",
  jet: "/assets/aistudio/file_00000000ab0482468fdd77da7ddc513c_5401a87a.png",
  yacht: "/assets/aistudio/file_00000000db8482468f31df135f15804a_43eabf95.png",
  house: "/assets/aistudio/file_000000004afc82469e0b67e49b5950fd_e71386b3.png",
  office: "/assets/aistudio/file_000000005eac824697477ed3c842d657_304e6144.png",
};

export function art(name: string): string {
  // Always preference valid local PNG path if available, or fallback to SVG Data URI
  if (LOCAL_ART_MAP[name]) {
    return LOCAL_ART_MAP[name];
  }
  if (SVG_ASSETS[name]) {
    return SVG_ASSETS[name];
  }
  return SVG_ASSETS.house || SVG_ASSETS.office;
}

export function svgFallback(name: string): string {
  return SVG_ASSETS[name] || SVG_ASSETS.house || SVG_ASSETS.office;
}

import { getAssetForBusiness, getAssetForProperty } from "@/game/buildingAssets";
import { getBuildingSpriteSync } from "@/lib/buildingCatalogue";

export function companyImage(id: string): string {
  const asset = getAssetForBusiness(id);
  const sprite = getBuildingSpriteSync(asset.id);
  return sprite.spriteUrl;
}

export function propertyImage(category: string, name?: string): string {
  const asset = getAssetForProperty(category, name);
  const sprite = getBuildingSpriteSync(asset.id);
  return sprite.spriteUrl;
}

export function rankArt(tier: string): string {
  return art(
    (
      {
        Beginner: "bronze",
        Intermediate: "silver",
        Advanced: "gold",
        Expert: "master",
        Master: "elite",
      } as Record<string, string>
    )[tier] ?? "bronze",
  );
}

export interface PlayerTierInfo {
  tier: number;
  sublevel: number;
  tierName: string;
  romanSublevel: "I" | "II" | "III";
  badgePath: string;
}

/**
 * Maps player level to the extracted 10 tier badges (3 sublevels each: I, II, III).
 * Uses exact specifications from tier_badge_image_sheets:
 * - Tier 1 Stone: 1-2 (I), 3-5 (II), 6-9 (III)
 * - Tier 2 Bronze: 10-13 (I), 14-17 (II), 18-22 (III)
 * - Tier 3 Iron: 23-28 (I), 29-34 (II), 35-40 (III)
 * - Tier 4 Silver: 41-45 (I), 46-50 (II), 51-55 (III)
 * - Tiers 5-10: 5 levels per sublevel progression up to 100+
 */
export function getPlayerTier(level: number): PlayerTierInfo {
  const lvl = Math.max(1, level);

  // Tier 1: Stone
  if (lvl <= 2)
    return {
      tier: 1,
      sublevel: 1,
      tierName: "Stone",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_1_1.png",
    };
  if (lvl <= 5)
    return {
      tier: 1,
      sublevel: 2,
      tierName: "Stone",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_1_2.png",
    };
  if (lvl <= 9)
    return {
      tier: 1,
      sublevel: 3,
      tierName: "Stone",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_1_3.png",
    };

  // Tier 2: Bronze
  if (lvl <= 13)
    return {
      tier: 2,
      sublevel: 1,
      tierName: "Bronze",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_2_1.png",
    };
  if (lvl <= 17)
    return {
      tier: 2,
      sublevel: 2,
      tierName: "Bronze",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_2_2.png",
    };
  if (lvl <= 22)
    return {
      tier: 2,
      sublevel: 3,
      tierName: "Bronze",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_2_3.png",
    };

  // Tier 3: Iron
  if (lvl <= 28)
    return {
      tier: 3,
      sublevel: 1,
      tierName: "Iron",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_3_1.png",
    };
  if (lvl <= 34)
    return {
      tier: 3,
      sublevel: 2,
      tierName: "Iron",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_3_2.png",
    };
  if (lvl <= 40)
    return {
      tier: 3,
      sublevel: 3,
      tierName: "Iron",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_3_3.png",
    };

  // Tier 4: Silver (+5 per sublevel)
  if (lvl <= 45)
    return {
      tier: 4,
      sublevel: 1,
      tierName: "Silver",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_4_1.png",
    };
  if (lvl <= 50)
    return {
      tier: 4,
      sublevel: 2,
      tierName: "Silver",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_4_2.png",
    };
  if (lvl <= 55)
    return {
      tier: 4,
      sublevel: 3,
      tierName: "Silver",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_4_3.png",
    };

  // Tier 5: Gold / Tier 5
  if (lvl <= 60)
    return {
      tier: 5,
      sublevel: 1,
      tierName: "Tier 5",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_5_1.png",
    };
  if (lvl <= 65)
    return {
      tier: 5,
      sublevel: 2,
      tierName: "Tier 5",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_5_2.png",
    };
  if (lvl <= 70)
    return {
      tier: 5,
      sublevel: 3,
      tierName: "Tier 5",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_5_3.png",
    };

  // Tier 6: Platinum / Tier 6
  if (lvl <= 75)
    return {
      tier: 6,
      sublevel: 1,
      tierName: "Tier 6",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_6_1.png",
    };
  if (lvl <= 80)
    return {
      tier: 6,
      sublevel: 2,
      tierName: "Tier 6",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_6_2.png",
    };
  if (lvl <= 85)
    return {
      tier: 6,
      sublevel: 3,
      tierName: "Tier 6",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_6_3.png",
    };

  // Tier 7: Diamond / Tier 7
  if (lvl <= 90)
    return {
      tier: 7,
      sublevel: 1,
      tierName: "Tier 7",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_7_1.png",
    };
  if (lvl <= 95)
    return {
      tier: 7,
      sublevel: 2,
      tierName: "Tier 7",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_7_2.png",
    };
  if (lvl <= 100)
    return {
      tier: 7,
      sublevel: 3,
      tierName: "Tier 7",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_7_3.png",
    };

  // Tier 8: Master / Tier 8
  if (lvl <= 105)
    return {
      tier: 8,
      sublevel: 1,
      tierName: "Tier 8",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_8_1.png",
    };
  if (lvl <= 110)
    return {
      tier: 8,
      sublevel: 2,
      tierName: "Tier 8",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_8_2.png",
    };
  if (lvl <= 115)
    return {
      tier: 8,
      sublevel: 3,
      tierName: "Tier 8",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_8_3.png",
    };

  // Tier 9: Grandmaster / Tier 9
  if (lvl <= 120)
    return {
      tier: 9,
      sublevel: 1,
      tierName: "Tier 9",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_9_1.png",
    };
  if (lvl <= 125)
    return {
      tier: 9,
      sublevel: 2,
      tierName: "Tier 9",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_9_2.png",
    };
  if (lvl <= 130)
    return {
      tier: 9,
      sublevel: 3,
      tierName: "Tier 9",
      romanSublevel: "III",
      badgePath: "/assets/game/tiers/tier_9_3.png",
    };

  // Tier 10: Apex / Tier 10
  if (lvl <= 140)
    return {
      tier: 10,
      sublevel: 1,
      tierName: "Apex",
      romanSublevel: "I",
      badgePath: "/assets/game/tiers/tier_10_1.png",
    };
  if (lvl <= 150)
    return {
      tier: 10,
      sublevel: 2,
      tierName: "Apex",
      romanSublevel: "II",
      badgePath: "/assets/game/tiers/tier_10_2.png",
    };
  return {
    tier: 10,
    sublevel: 3,
    tierName: "Apex",
    romanSublevel: "III",
    badgePath: "/assets/game/tiers/tier_10_3.png",
  };
}
