/**
 * CAPITAL FORTUNE — ONLINE BUILDING ASSET CATALOGUE
 *
 * Centralized registry for all ImgBB-hosted building assets.
 * Stores asset definitions, categories, direct URLs, and game mapping rules.
 * Expandable to accommodate future building artwork.
 */

export type BuildingCategory = "Business" | "Real Estate";

export type AssetLoadingStatus = "idle" | "loading" | "processing" | "ready" | "error";

export interface BuildingAssetDef {
  /** Unique Asset ID (e.g. BLD-001) */
  id: string;
  /** Asset display name */
  name: string;
  /** Category: exactly "Business" or "Real Estate" */
  category: BuildingCategory;
  /** Direct ImgBB public image URL */
  sourceUrl: string;
  /** Local pre-processed fallback sprite for 100% offline resilience */
  localFallback: string;
  /** Pre-calculated trimmed bounding box dimensions */
  originalDimensions: { width: number; height: number };
  trimmedDimensions: { width: number; height: number };
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  hasNativeTransparency: boolean;
}

/**
 * The 15 registered building assets with direct ImgBB URLs.
 * BLD-001 through BLD-010: Business
 * BLD-011 through BLD-015: Real Estate
 * Note: Office Building exists twice intentionally (BLD-005 Business, BLD-013 Real Estate)
 */
export const BUILDING_ASSET_CATALOGUE: readonly BuildingAssetDef[] = [
  // ------------------------------------------------------------- Business Assets
  {
    id: "BLD-001",
    name: "Lemonade Stand",
    category: "Business",
    sourceUrl: "https://i.ibb.co/Wv8Vh6Sf/01-lemonade-stand.png",
    localFallback: "/assets/game/catalogue/bld-001.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 282 },
    boundingBox: { minX: 18, minY: 115, maxX: 493, maxY: 396 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-002",
    name: "Cafe",
    category: "Business",
    sourceUrl: "https://i.ibb.co/xt3LsrSx/02-cafe.png",
    localFallback: "/assets/game/catalogue/bld-002.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 277 },
    boundingBox: { minX: 18, minY: 117, maxX: 493, maxY: 393 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-003",
    name: "Retail Shop",
    category: "Business",
    sourceUrl: "https://i.ibb.co/NdMDxwLQ/03-retail-shop.png",
    localFallback: "/assets/game/catalogue/bld-003.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 271 },
    boundingBox: { minX: 18, minY: 120, maxX: 493, maxY: 390 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-004",
    name: "Supermarket",
    category: "Business",
    sourceUrl: "https://i.ibb.co/MKtjndc/04-supermarket.png",
    localFallback: "/assets/game/catalogue/bld-004.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 266 },
    boundingBox: { minX: 18, minY: 123, maxX: 493, maxY: 388 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-005",
    name: "Office Building",
    category: "Business",
    sourceUrl: "https://i.ibb.co/DHWw0qsz/05-office-building.png",
    localFallback: "/assets/game/catalogue/bld-005.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 258 },
    boundingBox: { minX: 18, minY: 127, maxX: 493, maxY: 384 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-006",
    name: "Factory",
    category: "Business",
    sourceUrl: "https://i.ibb.co/JFbzsHcr/06-factory.png",
    localFallback: "/assets/game/catalogue/bld-006.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 253 },
    boundingBox: { minX: 18, minY: 129, maxX: 493, maxY: 381 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-007",
    name: "Warehouse",
    category: "Business",
    sourceUrl: "https://i.ibb.co/d0bBs5VY/07-warehouse.png",
    localFallback: "/assets/game/catalogue/bld-007.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 256 },
    boundingBox: { minX: 18, minY: 128, maxX: 493, maxY: 383 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-008",
    name: "Refinery",
    category: "Business",
    sourceUrl: "https://i.ibb.co/MkMr9VMd/08-refinery.png",
    localFallback: "/assets/game/catalogue/bld-008.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 251 },
    boundingBox: { minX: 18, minY: 130, maxX: 493, maxY: 380 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-009",
    name: "Mine",
    category: "Business",
    sourceUrl: "https://i.ibb.co/RkQ1JG5R/09-mine.png",
    localFallback: "/assets/game/catalogue/bld-009.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 280 },
    boundingBox: { minX: 18, minY: 116, maxX: 493, maxY: 395 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-010",
    name: "Farm",
    category: "Business",
    sourceUrl: "https://i.ibb.co/Hf2C0Qgs/10-farm.png",
    localFallback: "/assets/game/catalogue/bld-010.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 275 },
    boundingBox: { minX: 18, minY: 118, maxX: 493, maxY: 392 },
    hasNativeTransparency: true,
  },

  // ------------------------------------------------------------- Real Estate Assets
  {
    id: "BLD-011",
    name: "Residential",
    category: "Real Estate",
    sourceUrl: "https://i.ibb.co/zT3qrFNY/11-residential.png",
    localFallback: "/assets/game/catalogue/bld-011.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 467, height: 476 },
    boundingBox: { minX: 22, minY: 18, maxX: 488, maxY: 493 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-012",
    name: "Apartment",
    category: "Real Estate",
    sourceUrl: "https://i.ibb.co/yBsYLt8P/12-apartment.png",
    localFallback: "/assets/game/catalogue/bld-012.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 465, height: 476 },
    boundingBox: { minX: 23, minY: 18, maxX: 487, maxY: 493 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-013",
    name: "Office Building",
    category: "Real Estate",
    sourceUrl: "https://i.ibb.co/ffNHSBQ/13-office-building.png",
    localFallback: "/assets/game/catalogue/bld-013.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 468, height: 476 },
    boundingBox: { minX: 22, minY: 18, maxX: 489, maxY: 493 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-014",
    name: "Shopping Mall",
    category: "Real Estate",
    sourceUrl: "https://i.ibb.co/qGbW7Jb/14-shopping-mall.png",
    localFallback: "/assets/game/catalogue/bld-014.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 437 },
    boundingBox: { minX: 18, minY: 37, maxX: 493, maxY: 473 },
    hasNativeTransparency: true,
  },
  {
    id: "BLD-015",
    name: "Hotel",
    category: "Real Estate",
    sourceUrl: "https://i.ibb.co/RTrHhWYT/15-hotel.png",
    localFallback: "/assets/game/catalogue/bld-015.png",
    originalDimensions: { width: 512, height: 512 },
    trimmedDimensions: { width: 476, height: 434 },
    boundingBox: { minX: 18, minY: 39, maxX: 493, maxY: 472 },
    hasNativeTransparency: true,
  },
] as const;

export const BUILDING_ASSET_BY_ID = Object.fromEntries(
  BUILDING_ASSET_CATALOGUE.map((a) => [a.id, a]),
) as Record<string, BuildingAssetDef>;

export const BUSINESS_ASSETS = BUILDING_ASSET_CATALOGUE.filter((a) => a.category === "Business");
export const REAL_ESTATE_ASSETS = BUILDING_ASSET_CATALOGUE.filter(
  (a) => a.category === "Real Estate",
);

/**
 * Maps a business definition ID or key to its corresponding Building Asset.
 */
export function getAssetForBusiness(defId: string): BuildingAssetDef {
  const normalized = (defId || "").toLowerCase();

  switch (normalized) {
    case "lemon":
      return BUILDING_ASSET_BY_ID["BLD-001"]; // Lemonade Stand
    case "cafe":
    case "foodtruck":
      return BUILDING_ASSET_BY_ID["BLD-002"]; // Cafe
    case "bakery":
    case "retail":
      return BUILDING_ASSET_BY_ID["BLD-003"]; // Retail Shop
    case "supermarket":
    case "vending":
      return BUILDING_ASSET_BY_ID["BLD-004"]; // Supermarket
    case "studio":
    case "gym":
    case "clinic":
    case "arena":
      return BUILDING_ASSET_BY_ID["BLD-005"]; // Office Building (Business)
    case "factory":
    case "aero":
      return BUILDING_ASSET_BY_ID["BLD-006"]; // Factory
    case "warehouse":
    case "logistics":
    case "carwash":
      return BUILDING_ASSET_BY_ID["BLD-007"]; // Warehouse
    case "refinery":
      return BUILDING_ASSET_BY_ID["BLD-008"]; // Refinery
    case "mine":
      return BUILDING_ASSET_BY_ID["BLD-009"]; // Mine
    case "farm":
      return BUILDING_ASSET_BY_ID["BLD-010"]; // Farm
    default:
      return BUILDING_ASSET_BY_ID["BLD-005"]; // Default Business Office
  }
}

/**
 * Maps a property category or ID/name to its corresponding Real Estate Asset.
 */
export function getAssetForProperty(category: string, name?: string): BuildingAssetDef {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // Hospitality: Hotel, Resort, Motel, Hostel, B&B
  if (
    cat.includes("hospitality") ||
    n.includes("hotel") ||
    n.includes("resort") ||
    n.includes("motel") ||
    n.includes("hostel") ||
    n.includes("b&b") ||
    n.includes("cabin")
  ) {
    return BUILDING_ASSET_BY_ID["BLD-015"]; // Hotel
  }

  // Shopping Mall / Retail plaza / Kiosk
  if (
    n.includes("mall") ||
    n.includes("plaza") ||
    n.includes("shop") ||
    n.includes("store") ||
    n.includes("kiosk") ||
    n.includes("retail") ||
    n.includes("market")
  ) {
    return BUILDING_ASSET_BY_ID["BLD-014"]; // Shopping Mall
  }

  // Office Building: Commercial offices, Towers, Tech parks, Medical suites, Labs
  if (
    n.includes("office") ||
    n.includes("tower") ||
    n.includes("skyline") ||
    n.includes("glasshouse") ||
    n.includes("suites") ||
    n.includes("lab") ||
    cat.includes("commercial")
  ) {
    return BUILDING_ASSET_BY_ID["BLD-013"]; // Office Building (Real Estate)
  }

  // Apartment: Multi-family, condos, lofts, apartments, duplexes
  if (
    n.includes("apartment") ||
    n.includes("condo") ||
    n.includes("loft") ||
    n.includes("block") ||
    n.includes("duplex") ||
    n.includes("micro") ||
    n.includes("penthouse") ||
    n.includes("marina")
  ) {
    return BUILDING_ASSET_BY_ID["BLD-012"]; // Apartment
  }

  // Residential: Houses, flats, townhomes, bungalows, estates, villas
  if (
    cat.includes("residential") ||
    cat.includes("luxury") ||
    n.includes("residential") ||
    n.includes("house") ||
    n.includes("townhouse") ||
    n.includes("bungalow") ||
    n.includes("villa") ||
    n.includes("estate") ||
    n.includes("flat") ||
    n.includes("home") ||
    n.includes("room") ||
    n.includes("isle")
  ) {
    return BUILDING_ASSET_BY_ID["BLD-011"]; // Residential
  }

  // Industrial fallback to Office / Mall
  if (cat.includes("industrial")) {
    return BUILDING_ASSET_BY_ID["BLD-013"];
  }

  return BUILDING_ASSET_BY_ID["BLD-011"]; // Default Residential
}
