# Independent Edition — Migration Status

## Completed
- Extracted and inspected the uploaded archive (270 files, 40 directories) and identified the active runtime integrations.
- Confirmed the source project is Capital Fortune, a wealth/business tycoon game.
- Created branch `remix/supabase-android-independent` from `main`; all migration work stays off `main`.
- Selected the connected Supabase project `CapitalfortuneViz` in `eu-central-1`.
- Applied the backend foundation migrations: 11 RLS-protected application tables and the corporation founder FK index.
- Added a private, service-role-only Postgres commit primitive for player state, public player projection, ledger entries, collectible stock, corporation state and idempotent action receipts. It serializes writes on the player row and checks the expected version.
- Verified the commit primitive is executable by `service_role`, not by `authenticated`, and the Supabase security advisor reports no findings.
- Deployed the authenticated `game-session` Edge Function (JWT verification enabled). It validates the caller's Supabase Auth session and reads only that caller's player state and profile through RLS.
- Committed the Edge Function source to `supabase/functions/game-session/index.ts`.
- Added a typed frontend helper at `src/lib/supabase-game-session.ts` for invoking the authenticated session endpoint.

## Not yet completed
- The session helper is not yet wired into the route tree or game hook; the app still uses Firebase.
- `game-session` is a read/bootstrap endpoint; it does not yet execute game actions or call the atomic commit primitive.
- The original game engine (businesses, property, markets, banking, casino, collectibles, achievements and corporation rules) still needs to be ported into trusted Edge Function code.
- Supabase Auth screens, Storage buckets/policies and game seed data remain to be implemented.
- Corporation membership/public projection synchronization and collectible stock seed data remain outstanding.
- Capacitor configuration, Android project generation, Android build, emulator/device verification and release signing remain outstanding.
- No installable APK or deployable independent web release has been produced.

## Security constraints
- No service-role or secret key in frontend code, `VITE_*` variables or APK assets.
- Never trust a client-provided player ID, balance, casino result, ledger row, stock count, corporation role or permission.
- Every financial/game command must be authorized and committed on the server.
- Do not expose raw player saves or treasury details through public leaderboard projections.
