# Capital Fortune — Focused UI Redesign & Texture Implementation Handoff

**Scope of this implementation:** Canva-referenced in-game UI, responsive layout and existing texture presentation only. This is not an instruction to change gameplay, economic rules, multiplayer architecture, authentication, player saves, backend or APK updater.

## 1. Source references reviewed

- **Capital Fortune UI System** — Canva design `DAHadPi0Lo4`, 21 pages. Use portrait/mobile-specific layouts only; desktop examples are explicitly out of scope.
- **Capital Fortune UI Spec** — Canva design `DAHadbzVcD8`, 18 pages. Primary layout reference for portrait-only 9:16 interfaces.
- **Capital Fortune casino UI prototype** — Canva design `DAHadoF5ZRE`, one page. Casino-specific concept reference.
- **Conversation history source:** `Capital_Fortune_Chat_History_Compilation.docx`, sections “Whole-game mobile UI redesign” and “Casino Core redesign”, plus the stated UI/theme/texture constraints.

## 2. Hard design constraints

- Mobile devices only; portrait orientation only. No desktop integration or desktop-responsive layouts.
- Target handset widths: 320–430 CSS px. Canva specification references 640–900 px viewport heights and safe-area awareness.
- Preserve Capital Fortune's existing theme, textures and fonts. No wholesale reskin, asset replacement, colour replacement or font replacement without explicit instruction.
- Existing gameplay logic, values, rules, server authority, action handlers and player-save schemas must remain unchanged.
- All interactions remain touch-first. Use 44 px minimum tap targets (prefer 48 px where practical), thumb-reachable primary actions, and safe-area insets.
- Keep high-information views compact but legible. Reduce oversized and scattered lists; avoid cramped or illogical placement.
- Use progressive disclosure: expose key decisions first and secondary details only when requested.
- Limit horizontal scrolling. Use contained vertical scroll regions; sticky actions/navigation only where they improve access.

## 3. Canva visual system reference

The mobile UI specification records:
- Dark charcoal and navy base surfaces.
- Violet for interactive/focus states.
- Gold for value and important confirmation.
- Emerald for positive gains.
- Restrained red for loss, warning and destructive actions.
- Typography: Sora for display headings; Manrope for body text; existing JetBrains Mono/tabular numeral treatment for numeric values where already used.
- 8-point spacing rhythm.
- Subtle depth and restrained borders/glows rather than visual clutter.
- Bottom navigation with a small, consistent set of primary destinations; obvious back navigation; safe-area-aware sticky actions.
- Fixed-width desktop dialogs become full-screen mobile sheets.

Note: the separate Canva UI System deck contains desktop/tablet examples. Do NOT implement those breakpoints. The portrait-only specification and the user's explicit constraint take priority over generic responsive examples in that deck.

## 4. Required UI areas

Prioritize a consistent mobile layout pass across:
- Home / Clicker
- Empire / Businesses
- Real Estate
- Banking HUB and Banking Views
- Markets
- Collectibles
- Corporations / shared views (do not activate currently-disabled gameplay features)
- Casino HUB and individual game scenes
- Research & Development
- Achievements
- Statistics
- Profile / account manager / settings
- Global navigation, modal/dialog/sheet patterns, loading/empty/error states

The whole-game pass is not complete until each applicable screen has been reviewed. Existing reported work on Banking HUB, Markets dialogs, Leaderboards scroll and Casino motion is historical; inspect current code before treating it as a completed implementation.

## 5. Banking HUB requirements from the user's approved direction

- Full-screen Banking HUB with a short secure-connection/loading sequence.
- After connection, exactly three initial choices:
  1. My Banking Apps
  2. View Banking Service Offers
  3. End Connection
- Bank-specific sections (Overview, Payments, Services, Loans, Activity, etc.) appear only after entering a selected institution.
- Preserve existing bank rules, registration actions, account state and financial calculations.
- The current source already has an initial three-choice HUB, but inner BankingView includes a desktop-oriented 190px sidebar and horizontal/desktop breakpoint behavior. Audit for mobile-only navigation and compact vertical presentation without changing behavior.

## 6. Casino presentation direction

The user requested individual game scenes, not generic panels:
- Roulette
- Blackjack
- Mines
- Keno
- Hi-Lo

The documented visual direction is emerald casino felt with dark walnut and brass accents, controlled cinematic lighting, and distinct composition per game. However, preserve the current Capital Fortune theme and keep the casino design consistent with existing in-game typography and UI primitives. Do not overwrite game logic or server-authoritative actions.

Previously reported motion concepts include:
- Roulette wheel and ball
- Blackjack card dealing
- Mines reveal
- Keno number draw
- Hi-Lo card flips
- Result feedback and reduced-motion behavior

Verify existing CSS/React motion before adding or replacing animations. Use CSS/native React transitions rather than assuming Canva video generation.

## 7. Existing texture inventory and preservation rules

Verified assets in `public/assets/game/textures/`:
- `01_business_facilities_texture_sheet.png` — 1152×1536, RGB, 2 columns × 5 rows, ten labelled business/industrial facility graphics.
- `02_real_estate_properties_texture_sheet.png` — 1536×1024, RGBA, five real-estate property graphics in a 3-card top row and 2-card bottom row.
- `README.txt` and `manifest.json` document the precise card positions.

Source-sheet rules:
- Preserve the two PNG source/master files unchanged.
- Do not resize, recolour, re-encode or overwrite the masters.
- For individual in-game cards, crop using visible card boundaries and exclude neighbouring cards.
- Keep correct source-specific layouts; do not assume a shared uniform grid.
- Preserve original proportions; never stretch artwork.
- Preserve alpha on the RGBA property sheet.
- The RGB business facilities sheet includes its original dark checkerboard background; it is not a tileable world texture.
- These sheets are presentation graphics for business/property selection and display UI, not world/environment tile textures.
- Before any crop or new derived file is written, prepare an exact source/destination plan and obtain the separate write authorization required by Game Development Studio.

## 8. Current repository findings (verified on inspected branch)

Repository: `LukKashh/CapitalMega`
Branch: `remix/supabase-android-independent`
Snapshot commit at start of this scope: `860214cb7f6f7859228eb6c1a745d57ec29be3e5`

Key files:
- `src/styles.css` — global palette, fonts, game panel/button/nav styles and extensive animations.
- `src/components/game/AppShell.tsx` — global shell and bottom navigation. Source includes five-slot bottom navigation, More sheet, banking entry and responsive max-width layout; inspect and constrain to phone portrait only.
- `src/components/game/BankingHub.tsx` — secure connection and three-action Banking HUB.
- `src/components/game/BankingView.tsx` — bank institution/account workspace; has desktop sidebar/grid breakpoints requiring mobile-first review.
- `src/components/game/CasinoHub.tsx` — casino lobby shell.
- `src/components/game/CasinoTable.tsx` — five individual game scenes and table switching; existing classes prefixed `cf-casino-`.
- `src/routes/_authenticated/home.tsx` — clicker home layout and interactive tap frame; do not alter tap handlers or economics.
- `src/routes/_authenticated/empire.tsx`
- `src/routes/_authenticated/realestate.tsx`
- `src/routes/_authenticated/corporation.tsx` — currently shows Corporations temporarily offline in this branch; retain its feature status.
- `src/routes/_authenticated/collectibles.tsx`
- `src/routes/_authenticated/leaderboard.tsx`
- `src/routes/_authenticated/research.tsx`
- `src/routes/_authenticated/achievements.tsx`
- `src/routes/_authenticated/stats.tsx`
- `src/components/game/ui.tsx` — shared PageHeader, Card, Stat, scroll containers, segmented controls, progress, dialogs and other primitives.
- `src/components/game/art.ts` — vector fallback art and asset path helpers.
- `public/assets/game/textures/` — source texture sheets and metadata.
- `public/assets/game/buildings/`, `catalogue/`, `realestate/`, `tiers/` — existing runtime visual assets.
- `public/assets/aistudio/` — imported project references and source assets.

Potential layout problems from static source review:
- `src/components/game/AppShell.tsx` has `max-w-2xl` container constraints and menu-sheet proportions; validate on 320px widths and safe-area insets.
- Some route source uses `sm:grid-cols-2`, `md:grid-cols-*`, or `xl:grid-cols-*`; ensure the target mobile UI never depends on a desktop/tablet layout for core navigation or controls.
- BankingView contains a 190px desktop sidebar and desktop-specific grids.
- Current root CSS palette is already close to the requested dark/violet/gold/emerald style; preserve it rather than replace with unrelated colours.
- Existing source texture README explicitly forbids stretching source artwork and distinguishes texture sheets from tileable environment textures.

## 9. Game Development Studio execution boundary

The Game Development Studio skills were read. The local `game-dev` CLI was checked in this environment and is **not installed / not on PATH**. Network access from the local container was unavailable, so a clone of the repository could not be made in the local workspace. No local adapter inspection, CLI doctor, renderer capture, image package build, or visual test was performed.

Do not install the CLI or substitute an external provider without the user's explicit instruction. No Tripo/Leonardo generation, paid asset jobs, Blender normalization, package creation, adapter installation, project vendoring or runtime execution was attempted.

For any actual asset production or project write:
1. Inspect source bytes and exact destinations.
2. Prepare the asset/layout change plan and validation policy.
3. Obtain explicit authorization for the exact writes/commands.
4. Preserve source hashes and licenses; verify produced package before use.
5. Distinguish code/static review, CI, screenshot/capture, GPU evidence and human visual review.

## 10. Implementation status and acceptance checklist

No source code, UI, texture or asset files were changed during this investigation. Canva designs were inspected read-only. The current CI status of commit `860214cb7f6f7859228eb6c1a745d57ec29be3e5` remains separately tracked in Cognee as historical pass from run `42796421732`.

Acceptance for the next authorized UI implementation:
- [ ] Only portrait phone layouts are implemented.
- [ ] 320px / 360px / 390px / 430px viewport widths show no horizontal overflow.
- [ ] Safe-area top/bottom and fixed navigation/actions are not obscuring content.
- [ ] Touch targets meet the 44px minimum; key actions preferably 48px.
- [ ] Long lists use filters, compact rows/cards, pagination or contained scroll where suitable.
- [ ] Primary actions and key financial context are visible early.
- [ ] Secondary detail is progressively disclosed.
- [ ] Existing theme, fonts and source textures remain intact.
- [ ] No game rules, action payloads, balances, save schema or backend code changed.
- [ ] Existing casino rules/actions remain unchanged; each game still uses its actual playable logic.
- [ ] Loading, empty and error states have clear next actions.
- [ ] Reduced-motion preferences are respected for decorative transitions.
- [ ] Lint, unit tests and production build pass.
- [ ] Visual inspection / device testing is reported separately from CI.
- [ ] Any generated/cropped texture has provenance, license and source hash recorded.

## 11. Next safe step

First obtain the Game Development Studio CLI in the user's local development environment, or connect a supported project workspace where it is already installed. Then inspect relevant UI assets and existing render adapters. Start with a read-only audit and a narrow mobile layout slice (Banking HUB / shell) before proceeding screen-by-screen. Preserve existing textures and game behavior.
