# Independent Edition — Migration Status

## Completed
- Extracted and inspected the uploaded archive and identified the game runtime and Firebase dependencies.
- Created isolated branch `remix/supabase-android-independent`; the original `main` branch remains untouched.
- Selected Supabase project `CapitalfortuneViz` in `eu-central-1`.
- Applied database foundation and atomic commit migrations. Eleven RLS-protected tables are present.
- Added a service-role-only atomic player commit RPC and a public wrapper that rejects non-service-role callers.
- Deployed authenticated Edge Functions `game-session` and `game-action` (JWT verification enabled).
- Routed the main game hook's session load, actions and click batches to `game-action`.
- Migrated landing, sign-in/sign-up, guest auth, authenticated route guard, root auth listener, and game-shell sign-out/listener from Firebase Auth to Supabase Auth.
- Removed Firebase token attachment from TanStack Start server-function middleware.
- Added GitHub Actions verification workflow for npm install, lint, unit tests and production web build.

## Outstanding — release is not verified
- Many secondary game systems and route data functions still use Firestore through `src/lib/game.functions.ts`. Corporation, market, bank, casino, leaderboard, collectible and other systems are not fully ported. The Edge Function currently rejects unsupported corporation/casino actions.
- Supabase Auth provider settings (Google OAuth and anonymous/guest auth) need to be enabled/configured in the Supabase dashboard and tested with a real account.
- The Supabase game endpoint has not yet passed an authenticated end-to-end gameplay/persistence test.
- The latest GitHub Actions run is in progress; prior verification runs were cancelled or failed. No successful production build is confirmed yet.
- No deployable independent web release has been produced.
- Capacitor setup, Android project generation, Android build, emulator/device verification and release signing remain outstanding.
- No installable APK has been produced.

## Security constraints
- No service-role or secret key in frontend code, `VITE_*` variables or APK assets.
- Never trust a client-provided player ID, balance, casino result, ledger row, stock count, corporation role or permission.
- Every financial/game command must be authorized and committed on the server.
- Do not expose raw player saves or treasury details through public leaderboard projections.
