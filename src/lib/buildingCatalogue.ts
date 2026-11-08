import { useEffect, useState } from "react";
import {
  BUILDING_ASSET_CATALOGUE,
  BUILDING_ASSET_BY_ID,
  type BuildingAssetDef,
} from "@/game/buildingAssets";

export interface ProcessedSpriteResult {
  assetId: string;
  name: string;
  category: "Business" | "Real Estate";
  sourceUrl: string;
  spriteUrl: string; // Ready-to-render transparent data URL or local fallback
  originalWidth: number;
  originalHeight: number;
  trimmedWidth: number;
  trimmedHeight: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  hasNativeTransparency: boolean;
  backgroundRemoved: boolean;
  status: "ready" | "processing" | "error";
  error?: string;
}

const CACHE_KEY_PREFIX = "CF_BUILDING_SPRITE_v2_";

// In-memory cache for instant synchronous access after first process/load
const MEMORY_CACHE = new Map<string, ProcessedSpriteResult>();

// Listeners for reactive updates
const LISTENERS = new Set<() => void>();
function notifyListeners() {
  for (const l of LISTENERS) {
    try {
      l();
    } catch {
      // ignore
    }
  }
}

/**
 * Checks persistent browser storage (localStorage) for previously processed sprite
 */
function getFromPersistentCache(assetId: string): ProcessedSpriteResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${assetId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // localStorage quota or access denied
  }
  return null;
}

/**
 * Saves processed sprite to persistent storage
 */
function saveToPersistentCache(res: ProcessedSpriteResult) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${res.assetId}`, JSON.stringify(res));
  } catch {
    // If quota exceeded, clear older keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_KEY_PREFIX) && k !== `${CACHE_KEY_PREFIX}${res.assetId}`) {
          localStorage.removeItem(k);
          break;
        }
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Automatically inspects, decodes, isolates foreground/removes background,
 * and crops transparent margins to produce a tightly fitted sprite canvas.
 */
async function processBuildingImage(asset: BuildingAssetDef): Promise<ProcessedSpriteResult> {
  // Check memory cache first
  if (MEMORY_CACHE.has(asset.id)) {
    return MEMORY_CACHE.get(asset.id)!;
  }

  // Check persistent cache
  const cached = getFromPersistentCache(asset.id);
  if (cached) {
    MEMORY_CACHE.set(asset.id, cached);
    return cached;
  }

  if (typeof window === "undefined") {
    // SSR fallback to local pre-trimmed sprite
    const ssrResult: ProcessedSpriteResult = {
      assetId: asset.id,
      name: asset.name,
      category: asset.category,
      sourceUrl: asset.sourceUrl,
      spriteUrl: asset.localFallback,
      originalWidth: asset.originalDimensions.width,
      originalHeight: asset.originalDimensions.height,
      trimmedWidth: asset.trimmedDimensions.width,
      trimmedHeight: asset.trimmedDimensions.height,
      boundingBox: asset.boundingBox,
      hasNativeTransparency: asset.hasNativeTransparency,
      backgroundRemoved: false,
      status: "ready",
    };
    MEMORY_CACHE.set(asset.id, ssrResult);
    return ssrResult;
  }

  // Step 1: Image Acquisition - Load image into an offscreen Image element
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    // Set a timeout in case ImgBB is unreachable or blocked
    const timeout = setTimeout(() => {
      // Fallback to local pre-trimmed sprite
      const fallbackResult: ProcessedSpriteResult = {
        assetId: asset.id,
        name: asset.name,
        category: asset.category,
        sourceUrl: asset.sourceUrl,
        spriteUrl: asset.localFallback,
        originalWidth: asset.originalDimensions.width,
        originalHeight: asset.originalDimensions.height,
        trimmedWidth: asset.trimmedDimensions.width,
        trimmedHeight: asset.trimmedDimensions.height,
        boundingBox: asset.boundingBox,
        hasNativeTransparency: asset.hasNativeTransparency,
        backgroundRemoved: false,
        status: "ready",
      };
      MEMORY_CACHE.set(asset.id, fallbackResult);
      resolve(fallbackResult);
    }, 6000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const w = img.naturalWidth || asset.originalDimensions.width || 512;
        const h = img.naturalHeight || asset.originalDimensions.height || 512;

        // Temporary processing environment: Offscreen canvas
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          throw new Error("Unable to create 2D canvas context");
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Step 2: Background Transparency Detection
        let transparentPixels = 0;
        let opaquePixels = 0;
        const totalPixels = w * h;

        for (let i = 3; i < data.length; i += 4) {
          if (data[i] <= 10) {
            transparentPixels++;
          } else {
            opaquePixels++;
          }
        }

        const isTransparent = transparentPixels > totalPixels * 0.05;
        let backgroundRemoved = false;

        // Step 3: Automatic Background Removal (if image does NOT have native transparent background)
        if (!isTransparent) {
          // Identify corner background color
          const cornerR = (data[0] + data[(w - 1) * 4] + data[(h - 1) * w * 4]) / 3;
          const cornerG = (data[1] + data[(w - 1) * 4 + 1] + data[(h - 1) * w * 4 + 1]) / 3;
          const cornerB = (data[2] + data[(w - 1) * 4 + 2] + data[(h - 1) * w * 4 + 2]) / 3;

          const colorDistance = (r: number, g: number, b: number) =>
            Math.sqrt((r - cornerR) ** 2 + (g - cornerG) ** 2 + (b - cornerB) ** 2);

          // Remove background matching corner tone
          for (let i = 0; i < data.length; i += 4) {
            const dist = colorDistance(data[i], data[i + 1], data[i + 2]);
            if (dist < 35) {
              data[i + 3] = 0;
            } else if (dist < 55) {
              data[i + 3] = Math.round(((dist - 35) / 20) * 255);
            }
          }
          ctx.putImageData(imgData, 0, 0);
          backgroundRemoved = true;
        }

        // Step 4: Tight Bounding Box Calculation (trimming empty transparent margins)
        let minX = w,
          maxX = 0,
          minY = h,
          maxY = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Validate results
        if (minX > maxX || minY > maxY) {
          // Fallback to pre-calculated bounding box
          minX = asset.boundingBox.minX;
          maxX = asset.boundingBox.maxX;
          minY = asset.boundingBox.minY;
          maxY = asset.boundingBox.maxY;
        }

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);

        // Step 5: Generate Final Processed Transparent Sprite
        const trimmedCanvas = document.createElement("canvas");
        trimmedCanvas.width = cropW;
        trimmedCanvas.height = cropH;
        const trimmedCtx = trimmedCanvas.getContext("2d");

        let spriteUrl = asset.localFallback;
        if (trimmedCtx) {
          trimmedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
          try {
            spriteUrl = trimmedCanvas.toDataURL("image/png");
          } catch {
            spriteUrl = asset.localFallback;
          }
        }

        const finalResult: ProcessedSpriteResult = {
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          sourceUrl: asset.sourceUrl,
          spriteUrl,
          originalWidth: w,
          originalHeight: h,
          trimmedWidth: cropW,
          trimmedHeight: cropH,
          boundingBox: { minX, minY, maxX, maxY },
          hasNativeTransparency: isTransparent,
          backgroundRemoved,
          status: "ready",
        };

        MEMORY_CACHE.set(asset.id, finalResult);
        saveToPersistentCache(finalResult);
        notifyListeners();
        resolve(finalResult);
      } catch (err: unknown) {
        clearTimeout(timeout);
        const fallbackResult: ProcessedSpriteResult = {
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          sourceUrl: asset.sourceUrl,
          spriteUrl: asset.localFallback,
          originalWidth: asset.originalDimensions.width,
          originalHeight: asset.originalDimensions.height,
          trimmedWidth: asset.trimmedDimensions.width,
          trimmedHeight: asset.trimmedDimensions.height,
          boundingBox: asset.boundingBox,
          hasNativeTransparency: asset.hasNativeTransparency,
          backgroundRemoved: false,
          status: "ready",
          error: (err as Error)?.message,
        };
        MEMORY_CACHE.set(asset.id, fallbackResult);
        resolve(fallbackResult);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // Fallback to local pre-trimmed sprite
      const fallbackResult: ProcessedSpriteResult = {
        assetId: asset.id,
        name: asset.name,
        category: asset.category,
        sourceUrl: asset.sourceUrl,
        spriteUrl: asset.localFallback,
        originalWidth: asset.originalDimensions.width,
        originalHeight: asset.originalDimensions.height,
        trimmedWidth: asset.trimmedDimensions.width,
        trimmedHeight: asset.trimmedDimensions.height,
        boundingBox: asset.boundingBox,
        hasNativeTransparency: asset.hasNativeTransparency,
        backgroundRemoved: false,
        status: "ready",
      };
      MEMORY_CACHE.set(asset.id, fallbackResult);
      resolve(fallbackResult);
    };

    img.src = asset.sourceUrl;
  });
}

/**
 * Pre-processes all 15 building assets in the background.
 * Uses idle callback or requestAnimationFrame so main gameplay is never blocked.
 */
export function initializeBuildingCatalogue() {
  if (typeof window === "undefined") return;

  const scheduleNext = (index: number) => {
    if (index >= BUILDING_ASSET_CATALOGUE.length) return;
    const asset = BUILDING_ASSET_CATALOGUE[index];

    const runWork = () => {
      processBuildingImage(asset).then(() => {
        // Process next asset sequentially with short breathe interval to keep UI at 60fps
        setTimeout(() => scheduleNext(index + 1), 50);
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(runWork, { timeout: 1000 });
    } else {
      setTimeout(runWork, 16);
    }
  };

  scheduleNext(0);
}

/**
 * Synchronous getter: returns processed sprite result if in cache,
 * or immediate pre-calculated offline fallback while asynchronous processing runs.
 */
export function getBuildingSpriteSync(assetId: string): ProcessedSpriteResult {
  const asset = BUILDING_ASSET_BY_ID[assetId] || BUILDING_ASSET_CATALOGUE[0];

  if (MEMORY_CACHE.has(asset.id)) {
    return MEMORY_CACHE.get(asset.id)!;
  }

  const cached = getFromPersistentCache(asset.id);
  if (cached) {
    MEMORY_CACHE.set(asset.id, cached);
    return cached;
  }

  // Trigger background processing
  processBuildingImage(asset);

  // Return instant local fallback sprite
  return {
    assetId: asset.id,
    name: asset.name,
    category: asset.category,
    sourceUrl: asset.sourceUrl,
    spriteUrl: asset.localFallback,
    originalWidth: asset.originalDimensions.width,
    originalHeight: asset.originalDimensions.height,
    trimmedWidth: asset.trimmedDimensions.width,
    trimmedHeight: asset.trimmedDimensions.height,
    boundingBox: asset.boundingBox,
    hasNativeTransparency: asset.hasNativeTransparency,
    backgroundRemoved: false,
    status: "processing",
  };
}

/**
 * React hook to reactively receive the processed sprite result for a given asset ID.
 */
export function useBuildingSprite(assetId: string): ProcessedSpriteResult {
  const [sprite, setSprite] = useState<ProcessedSpriteResult>(() => getBuildingSpriteSync(assetId));

  useEffect(() => {
    let mounted = true;
    const asset = BUILDING_ASSET_BY_ID[assetId] || BUILDING_ASSET_CATALOGUE[0];

    const update = () => {
      if (mounted) {
        setSprite(getBuildingSpriteSync(asset.id));
      }
    };

    LISTENERS.add(update);

    processBuildingImage(asset).then((res) => {
      if (mounted) {
        setSprite(res);
      }
    });

    return () => {
      mounted = false;
      LISTENERS.delete(update);
    };
  }, [assetId]);

  return sprite;
}

/**
 * Returns comprehensive statistics for the 15 building assets catalogue.
 */
export function getBuildingCatalogueReport() {
  const businessCount = BUILDING_ASSET_CATALOGUE.filter((a) => a.category === "Business").length;
  const realEstateCount = BUILDING_ASSET_CATALOGUE.filter(
    (a) => a.category === "Real Estate",
  ).length;

  return {
    totalAssets: BUILDING_ASSET_CATALOGUE.length,
    businessCount,
    realEstateCount,
    assets: BUILDING_ASSET_CATALOGUE.map((a) => {
      const res = getBuildingSpriteSync(a.id);
      return {
        id: a.id,
        name: a.name,
        category: a.category,
        sourceUrl: a.sourceUrl,
        originalDimensions: `${a.originalDimensions.width}x${a.originalDimensions.height}`,
        trimmedDimensions: `${res.trimmedWidth}x${res.trimmedHeight}`,
        aspectRatio: (res.trimmedWidth / res.trimmedHeight).toFixed(2),
        hasNativeTransparency: a.hasNativeTransparency,
        backgroundRemoved: res.backgroundRemoved,
        status: res.status,
      };
    }),
  };
}
