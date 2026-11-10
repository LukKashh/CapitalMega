# Capital Fortune — Workstation Knowledge Log

**Purpose:** Cross-chat continuity record for the Capital Fortune development workstation only. This is project documentation, not a game feature and not a player-data store.

> **Verification labels:** VERIFIED LIVE = inspected on the GitHub branch at the recorded commit; CI VERIFIED = confirmed by a CI run; DEVICE VERIFIED = tested on an Android device/emulator; USER CONFIRMED = explicitly confirmed by the user; HISTORICAL = prior record, not revalidated against the current state; UNVERIFIED / NOT RUN = evidence is not available.

## 1. Current workstation snapshot

- **Last verified:** 2026-11-10
- **Verification scope:** GitHub repository tree and selected source/configuration files on the branch below. A remote GitHub tree does not expose a local workstation's uncommitted changes.
- **Repository:** [LukKashh/CapitalMega](https://github.com/LukKashh/CapitalMega)
- **Active development branch for the current updater work:** `remix/supabase-android-independent`
- **Branch head:** `24a223239035f0d3e8b46c8c9a0ef6fe32294d04`
- **Commit:** “Document native APK download and verification flow”
- **Branch tree:** 353 entries; GitHub reports `truncated: false`.
- **Knowledge log status:** This file is being added on the approved branch. No production backend, database, release, or signing configuration is changed by this documentation commit.

## 2. Repository and branch rules

- Keep work on `remix/supabase-android-independent` unless the user explicitly approves another branch.
- Do not treat `main` as interchangeable with this branch. Inspect both independently before any branch migration or architecture claim.
- The repository is linked to a Google AI Studio Build project. Avoid conflicting simultaneous edits in AI Studio and GitHub; inspect diffs and synchronize deliberately.
- The remote repository snapshot does not reveal local uncommitted changes, local secrets, or the user's current editor/workstation state.
- Branch protection is currently reported as disabled by the GitHub branch endpoint. Do not infer a required review gate from this setting.

## 3. Production directory and file layout

This is a purpose-oriented map of the verified branch tree, not a complete listing of all 353 entries.

### Root

| Path | Responsibility |
|---|---|
| `README.md` | Project overview, setup, scripts, architecture summary and contribution rules |
| `AGENTS.md` | Instructions for coding agents and contributors |
| `package.json`, `bun.lock` | Dependencies and scripts; package-manager metadata needs reconciliation (see risks) |
| `vite.config.ts`, `tsconfig.json`, `vitest.config.ts` | Build, TypeScript and test configuration |
| `capacitor.config.ts` | Capacitor Android app identity and web asset directory |
| `metadata.json` | Google AI Studio project metadata |
| `firebase-applet-config.json`, `firebase-blueprint.json` | Firebase app configuration and data-model reference |
| `firestore.rules`, `security_spec.md` | Firestore access policy and security invariants |
| `roadmap.md` | Project roadmap |
| `CAPITAL_FORTUNE_COMPLETE_ASSET_INVENTORY.md` | Asset inventory |
| `.env.example` | Names of environment variables for retained Supabase integration; no secret values belong here |
| `.env.production` | Exists in repository tree; inspect carefully before use and never copy secret values into this log |
| `.aistudio/artifacts/` | AI Studio-generated plans, reference images and supporting artifacts; not runtime source |
| `.github/workflows/` | GitHub Actions verification workflows |
| `docs/` | Repository, architecture, rollout and feature documentation |
| `drizzle/`, `drizzle.config.ts` | Retained database/migration artifacts; not proof of active game persistence |
| `native/android/` | Native Android updater Java and FileProvider XML sources injected into generated Capacitor project |
| `public/` | Static runtime assets and public update manifest |
| `scripts/` | Asset-processing, distribution preparation and Android updater integration scripts |
| `src/` | Main React/TypeScript application |
| `supabase/` | Edge Functions and SQL migrations retained in this branch |

### Application source: `src/`

| Path | Responsibility |
|---|---|
| `src/routes/` | TanStack Start file-based routes and screens |
| `src/components/game/` | Capital Fortune game UI |
| `src/components/ui/` | Reusable UI primitives |
| `src/game/` | Game domain types, calculations, rules, simulation and tests |
| `src/lib/` | Application services, game action flow, provider setup and shared utilities |
| `src/integrations/` | Provider integrations and compatibility modules; trace actual call sites before changing |
| `src/hooks/` | Reusable React hooks |
| `src/context/` | React context providers |
| `src/test/` | Application-level tests and setup |
| `src/router.tsx`, `src/routeTree.gen.ts` | Router configuration and generated route tree; do not edit generated route tree manually |
| `src/server.ts`, `src/start.ts` | Server and application startup entry points |
| `src/styles.css` | Global styles |

### Static assets: `public/`

- `public/assets/game/`: runtime game art, buildings, property images, catalogue assets and textures.
- `public/assets/tiers/`: tier artwork and manifest.
- `public/assets/aistudio/`: imported/source asset exports associated with AI Studio.
- `public/update-manifest.json`: public client update metadata.

### Backend source

- `supabase/functions/game-session/`: authenticated session bootstrap function source.
- `supabase/functions/game-action/`: authenticated game action function source and game-domain modules (banking, casino, collectibles, market, engine, RNG, types and achievements).
- `supabase/migrations/`: SQL migration files for atomic game actions and collectible stock locking.
- Firebase configuration and Firestore rules also remain at the repository root and are described in README/AGENTS. The active provider path must be confirmed from actual runtime imports and deployed environment; file presence alone is not proof.

## 4. Application architecture and provider status

### Verified repository facts

- The branch is a React 19 / TypeScript application using TanStack Start, Vite, Tailwind and Radix-based UI components.
- Capacitor Android configuration exists. App ID: `com.capitalfortune.game`; app name: `Capitalfortune`; web assets directory: `dist`.
- README and AGENTS describe Firebase Authentication and Cloud Firestore as the current application/game persistence path and describe Supabase modules as retained integration/compatibility code.
- Supabase Edge Function source files and migrations are also present. The Android updater rollout document describes a Supabase Auth / `game-session` / `game-action` startup path.
- **Architecture reconciliation required:** repository documentation and source artifacts describe more than one provider architecture. Do not assume the old Supabase-only handover or the README's Firebase description is universally authoritative. Before changing authentication, player saves or game actions, trace current imports and runtime call sites, check deployment configuration, and identify which environment the user's tested build is connected to.
- The architecture baseline document explicitly says its detailed Firebase analysis is scoped to the implementation observed on `main`; treat it as guidance/evidence, not automatic proof of the updater branch's deployed runtime.

### Security boundaries

- Do not put service-role credentials, private signing keys, tokens or other secrets into browser code, committed files or this knowledge log.
- Record only safe environment-variable names and configuration locations.
- Do not add a second persistence provider, migrate player saves or alter authentication without an explicit architecture decision.
- Preserve player saves. Any schema/state migration needs a backup and tested backward-compatible migration plan.
- Do not treat UI restrictions or client-side game calculations as trusted authorization.

## 5. Build, test, CI and Android packaging

### Tooling observed

- `package.json` scripts include `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test`, `test:watch`, `cap:sync` and `android:debug`.
- README/AGENTS instruct use of Bun and the checked-in `bun.lock`.
- The package metadata currently declares `packageManager: pnpm@10.26.2`, while the branch CI workflow uses Corepack/pnpm and runs `pnpm install --no-frozen-lockfile`. Resolve this discrepancy deliberately; do not regenerate lockfiles or switch package managers as incidental cleanup.
- CI uses Node 22, Java 21, Android SDK platform 35 and build-tools 35.0.0.

### GitHub Actions

- `.github/workflows/remix-verify.yml`: runs on pushes/PRs to `remix/supabase-android-independent` and manual dispatch.
  - Web job: install dependencies, ESLint autofix, lint, Vitest, production build, upload `capital-fortune-web-dist`.
  - Android job: build web assets, generate Capacitor Android project, sync Capacitor, run `scripts/prepare-android-updater.mjs`, assemble debug APK, upload `capital-fortune-android-debug-apk`.
- `.github/workflows/validate.yml`: additional validation workflow; inspect before changing CI.
- Standard local checks documented in AGENTS: `bun install --frozen-lockfile`, `bun run test`, `bun run lint`, `bun run build`.
- CI compilation is not a physical-device test.

### Android updater implementation

Verified source paths:
- `src/lib/game-update.ts` and `src/lib/game-update.test.ts`: public manifest validation and version logic.
- `src/lib/apk-updater.ts`: Capacitor bridge interface.
- `src/routes/index.tsx`: disconnected launch gateway and manual CONNECT flow.
- `native/android/app/src/main/java/com/capitalfortune/game/ApkUpdaterPlugin.java`: Android DownloadManager, checksum and installer handoff.
- `native/android/app/src/main/java/com/capitalfortune/game/ApkDownloadReceiver.java`: persistent download completion and verification handling.
- `native/android/app/src/main/res/xml/capitalfortune_file_paths.xml`: FileProvider path configuration.
- `scripts/prepare-android-updater.mjs`: injects native updater code and manifest/provider registration into the generated Android project.
- `docs/android-update-rollout.md`: lifecycle and release constraints.

Updater lifecycle documented in this branch:
1. APK launches disconnected.
2. User manually presses CONNECT.
3. Public HTTPS version manifest is checked before authentication/session.
4. If an update is required, connection is blocked.
5. Android direct download is available only when both `apkUrl` and `apkSha256` are present and valid.
6. Native downloader verifies SHA-256 before offering Android Package Installer handoff.
7. Android installation always requires user consent.
8. After update/restart, user manually presses CONNECT again.

### Outstanding Android release constraints

- Current `public/update-manifest.json` must be inspected before every release; the rollout documentation says `apkUrl` and `apkSha256` are absent and therefore direct APK download cannot activate yet.
- CI APK is debug-signed using an ephemeral runner-generated debug key; no stable production release-signing pipeline is established.
- In-place Android update requires the same signing certificate and a higher versionCode.
- No physical-device end-to-end update test is evidenced by the inspected repository documentation.
- Do not claim production-ready OTA updates until manifest metadata, stable signing and device testing are complete.

## 6. Configuration and secret locations

Safe configuration references observed:
- `firebase-applet-config.json`: imported by Firebase initialization according to README/REPOSITORY_STRUCTURE.
- `.env.example`: variable names `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`.
- CI references GitHub Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Stable Android signing should use GitHub Actions secrets for encoded keystore and passwords only after the user explicitly approves that release-signing setup.
- **Never record secret values here.** Do not assume Firebase, Supabase or signing secrets are configured merely because variable names appear in code/workflows.

## 7. User-approved product constraints and confirmed status

- The user explicitly confirmed: **“I can confirm the Game functionality.”** Status: USER CONFIRMED for game functionality as tested by the user; this does not establish updater/device installer validation.
- Preserve existing gameplay and player saves. Avoid unrelated gameplay refactors while working on workstation documentation or updater infrastructure.
- User requires a presentable downloadable APK and verification for APK build tasks; do not treat source changes or CI build alone as final delivery.
- Use free-tier services unless the user explicitly approves costs. Do not create paid Supabase branches or incur service charges without approval.
- No production database, schema, deployment or release change is authorized by this knowledge-log task.

## 8. Verification matrix

| Area | Status | Evidence / note |
|---|---|---|
| Repository branch exists | VERIFIED LIVE | GitHub branch endpoint |
| Branch head SHA | VERIFIED LIVE | `24a223239035f0d3e8b46c8c9a0ef6fe32294d04` |
| Recursive tree | VERIFIED LIVE | 353 entries, not truncated |
| Workstation log absent before this commit | VERIFIED LIVE | GitHub contents API returned 404 for target path |
| Web lint/tests/build | CI VERIFIED (historical run) | Run 42792850360, commit 24a223… |
| Android debug APK compile/artifact upload | CI VERIFIED (historical run) | Run 42792850360, artifact 13752577052 |
| Gameplay functionality | USER CONFIRMED | Explicit user confirmation |
| Physical Android install/launch | NOT RUN / not evidenced | Requires user/device validation |
| Full updater download/checksum/install cycle | NOT RUN / not evidenced | Requires published manifest APK URL/checksum and device test |
| Stable release signing | UNVERIFIED / outstanding | Ephemeral debug signing only |
| Supabase/Firebase deployed runtime reconciliation | UNVERIFIED / outstanding | Inspect call sites and environment before architecture changes |
| Local workstation uncommitted state | UNVERIFIED | GitHub connector cannot inspect user's local editor state |

## 9. Known risks, blockers and next safe actions

1. Reconcile Firebase-vs-Supabase runtime architecture before modifying auth, persistence or session flow.
2. Inspect `public/update-manifest.json` and current app version before any update-release operation.
3. Establish stable Android release signing only with explicit approval; never commit keystore material.
4. Test installation and the complete update flow on a physical Android device.
5. Resolve Bun/pnpm/lockfile workflow discrepancy without changing package manager casually.
6. Inspect current branch head and relevant CI before every development session; remembered commit IDs are not proof of current state.
7. Preserve player saves and confirmed game functionality.

**Next safe action after this documentation commit:** inspect the new commit and CI result, then continue with a narrowly scoped task chosen by the user. Do not perform production changes as part of workstation-log maintenance.

## 10. Dated development history

### 2026-11-10 — Workstation Knowledge Log established

- User approved a dedicated persistent workstation knowledge log for Capital Fortune only.
- Cognee dataset: `capital_fortune_project`.
- This document is the repository-side current snapshot and should be updated after meaningful project inspections, decisions, code changes, test/build outcomes, user confirmations and blockers.
- Branch and source layout were re-inspected from GitHub immediately before this document was created.
- Existing CI record: run `42792850360`, artifact `13752577052`.
- No production database, deployment, release or signing configuration was changed.
