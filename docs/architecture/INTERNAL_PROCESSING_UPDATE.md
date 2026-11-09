# Internal Processing, Integrity and Rendering Update

**Branch:** `perf/internal-processing-audit-2026-11-09`  
**Scope:** Reliability, processing/backend efficiency, rendering, and incremental architecture separation.  
**Gameplay:** No economy formulas, rates, unlocks, feature rules, or catalogue data were intentionally changed.

## 1. Reliability and data integrity

### Firestore transaction ordering

All transaction reads are now performed before the first queued write. The collectible stock and corporation documents are pre-read and validated before player, corporation, ledger, or stock documents are written. Both player and corporation versions are checked inside the transaction to reject stale concurrent updates. This removes the previous transaction read-after-write failure path and prevents stale corporation snapshots from overwriting newer member updates.

### Honest commit results

A failed Firestore commit now returns a failed action/synchronization result instead of returning the locally calculated state as a successful save. Initial player and corporation reads also fail closed: a transient read error is no longer interpreted as an absent player or corporation.

### Bounded action idempotency

The player document now stores the most recent 64 action keys. A repeated key found in that window returns the current persisted player state without reapplying the action. Click batches retain their key/count after a failed response and retry the same request, so a response lost after a successful commit can be safely reconciled.

This is a bounded replay window, not a permanent command ledger. The last 64 keys are retained to keep the player's document compact.

### Private player saves and public projections

- Ordinary users can read only their own `player_states/{uid}` document. Listing the private collection is restricted to administrators.
- `public_players/{uid}` contains only the fields required for public ranking and corporation application checks: user ID, username, level, net worth, corporation tag/ID and update time.
- Firestore rules require a public player projection to match the corresponding player document written in the same transaction.
- `public_corporations/{corpId}` contains the small ranking projection. It is updated atomically with the corporation save and removed when the corporation is dissolved.

Existing players and corporations are indexed lazily: their projection is created on their next successful game synchronization/action. No bulk backfill or admin credential was added. Consequently, leaderboard coverage will grow as existing accounts and corporations refresh.

## 2. Processing and backend efficiency

- The shared game-state query now synchronizes every 60 seconds rather than every 20 seconds, and does not poll while the browser is in the background.
- Player leaderboard queries use Firestore ordering and a ten-row limit. Experience ranking uses player level; net-worth ranking uses net worth.
- Corporation leaderboard queries use the requested ranking field and a ten-row limit.
- Only the currently selected leaderboard category is queried/refreshed.
- Pending corporation membership lookups are issued concurrently while preserving the original pending-list priority.
- Achievement evaluation is orchestrated once after the combined tick/action cycle rather than once in `tick` and again in `apply`.
- Real-estate property economics are calculated once per property render cycle and reused for aggregate and row-level wallet displays.
- Player stock/crypto definition maps and current market ticks are captured once per net-worth calculation, not fetched/re-resolved for every holding.

## 3. Rendering and architecture

- Live wallet display refresh is reduced from 250 ms to 1,000 ms. The underlying server-side simulation and financial formulas are unchanged.
- Home-screen modifiers/click value, Empire-screen modifiers, and Real Estate screen modifiers are memoized against their source game data.
- Corporation leaderboard aggregation now lives in the provider-independent `src/game/leaderboard.ts` domain module, with tests covering its valuation and activity calculations.
- Public ranking DTOs are deliberately smaller and no longer include unrelated balance/profile fields.

## 4. Remaining trusted-server prerequisite

This pass does **not** make the game command path server-authoritative. `src/lib/game.functions.ts` still uses the Firebase client SDK; the game actions are still ordinary imported functions rather than verified server endpoints. Firestore rules still allow a signed-in owner to write their own player save and still permit broad client writes to some global collections such as ledger and collectible stock.

The repository's architecture baseline records that:
- `vite.config.ts` has `nitro: false`;
- no Firebase Admin/Functions dependency or trusted deployment manifest is configured;
- no production host/runtime or server-only secret provisioning path is established.

Therefore, a safe trusted-command migration still requires confirmation of the production host/runtime and a server-only secret mechanism. It must then migrate action execution, ledger creation, stock updates and corporation transitions behind that verified server boundary before client write permissions can be removed. This update intentionally does not add credentials, introduce another database, or guess an unsupported backend runtime.

## 5. Deployment and validation notes

1. Deploy the updated Firestore rules with the application update. The leaderboard code now reads the public projection collections rather than listing private player saves.
2. Existing player/corporation ranking records are populated lazily on the next successful game synchronization or action.
3. Run `bun install --frozen-lockfile`, `bun run test`, `bun run lint`, and `bun run build` in CI before merging.
4. Validate Firestore rules in the Firebase Emulator Suite or an isolated test project before production deployment. The repository's current CI workflow does not run Firestore emulator security tests.
5. Profile production/runtime behavior after deployment; static source changes alone do not establish measured CPU, memory, frame-time, or Firestore-latency improvements.
