import { describe, expect, it } from "vitest";
import {
  BUILDING_ASSET_CATALOGUE,
  BUILDING_ASSET_BY_ID,
  BUSINESS_ASSETS,
  REAL_ESTATE_ASSETS,
  getAssetForBusiness,
  getAssetForProperty,
} from "./buildingAssets";
import { getBuildingCatalogueReport } from "@/lib/buildingCatalogue";

describe("Building Asset Catalogue", () => {
  it("registers exactly 15 assets", () => {
    expect(BUILDING_ASSET_CATALOGUE.length).toBe(15);
    expect(Object.keys(BUILDING_ASSET_BY_ID).length).toBe(15);
  });

  it("follows the exact classification rules for Business and Real Estate", () => {
    expect(BUSINESS_ASSETS.length).toBe(10);
    expect(REAL_ESTATE_ASSETS.length).toBe(5);

    // BLD-001 through BLD-010: Business
    for (let i = 1; i <= 10; i++) {
      const id = `BLD-${String(i).padStart(3, "0")}`;
      const asset = BUILDING_ASSET_BY_ID[id];
      expect(asset).toBeDefined();
      expect(asset.category).toBe("Business");
    }

    // BLD-011 through BLD-015: Real Estate
    for (let i = 11; i <= 15; i++) {
      const id = `BLD-${String(i).padStart(3, "0")}`;
      const asset = BUILDING_ASSET_BY_ID[id];
      expect(asset).toBeDefined();
      expect(asset.category).toBe("Real Estate");
    }
  });

  it("registers Office Building twice with distinct IDs in Business and Real Estate", () => {
    const bizOffice = BUILDING_ASSET_BY_ID["BLD-005"];
    const realOffice = BUILDING_ASSET_BY_ID["BLD-013"];

    expect(bizOffice.name).toBe("Office Building");
    expect(bizOffice.category).toBe("Business");
    expect(bizOffice.sourceUrl).toBe("https://i.ibb.co/DHWw0qsz/05-office-building.png");

    expect(realOffice.name).toBe("Office Building");
    expect(realOffice.category).toBe("Real Estate");
    expect(realOffice.sourceUrl).toBe("https://i.ibb.co/ffNHSBQ/13-office-building.png");

    expect(bizOffice.id).not.toBe(realOffice.id);
    expect(bizOffice.sourceUrl).not.toBe(realOffice.sourceUrl);
  });

  it("ensures all registered image URLs are direct ImgBB URLs", () => {
    for (const asset of BUILDING_ASSET_CATALOGUE) {
      expect(asset.sourceUrl).toMatch(
        /^https:\/\/i\.ibb\.co\/[a-zA-Z0-9_-]+\/[0-9a-zA-Z_-]+\.png$/,
      );
      expect(asset.localFallback).toBeTruthy();
    }
  });

  it("correctly maps businesses to the 10 business assets", () => {
    expect(getAssetForBusiness("lemon").id).toBe("BLD-001");
    expect(getAssetForBusiness("cafe").id).toBe("BLD-002");
    expect(getAssetForBusiness("retail").id).toBe("BLD-003");
    expect(getAssetForBusiness("supermarket").id).toBe("BLD-004");
    expect(getAssetForBusiness("studio").id).toBe("BLD-005");
    expect(getAssetForBusiness("factory").id).toBe("BLD-006");
    expect(getAssetForBusiness("warehouse").id).toBe("BLD-007");
    expect(getAssetForBusiness("refinery").id).toBe("BLD-008");
    expect(getAssetForBusiness("mine").id).toBe("BLD-009");
    expect(getAssetForBusiness("farm").id).toBe("BLD-010");
  });

  it("correctly maps real estate properties to the 5 real estate assets", () => {
    expect(getAssetForProperty("Residential", "Maple Townhouse").id).toBe("BLD-011");
    expect(getAssetForProperty("Residential", "Harbor View Condo").id).toBe("BLD-012");
    expect(getAssetForProperty("Commercial", "Glasshouse Offices").id).toBe("BLD-013");
    expect(getAssetForProperty("Commercial", "Northgate Mall").id).toBe("BLD-014");
    expect(getAssetForProperty("Hospitality", "Grand City Hotel").id).toBe("BLD-015");
  });

  it("validates sprite dimensions and bounding boxes", () => {
    for (const asset of BUILDING_ASSET_CATALOGUE) {
      expect(asset.originalDimensions.width).toBe(512);
      expect(asset.originalDimensions.height).toBe(512);
      expect(asset.trimmedDimensions.width).toBeGreaterThan(0);
      expect(asset.trimmedDimensions.height).toBeGreaterThan(0);
      expect(asset.trimmedDimensions.width).toBeLessThanOrEqual(512);
      expect(asset.trimmedDimensions.height).toBeLessThanOrEqual(512);
      expect(asset.hasNativeTransparency).toBe(true);
    }
  });

  it("produces a comprehensive catalogue report", () => {
    const report = getBuildingCatalogueReport();
    expect(report.totalAssets).toBe(15);
    expect(report.businessCount).toBe(10);
    expect(report.realEstateCount).toBe(5);
    expect(report.assets.length).toBe(15);
  });
});
