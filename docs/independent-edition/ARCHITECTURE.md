# Capital Fortune Independent Edition

## Objective

Create an independently deployable Capital Fortune variation that preserves the existing game rules and supplied art while removing Firebase, Google AI Studio runtime services, Lovable Cloud, and all inherited hosting/auth dependencies.

The target is one responsive React/TypeScript web application packaged for Android with Capacitor. Supabase is the sole hosted backend.

## Verified source baseline

- Existing UI: React 19, TypeScript, TanStack Start, Vite.
- Game domain: `src/game/` (economy, simulation, banking, casino, corporations, markets, collectibles, achievements, progression).
- Screens: `src/routes/_authenticated/`.
- Current persistence is Firebase Auth + Firestore through `src/lib/game.functions.ts`; game action simulation currently executes in the browser.
- The existing Supabase integration is compatibility code and not the active game-save provider.
- The supplied ZIP includes source assets and four nested art ZIP bundles.
- Preserve source game rules and tests. Do not invent balance values or unprovided tier names/ranges.

## Target architecture

1. **Client**: React/Vite web app, installable PWA, Capacitor Android shell.
2. **Identity**: Supabase Auth (email/password initially; OAuth only after provider configuration).
3. **Trusted game command service**: Supabase Edge Functions. Authenticate each request with the caller's Supabase JWT, validate action shape, load authoritative state, run game rules, and commit all state/ledger/stock/corporation projections atomically.
4. **Persistence**: PostgreSQL. Full player save remains private; only deliberate public leaderboard projections are readable to other users.
5. **Assets**: static public game artwork bundled with the web client; player-uploaded content, if required, uses private Supabase Storage buckets with RLS.
6. **Realtime**: optional for corporation notifications/market updates; never authoritative for financial mutations.

## Backend foundation deployed

Supabase project: `aeslycmjhhqtdyfqnpmi` (existing empty project selected for the independent game backend; region `eu-central-1`).

The initial schema migration creates:
- `profiles`
- `player_states`
- `public_players`
- `corporations`
- `corporation_members`
- `public_corporations`
- `game_ledger`
- `action_receipts`
- `collectible_stock`
- `market_state`
- `player_events`

RLS is enabled for every exposed application table. Client write policies are intentionally absent for game state, financial ledger, corporation state/membership, stock, market state, receipts, public projections, and events. Trusted Edge Functions use server-side credentials. Never ship a service-role/secret key in the browser or APK.

A follow-up migration adds the founder foreign-key index.

## Required command semantics

- All money-changing and progression-changing actions are server-authoritative.
- Use a database transaction for state, ledger, stock, corporation, and public projection writes.
- Use optimistic version checks and bounded idempotency receipts to handle retries/concurrent requests.
- Derive the player identity from the verified JWT, never from a client-supplied user ID.
- Casino randomness and any signing secret remain server-side. Remove the current client-visible fallback secret.
- Ledger entries are append-only and readable only by their owner.
- Limited collectible supply is decremented atomically; no client may write stock counters.
- Validate corporation membership/rank permissions at the command boundary.
- Public ranking views expose only the intended projection fields.

## Migration work remaining

1. Port the orchestration in `src/lib/game.functions.ts` to a trusted Edge Function, retaining the pure game domain modules and adding Deno-compatible shared code.
2. Replace Firebase client calls with a typed Supabase service adapter.
3. Replace Firebase Auth UI and route guards with Supabase Auth.
4. Remove Firebase config, Firebase dependencies, Lovable/preview auth and telemetry dependencies only after all call sites are removed.
5. Add tests for RLS isolation, action replay, concurrent writes, stock limits, ledger immutability, casino outcomes, corporation permissions, and save compatibility.
6. Add Capacitor Android configuration and verify signed/debug APK builds on Android tooling.
7. Configure Storage buckets and access policies only for actual upload requirements.
8. Run build, lint, unit, integration and security-advisor checks before release.

## Android delivery

The same web build is wrapped using Capacitor. Keep the application logic and UI shared. Native Android capabilities should be added only when required (safe-area handling, status/navigation bars, app icon/splash, back-button behavior, secure session persistence). A successful web build is not proof of an APK; Android SDK/Gradle builds and emulator/device tests are required.
