TIER BADGE IMAGE SHEETS
=======================

Contents
--------
This archive contains all 10 supplied badge image sheets as original PNG files.
The images have been preserved without resizing, cropping, recolouring, or
re-encoding. They use RGBA colour with transparency.

Each sheet contains three badge variants arranged horizontally:
  - Left:   Sublevel I
  - Middle: Sublevel II
  - Right:  Sublevel III

Implementation / use specifications
-----------------------------------
1. Treat each PNG as a three-frame horizontal sprite sheet.
2. Select the required sublevel by using the left, middle, or right frame.
   For a simple atlas implementation, divide the image width into three
   equal horizontal regions:
     I   = x: 0 to 1/3 of image width
     II  = x: 1/3 to 2/3 of image width
     III = x: 2/3 to full image width
   Use the image's full height. Keep the source aspect ratio.
3. Preserve the PNG alpha channel. Do not add a background; the supplied
   transparent background is intended to let the badge sit on the game's UI.
4. Scale proportionally. Avoid stretching. Use a consistent displayed
   badge height/width across tiers, allowing the original artwork's
   transparent margins to remain intact.
5. Use the Roman numeral artwork as the visual sublevel indicator. The
   game logic should determine which tier and sublevel is displayed.
6. Keep the source PNGs as master assets. If optimized runtime variants are
   needed, generate them from these originals rather than modifying them.

Confirmed tier progression supplied
------------------------------------
Tier 1 — Stone
  Sublevel I:   Levels 1–2
  Sublevel II:  Levels 3–5
  Sublevel III: Levels 6–9

Tier 2 — Bronze
  Sublevel I:   Levels 10–13
  Sublevel II:  Levels 14–17
  Sublevel III: Levels 18–22

Tier 3 — Iron
  Sublevel I:   Levels 23–28
  Sublevel II:  Levels 29–34
  Sublevel III: Levels 35–40

Tier 4 — Silver
  The supplied note says: "Extra 5 Levels per for all 3".
  The exact resulting level ranges are not specified, so no ranges have
  been inferred in this package.

Tier 5–10
  The remaining six image sheets are included, but their tier names and
  level ranges were not supplied. They are therefore labelled
  "unassigned" rather than given invented names.

Asset file mapping
------------------
01_stone_tier.png       — Stone (Tier 1)
02_bronze_tier.png      — Bronze (Tier 2)
03_iron_tier.png        — Iron (Tier 3)
04_silver_tier.png      — Silver (Tier 4)
05_unassigned_tier.png  — Tier 5 artwork; name/ranges pending
06_unassigned_tier.png  — Tier 6 artwork; name/ranges pending
07_unassigned_tier.png  — Tier 7 artwork; name/ranges pending
08_unassigned_tier.png  — Tier 8 artwork; name/ranges pending
09_unassigned_tier.png  — Tier 9 artwork; name/ranges pending
10_unassigned_tier.png  — Tier 10 artwork; name/ranges pending

Source image dimensions
-----------------------
01_stone_tier.png       941 x 288 px
02_bronze_tier.png      939 x 263 px
03_iron_tier.png        941 x 255 px
04_silver_tier.png      941 x 243 px
05_unassigned_tier.png  941 x 240 px
06_unassigned_tier.png  941 x 267 px
07_unassigned_tier.png  1086 x 307 px
08_unassigned_tier.png  1086 x 308 px
09_unassigned_tier.png  1086 x 331 px
10_unassigned_tier.png  1086 x 380 px

Note
----
The tier names and progression beyond Iron, plus Silver's exact level
allocation, should be confirmed before configuring the game's progression
logic. The art files themselves are complete and included.
