# Independent Edition — Migration Status

## Completed
- Extracted and inspected the uploaded archive (270 files, 40 directories) and identified the active runtime integrations.
- Confirmed the source project is Capital Fortune, a wealth/business tycoon game.
- Created branch `remix/supabase-android-independent` from `main`.
- Selected the connected, empty Supabase project `CapitalfortuneViz` in `eu-central-1`.
- Applied the backend foundation migration and a follow-up index migration.
- Enabled RLS on all 11 exposed application tables; no client write policies are granted for game-critical records.
- Checked Supabase security, performance and health advisors. Security and health have no findings. Performance reported an unindexed corporation founder FK; an index was added. Remaining unused-index notices are expected before the application starts querying those indexes.

## Not yet completed
- Existing frontend still imports Firebase for authentication and game persistence.
- Existing game command orchestration still runs client-side and must be ported to Edge Functions.
- Supabase Auth screens, typed persistence adapter, Storage buckets/policies and seed data remain to be implemented.
- Capacitor configuration, Android build, emulator/device verification and release signing remain outstanding.
- The Android APK and a deployable web release have not been produced.

## Non-negotiable security constraints
- No service-role or secret key in frontend code, environment variables prefixed with `VITE_`, or APK assets.
- Never trust a client-provided player ID, balance, casino result, ledger row, stock count, corporation role or permission.
- Every financial/game command must be authorized and committed on the server.
- Preserve the original source branch; migration work stays on the remix branch until tested and reviewed.
