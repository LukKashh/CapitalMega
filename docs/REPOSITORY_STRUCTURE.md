# Repository Structure

This document describes the **current** Capital Fortune repository layout. It is a map of existing code, not a proposal to move every file. Preserve import paths and AI Studio synchronization until a migration is planned and tested.

## Root-level files

| Path | Responsibility |
| --- | --- |
| `README.md` | Project overview, setup, scripts, and contribution guidance |
| `AGENTS.md` | Instructions for AI coding agents and contributors |
| `package.json` / `bun.lock` | Runtime dependencies, development scripts, and locked dependency graph |
| `vite.config.ts` / `tsconfig.json` | Build and TypeScript configuration |
| `metadata.json` | Google AI Studio app metadata |
| `firebase-applet-config.json` | Firebase app configuration consumed by the Firebase initializer |
| `firebase-blueprint.json` | Firebase data model/blueprint metadata |
| `firestore.rules` | Firestore access-control rules |
| `security_spec.md` | Security invariants and attack scenarios |
| `roadmap.md` | Current project roadmap notes |
| `CAPITAL_FORTUNE_COMPLETE_ASSET_INVENTORY.md` | Asset inventory reference |
| `.env.example` | Example environment variables for the retained Supabase integration |
| `.aistudio/artifacts/` | AI Studio-generated planning and supporting artifacts |

## Application source: `src/`

| Directory or file | Responsibility |
| --- | --- |
| `src/routes/` | TanStack Start file-based routes and route-level screens |
| `src/routeTree.gen.ts` | Generated route tree; do not edit manually |
| `src/components/game/` | Capital Fortune-specific game UI and screen components |
| `src/components/ui/` | Shared UI primitives |
| `src/game/` | Game domain types, rules, simulation, economy, banking, markets, corporations, collectibles, casino, and tests |
| `src/lib/` | Application services, game action handling, Firebase setup, formatting, and shared utilities |
| `src/integrations/` | Provider integrations, including Firebase/Supabase-related modules and retained compatibility code |
| `src/hooks/` | Reusable React hooks |
| `src/context/` | React context providers |
| `src/test/` | App-level test setup and routing tests |
| `src/server.ts` / `src/start.ts` | Server and application startup entry points |

## Static assets: `public/assets/`

- `public/assets/game/`: runtime game art, buildings, property illustrations, catalogue images, tier graphics, and texture sheets.
- `public/assets/tiers/`: tier artwork and its manifest.
- `public/assets/aistudio/`: imported source images and packaged asset exports associated with the AI Studio project.

Keep runtime-referenced assets under their established public paths. When changing an asset, inspect its references and update any relevant manifest or mapping.

## Backend and data artifacts

- Firebase Authentication, Firestore, and Storage initialization/helpers are in `src/lib/firebase.ts`.
- Game actions and persistence flow are implemented through `src/lib/game.functions.ts`.
- Firestore rules and the Firebase blueprint are maintained at the repository root.
- `drizzle/` contains migration and metadata artifacts. The current Drizzle schema file is intentionally blank; do not assume these files are the active player-state persistence implementation.
- Supabase client modules are present under `src/integrations/supabase/`. Treat them as retained integration code until their actual runtime usage is confirmed; do not silently migrate game state between providers.

## Documentation placement

Use `docs/` for new technical documentation and implementation specifications. Keep the existing root-level reference files in place for now because other tools, AI Studio context, or project workflows may refer to their current paths. A future documentation-only migration can consolidate them after references have been checked.

Suggested locations:

- `docs/architecture/` — architecture decisions and system diagrams.
- `docs/features/` — approved feature specifications.
- `docs/development/` — local setup, testing, and release procedures.
- `docs/assets/` — asset pipeline and catalogue documentation.

Do not create empty directories just to reserve space; add them when there is real content.

## Where new code belongs

1. New game rules or balance calculations: `src/game/`.
2. New game screen: `src/routes/` or a reusable screen component under `src/components/game/`.
3. Shared visual primitive: `src/components/ui/`.
4. Firebase or other provider access: use the existing integration/service layer.
5. Automated tests: alongside the relevant game module or under `src/test/`, following existing conventions.
6. New specifications: `docs/`.

Before moving or renaming existing files, search all imports, generated metadata, asset references, tests, and AI Studio synchronization assumptions. Prefer a staged migration with tests over a large one-shot restructure.
