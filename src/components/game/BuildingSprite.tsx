import React, { useState } from "react";
import {
  getAssetForBusiness,
  getAssetForProperty,
  BUILDING_ASSET_BY_ID,
  type BuildingAssetDef,
} from "@/game/buildingAssets";
import { useBuildingSprite } from "@/lib/buildingCatalogue";
import { svgFallback } from "./art";
import { cn } from "@/lib/utils";

export interface BuildingSpriteProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Explicit Asset ID (e.g., "BLD-001" to "BLD-015") */
  assetId?: string;
  /** Business Definition ID (e.g., "lemon", "cafe", "studio") */
  businessDefId?: string;
  /** Property Category (e.g., "Residential", "Commercial", "Hospitality") */
  propertyCategory?: string;
  /** Property Name (e.g., "Northgate Mall", "Glasshouse Offices") */
  propertyName?: string;
  /** Scaling mode: "cover" (fills container), "contain" (fits inside), or "fill" */
  fit?: "contain" | "cover" | "fill";
  /** Fallback key for vector SVG */
  fallbackKey?: string;
  /** Whether to show a discreet asset ID badge (e.g., BLD-001) */
  showAssetBadge?: boolean;
}

/**
 * BuildingSprite renders an ImgBB-hosted, automatically processed,
 * transparent backgroundless building asset from the centralized catalogue.
 */
export function BuildingSprite({
  assetId,
  businessDefId,
  propertyCategory,
  propertyName,
  fit = "cover",
  fallbackKey = "office",
  showAssetBadge = false,
  className,
  alt,
  ...props
}: BuildingSpriteProps) {
  // Determine target BuildingAssetDef
  let asset: BuildingAssetDef;
  if (assetId && BUILDING_ASSET_BY_ID[assetId]) {
    asset = BUILDING_ASSET_BY_ID[assetId];
  } else if (businessDefId) {
    asset = getAssetForBusiness(businessDefId);
  } else if (propertyCategory || propertyName) {
    asset = getAssetForProperty(propertyCategory || "", propertyName);
  } else {
    asset = BUILDING_ASSET_BY_ID["BLD-001"];
  }

  const sprite = useBuildingSprite(asset.id);
  const [hasError, setHasError] = useState(false);

  const imgSrc = hasError ? svgFallback(fallbackKey) : sprite.spriteUrl;

  const fitClass =
    fit === "contain"
      ? "object-contain"
      : fit === "cover"
        ? "object-cover scale-110"
        : "object-fill";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center overflow-hidden", className)}
    >
      <img
        src={imgSrc}
        alt={alt || asset.name}
        className={cn("h-full w-full transition-all duration-200", fitClass)}
        onError={() => setHasError(true)}
        loading="lazy"
        {...props}
      />
      {showAssetBadge && (
        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 font-mono text-[9px] font-bold text-white/90 backdrop-blur-xs border border-white/20">
          {asset.id}
        </span>
      )}
    </div>
  );
}
