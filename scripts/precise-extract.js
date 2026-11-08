import sharp from "sharp";
import path from "path";
import fs from "fs";

const TEXTURES_DIR = "public/assets/game/textures";
const BUILDINGS_DIR = "public/assets/game/buildings";
const REALESTATE_DIR = "public/assets/game/realestate";

fs.mkdirSync(BUILDINGS_DIR, { recursive: true });
fs.mkdirSync(REALESTATE_DIR, { recursive: true });

async function preciseExtract() {
  console.log("Starting precise border-aware asset extraction...");

  // 1. Business Facilities Sheet (1152 x 1536)
  // 2 columns x 5 rows. Each cell is ~576 width x 307 height.
  // Within each cell, let's extract with a slight inset (e.g. 12px padding) to capture the card's outer border cleanly,
  // then resize/contain to target 400x380.
  const busSheet = path.join(TEXTURES_DIR, "01_business_facilities_texture_sheet.png");
  if (fs.existsSync(busSheet)) {
    const colW = 576;
    const rowH = 307;

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
      const left = b.col * colW + 10;
      const top = b.row * rowH + 10;
      const width = colW - 20;
      const height = (b.row === 4 ? 308 : rowH) - 20;

      await sharp(busSheet)
        .extract({ left, top, width, height })
        .resize(400, 380, { fit: "contain", background: { r: 15, g: 15, b: 22, alpha: 1 } })
        .toFile(path.join(BUILDINGS_DIR, b.name));
      console.log(`Precise extracted building: ${b.name}`);
    }
  }

  // 2. Real Estate Properties Sheet (1536 x 1024)
  // Top row: 3 cards (each 512 x 512)
  // Bottom row: 2 cards (each 768 x 512)
  const reSheet = path.join(TEXTURES_DIR, "02_real_estate_properties_texture_sheet.png");
  if (fs.existsSync(reSheet)) {
    const topProps = [
      { name: "house.png", index: 0 },
      { name: "apartment.png", index: 1 },
      { name: "commercial.png", index: 2 },
    ];

    for (const p of topProps) {
      const left = p.index * 512 + 12;
      const top = 12;
      const width = 512 - 24;
      const height = 512 - 24;

      await sharp(reSheet)
        .extract({ left, top, width, height })
        .resize(500, 360, { fit: "contain", background: { r: 15, g: 15, b: 22, alpha: 1 } })
        .toFile(path.join(REALESTATE_DIR, p.name));
      console.log(`Precise extracted real estate (top): ${p.name}`);
    }

    const bottomProps = [
      { name: "mall.png", index: 0 },
      { name: "hotel.png", index: 1 },
    ];

    for (const p of bottomProps) {
      const left = p.index * 768 + 12;
      const top = 512 + 12;
      const width = 768 - 24;
      const height = 512 - 24;

      await sharp(reSheet)
        .extract({ left, top, width, height })
        .resize(500, 360, { fit: "contain", background: { r: 15, g: 15, b: 22, alpha: 1 } })
        .toFile(path.join(REALESTATE_DIR, p.name));
      console.log(`Precise extracted real estate (bottom): ${p.name}`);
    }
  }

  console.log("Precise asset extraction complete!");
}

preciseExtract().catch((err) => {
  console.error("Precise extraction failed:", err);
  process.exit(1);
});
