# Capital Fortune — Repository Instructions

## Project identity

- This repository contains the **Capital Fortune** application associated with the Google AI Studio Build project.
- The application is a React/TypeScript web app using TanStack Start and Vite.
- Do not describe the project as a Lovable-originated app. Some Lovable-named compatibility packages and integration files remain from earlier project tooling; their presence alone does not establish the current source platform.
- Do not remove or replace those compatibility files until all imports, runtime paths, and deployment dependencies have been traced.

## Architecture map

- `src/game/`: game domain types, rules, economy, simulation, progression, markets, corporations, banking, casino, and related tests.
- `src/routes/`: TanStack Start file-based routes. `src/routeTree.gen.ts` is generated; never edit it manually.
- `src/components/game/`: game-specific screens and presentation components.
- `src/components/ui/`: reusable UI primitives.
- `src/lib/`: application services, game actions, Firebase setup, formatting, and shared utilities.
- `src/context/` and `src/hooks/`: UI context and React hooks.
- `src/integrations/`: provider-specific integration code. Inspect actual call sites before changing providers.
- `public/assets/`: runtime-served game art, textures, and other static assets.
- `docs/`: implementation specifications and repository documentation.
- `drizzle/`: retained migration and metadata artifacts. Do not assume these define the active player-save path without tracing their use.
- `.aistudio/artifacts/`: AI Studio-generated planning and supporting artifacts; not application runtime source.

## Data and security rules

- The current game action path in `src/lib/game.functions.ts` uses Firebase Authentication and Cloud Firestore. Trace the full action and transaction flow before changing persistence or authorization.
- Firebase initialization is in `src/lib/firebase.ts`; the project configuration is read from `firebase-applet-config.json`.
- Treat `firestore.rules` and `firebase-blueprint.json` as security-sensitive project configuration. Update and test rules when changing the shape or access pattern of Firestore data.
- Supabase integration files are present. Do not assume they are the primary game-state store, and do not introduce a competing persistence system without an explicit architecture decision.
- Never put service-role credentials, private signing keys, or other secrets in browser code or committed files.
- Do not weaken authorization to make a feature appear functional.

## Game implementation rules

- Keep game calculations and domain rules in `src/game/`; UI components should present state and dispatch actions rather than independently inventing economic outcomes.
- Preserve existing save compatibility. Add safe defaults or migrations when persisted state changes.
- Reuse existing types, configuration, action paths, and UI conventions before introducing new abstractions.
- Do not invent mechanics, balance values, catalogue items, fees, rates, probabilities, or progression requirements that have not been specified.
- Add regression tests for changes to game rules, banking, markets, casino outcomes, assets, and persistence behavior where applicable.

## Generated files and assets

- Do not manually edit `src/routeTree.gen.ts`.
- Respect generated-file headers in integration code and migration metadata.
- Keep source artwork and runtime assets in their established locations. Update manifests or asset mappings when adding or replacing assets.
- Do not commit temporary exports, local build output, dependency folders, or private environment files.

## Validation

Use the repository's Bun lockfile and scripts:

```bash
bun install --frozen-lockfile
bun run test
bun run lint
bun run build
```

Do not change package managers or regenerate the lockfile without a specific dependency-management reason.

## Google AI Studio synchronization

The repository is linked to a Google AI Studio Build project. Avoid making conflicting edits to the same files in AI Studio and GitHub before synchronizing. Review diffs and resolve conflicts deliberately. Keep the default branch in a working state.
