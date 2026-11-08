import sharp from "sharp";
import path from "path";
import fs from "fs";

const TEXTURES_DIR = "public/assets/game/textures";
const BUILDINGS_DIR = "public/assets/game/buildings";
const REALESTATE_DIR = "public/assets/game/realestate";

fs.mkdirSync(BUILDINGS_DIR, { recursive: true });
fs.mkdirSync(REALESTATE_DIR, { recursive: true });

async function sliceTextures() {
  console.log("Slicing new business and real estate texture sheets...");

  // 1. Business Facilities Sheet (1152 x 1536, 2 cols x 5 rows)
  const businessSheet = path.join(TEXTURES_DIR, "01_business_facilities_texture_sheet.png");
  if (fs.existsSync(businessSheet)) {
    const colWidth = 576;
    const rowHeight = 307;

    const businesses = [
      { name: "lemon.png", col: 0, row: 0 },
      { name: "cafe.png", col: 1, row: 0 },
      { name: "retail.png", col: 0, row: 1 },
      { name: "supermarket.png", col: 1, row: 1 },
      { name: "office.png", col: 0, row: 2 },
      { name: "factory.png", col: 1, row: 2 },
      { name: "warehouse.png", col: 0, row: 3 },
      { name: "refinery.png", col: 1, row: 3 },
      { name: "mine.png", col: 0, row: 4 },
      { name: "farm.png", col: 1, row: 4 },
    ];

    for (const b of businesses) {
      const left = b.col * colWidth;
      const top = b.row * rowHeight;
      const height = b.row === 4 ? 308 : rowHeight;

      await sharp(businessSheet)
        .extract({ left, top, width: colWidth, height })
        .resize(400, 380, { fit: "contain", background: { r: 21, g: 21, b: 34, alpha: 1 } })
        .toFile(path.join(BUILDINGS_DIR, b.name));
      console.log(`Sliced building: ${b.name}`);
    }
  } else {
    console.warn("Business facilities sheet not found at", businessSheet);
  }

  // 2. Real Estate Properties Sheet (1536 x 1024, 3 top, 2 bottom)
  const realEstateSheet = path.join(TEXTURES_DIR, "02_real_estate_properties_texture_sheet.png");
  if (fs.existsSync(realEstateSheet)) {
    // Top row: 3 cards (width 512, height 512)
    const topProps = [
      { name: "house.png", index: 0 },
      { name: "apartment.png", index: 1 },
      { name: "commercial.png", index: 2 },
    ];

    for (const p of topProps) {
      await sharp(realEstateSheet)
        .extract({ left: p.index * 512, top: 0, width: 512, height: 512 })
        .resize(500, 360, { fit: "cover" })
        .toFile(path.join(REALESTATE_DIR, p.name));
      console.log(`Sliced real estate (top): ${p.name}`);
    }

    // Bottom row: 2 cards (width 768, height 512)
    const bottomProps = [
      { name: "mall.png", index: 0 },
      { name: "hotel.png", index: 1 },
    ];

    for (const p of bottomProps) {
      await sharp(realEstateSheet)
        .extract({ left: p.index * 768, top: 512, width: 768, height: 512 })
        .resize(500, 360, { fit: "cover" })
        .toFile(path.join(REALESTATE_DIR, p.name));
      console.log(`Sliced real estate (bottom): ${p.name}`);
    }
  } else {
    console.warn("Real estate properties sheet not found at", realEstateSheet);
  }

  console.log("Texture slicing complete!");
}

sliceTextures().catch((err) => {
  console.error("Texture slicing failed:", err);
  process.exit(1);
});
