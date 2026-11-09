# Capital Fortune — Architecture Baseline

**Status:** Verified baseline and target boundaries  
**Repository:** `LukKashh/CapitalMega`  
**Scope:** Documentation of the implementation observed on `main`; this document does not authorize a provider migration or gameplay changes.

## 1. Executive summary

Capital Fortune is a React 19 / TypeScript web application using TanStack Start, Vite, and Bun. Its game rules are primarily organized under `src/game/`; routes live under `src/routes/`; game presentation components live under `src/components/game/`.

The current persistence and authentication path is Firebase Authentication and Cloud Firestore. The game action implementation in `src/lib/game.functions.ts` imports the Firebase client SDK and executes Firestore reads and transactions through that SDK. Therefore, the current action path must **not** be described as a trusted server-authoritative backend merely because game calculations are kept in TypeScript modules or because Firestore transactions are used.

Supabase packages and integration files remain in the repository. The reviewed project documentation describes them as retained integration/compatibility code, not as the active player-save provider. Their remaining runtime call sites should be audited before any cleanup.

## 2. Verified current structure

| Area | Current location | Observed responsibility |
| --- | --- | --- |
| Application routes | `src/routes/` | TanStack file-based route screens |
| Game UI | `src/components/game/` | Game-specific React presentation |
| Shared UI | `src/components/ui/` | Reusable interface primitives |
| Game domain | `src/game/` | Types, configuration, rules, simulation and system modules |
| Application/data access | `src/lib/` | Game action flow, Firebase setup, helpers and integration code |
| Firebase access | `src/lib/firebase.ts` | Firebase app, Auth, Firestore and Storage initialization |
| Game actions and saves | `src/lib/game.functions.ts` | Player load, tick/action processing, Firestore transaction writes |
| Access policy | `firestore.rules` | Firestore document access and validation rules |
| Data blueprint | `firebase-blueprint.json` | Document/entity shape reference |
| Security notes | `security_spec.md` | Intended security invariants and attack scenarios |
| Tests | `src/game/*.test.ts` and `src/test/` | Domain and application tests |
| Runtime artwork | `public/assets/` | Images and other browser-served assets |
| AI Studio artifacts | `.aistudio/artifacts/` | Planning/support artifacts, not runtime source |

Do not move files simply to make the tree match a proposed ideal. First establish imports, runtime dependencies, AI Studio synchronization expectations, and tests.

## 3. Current game-action flow

The inspected `src/lib/game.functions.ts` flow currently:

1. Obtains the current Firebase user through the client-side Firebase Auth instance.
2. Loads the player's `player_states/{uid}` document and, where applicable, a corporation document.
3. Constructs a game context and invokes game-domain functions such as `tick`, `apply`, and corporation actions.
4. Opens a Firestore `runTransaction` from the Firebase client SDK.
5. Checks the player's version for optimistic concurrency.
6. Writes player state, corporation state, ledger records, and collectible stock counters in that transaction.

The game domain logic is usefully separated from React presentation, but the orchestration and persistence boundary currently reside in a module that uses the client SDK. Firestore Security Rules are consequently part of the effective trust boundary.

## 4. Current provider responsibilities

| Provider | Verified role | Architecture treatment |
| --- | --- | --- |
| Firebase Authentication | Sign-in identity used by the game action path | Retain as current identity provider unless a separately reviewed decision changes it |
| Cloud Firestore | Player state, corporation state, ledger and collectible stock in the inspected action flow | Current game-state persistence provider |
| Firebase Storage | Initialized in `src/lib/firebase.ts`; graphic asset helpers are present | Retain existing usage pending call-site audit |
| Supabase | Supabase client and storage helper code exist | Do not assume it owns player state; audit call sites before removal or expansion |
| Drizzle/PostgreSQL artifacts | Migration/configuration artifacts are present | Do not treat them as active game persistence without runtime evidence |

**Decision for this phase:** do not introduce a second database, migrate player saves, or change authentication providers. First document and test the current data flow, then choose a secure execution boundary.

## 5. Important security and integrity gaps to resolve

These are findings from the current rules and action code, not assumptions about intended future behavior.

### 5.1 Client-executed game actions

The game action flow uses Firebase client SDK operations and client-side game calculations. A client can be modified by its operator. Sensitive economic outcomes must not rely solely on the bundled client code being honest.

**Required direction:** move privileged state transitions behind a trusted server-side boundary that verifies Firebase ID tokens, validates action payloads, loads authoritative state, applies domain rules, and commits the result atomically. Keep the UI as an input/presentation client.

### 5.2 Ledger write authorization

The current `/ledger/{ledgerId}` rule permits any signed-in user to create a structurally valid ledger entry. Append-only update/delete restrictions are useful, but create permission alone does not establish that a transaction actually occurred or that the caller may debit/credit the referenced accounts.

**Required direction:** ledger creation must be performed only by the trusted transaction boundary. Client access should be read-only and scoped to the records the player is authorized to see.

### 5.3 Player-state and ledger read scope

The current rules allow any signed-in user to read/list player-state documents and ledger documents. This is broader than private per-player saves and private financial history.

**Required direction:** define the intended public profile/leaderboard projection separately from private player state and financial records. Restrict private reads to the owner and explicitly authorized administrative workflows.

### 5.4 Corporation and global stock writes

The current corporation update conditions allow several membership/application/invite-based cases to update a whole corporation document. The global collectible stock rules permit signed-in clients to create/update counters if the basic shape is valid.

**Required direction:** validate each corporation command against the caller's role and the exact state transition on the trusted side. Global stock changes must be atomic and server-authorized.

### 5.5 Token verification middleware

`src/lib/firebase-auth-middleware.ts` extracts a user identifier by decoding a bearer token payload; decoding is not signature verification. Do not use this as proof of identity or authorization for privileged operations. Replace it with Firebase Admin SDK token verification (or an equivalent trusted verification mechanism) before relying on middleware-provided identity.

### 5.6 Casino secret fallback

The casino seed helper in `src/lib/game.functions.ts` has a hard-coded fallback value when `CASINO_SECRET` is absent. A production secret must be supplied through server-only configuration and startup should fail closed if it is missing. This must be addressed as part of moving casino outcome generation to a trusted server boundary.

## 6. Target architecture boundaries

The target is an incremental separation of responsibilities, not a wholesale rewrite.

- **Presentation:** React routes and components render state and collect player input.
- **Application commands:** typed command handlers validate request shape and translate UI intent into domain commands.
- **Domain:** `src/game/` contains deterministic rules, calculations, state transitions, and domain types. It should not import React, Firebase, Supabase, browser APIs, or UI components.
- **Trusted execution:** server-side handlers authenticate the caller, authorize the operation, load current state, invoke domain logic, and commit state changes.
- **Persistence adapters:** provider-specific reads/writes are isolated behind narrow interfaces. Firebase remains the current provider until a documented migration decision is approved.
- **Read models:** public profile, leaderboard, dashboard, and private account views expose only the fields each screen needs.
- **Observability:** structured logs, request/transaction identifiers, safe error reporting, and administrative audit trails avoid leaking secrets or private player data.

## 7. Target module map

This is a target map for new or gradually extracted modules. It is not a command to move every existing file.

```text
src/
  app/                         # route composition and app-level providers
  routes/                      # TanStack file-based routes
  components/
    game/                      # game-specific presentation
    ui/                        # shared UI primitives
  game/                        # pure domain rules and state transitions
  application/
    commands/                  # use cases and command orchestration
    queries/                   # screen-specific read models
    contracts/                 # shared request/response contracts
  server/
    auth/                      # verified identity and authorization
    commands/                  # trusted command entry points
    persistence/                # provider adapters and transaction boundary
    observability/             # structured logs and audit support
  lib/                         # existing integrations/utilities during migration
docs/
  architecture/                # decisions, diagrams, migration plan
```

Use existing paths until an extraction has a clear benefit and can be validated. Avoid creating empty directories or parallel abstractions with no real call sites.

## 8. Cross-system invariants

1. A player has one authoritative game state; UI caches and read models are derived views.
2. All financial changes use one trusted transaction boundary.
3. Every committed financial event has a unique ID and a durable audit record.
4. A failed transaction changes neither the balance nor its associated ledger entries.
5. Retried commands are idempotent; a repeated request cannot pay twice or consume stock twice.
6. Concurrent commands cannot overspend, exceed shared borrowing capacity, or over-allocate limited stock.
7. Client-provided balances, prices, timestamps, ownership claims, permissions, and outcomes are untrusted inputs.
8. Corporation commands are authorized against the latest membership and rank state.
9. Private saves and financial records are not exposed through public leaderboard/profile reads.
10. Persisted-state changes preserve existing saves through explicit versioning and tested defaults/migrations.

## 9. Non-goals for this baseline

- No game mechanic or economy balancing changes.
- No new catalogue entries, financial rates, fees, limits, or progression rules.
- No Firebase-to-Supabase or Firestore-to-PostgreSQL migration.
- No large directory move or mass import rewrite.
- No change to player-facing UI or navigation.
- No deletion of existing compatibility integrations.
