# Independent Edition — Migration Status

## Completed
- Extracted and inspected the uploaded archive (270 files, 40 directories) and identified the active runtime integrations.
- Confirmed the source project is Capital Fortune, a wealth/business tycoon game.
- Created branch `remix/supabase-android-independent` from `main`.
- Selected the connected Supabase project `CapitalfortuneViz` in `eu-central-1`.
- Applied the backend foundation migration and a follow-up index migration.
- Enabled RLS on all 11 application tables; game-critical tables have no client write policies.
- Added a private, service-role-only Postgres commit primitive for player state, public leaderboard projection, ledger entries, collectible stock, corporation state, and idempotent action receipts. It serializes commands on the player row and checks the expected state version.
- Verified the function exists, is executable by `service_role`, is not executable by `authenticated`, and the Supabase security advisor reports no findings.

## Not yet completed
- The atomic commit primitive is database groundwork only; no Edge Function currently calls it.
- Existing frontend still imports Firebase for authentication and game persistence.
- Existing game command orchestration still runs client-side and must be ported to Edge Functions.
- Supabase Auth screens, typed persistence adapter, Storage buckets/policies and seed data remain to be implemented.
- Corporation membership/public projection synchronization and collectible stock seed data remain to be completed as part of the command migration.
- Capacitor configuration, Android build, emulator/device verification and release signing remain outstanding.
- The Android APK and a deployable web release have not been produced.

## Non-negotiable security constraints
- No service-role or secret key in frontend code, environment variables prefixed with `VITE_`, or APK assets.
- Never trust a client-provided player ID, balance, casino result, ledger row, stock count, corporation role or permission.
- Every financial/game command must be authorized and committed on the server.
- Preserve the original source branch; migration work stays on the remix branch until tested and reviewed.
