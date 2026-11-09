# Capital Fortune — Architecture Implementation Roadmap

**Status:** Proposed phased implementation plan  
**Principle:** Secure and stabilize the existing project before expanding or restructuring it.

This roadmap turns the architecture recommendations into reviewable work. Each phase should be implemented as a focused pull request with tests and a clear rollback path. Do not merge a later phase while a prerequisite security or data-integrity issue remains unresolved.

## Phase 0 — Baseline and decision record

**Deliverables**
- Maintain the verified architecture baseline in `docs/architecture/ARCHITECTURE_BASELINE.md`.
- Record the current provider decision: Firebase Authentication + Firestore remain the active identity/game-state path.
- Inventory actual Supabase, Firebase Storage, and Drizzle runtime call sites before changing providers.
- Maintain a data-flow map for player state, corporations, ledger, collectible stock, authentication, and assets.

**Acceptance**
- Each persisted collection has a documented owner, writer, reader, and authorization rule.
- No provider migration is bundled into unrelated feature work.
- Existing AI Studio synchronization and generated files are respected.

## Phase 1 — Security boundary and authoritative commands

**Priority: Critical**

**Entry gate — confirm the production server runtime before implementation**

The current game hooks call ordinary functions from `src/lib/game.functions.ts` directly; they are not invoking TanStack server functions. The existing global function middleware therefore does not protect game actions. In addition, the repository currently sets `nitro: false`, contains no Firebase Admin/Functions dependency, and has no checked-in production deployment/secret-provisioning configuration.

Before coding the privileged adapter:
- Confirm where the production application is hosted and whether requests execute in a Node.js server, an edge runtime, or static hosting.
- Confirm how that host deploys server endpoints and provisions server-only secrets.
- Select the matching trusted backend runtime. Do not assume Firebase Admin SDK is compatible with an edge target, or that a static build can enforce server-side authorization.
- Keep the backend choice aligned with the existing Firebase Authentication and Firestore data unless a separate provider decision is approved.

**Deliverables**
- Replace the direct client-executed game command path with actual trusted server endpoints (TanStack server functions only if the selected deployment executes them; otherwise use the selected backend's HTTPS API).
- Establish server-side Firebase ID-token verification using Firebase Admin SDK or an equivalent mechanism appropriate to the confirmed runtime.
- Replace any authorization decision based on decoded-but-unverified token payloads.
- Keep domain calculations in provider-independent `src/game/` modules.
- Tighten Firestore rules so clients cannot create ledger entries or mutate global stock counters directly.
- Restrict private player-state and ledger reads to their owner or explicit trusted workflows.
- Rework corporation writes so role/permission checks and state transitions are enforced by trusted commands.
- Remove the hard-coded casino secret fallback; fail closed when the server-only secret is missing.
- Keep public leaderboard/profile data in a deliberately limited read model rather than exposing private player saves.

**Acceptance**
- Unauthenticated requests fail.
- A user cannot submit a command for another player's UID.
- Forged bearer tokens are rejected.
- A client cannot create arbitrary ledger entries, edit global stock, or write corporation state directly.
- Authorization is checked against current state, not stale client state.
- No secrets are shipped to the browser bundle.
- Security-rule tests cover owner, non-owner, anonymous, and administrator cases.

**Migration note:** this phase changes the trust boundary. Preserve current player-save shape and action semantics. Map every current direct Firestore read/write and its UI consumer before changing rules. Migrate game actions and dependent reads behind the selected trusted boundary first; keep public leaderboard/profile data in an explicit limited projection. Tighten client rules only after the corresponding server path and read model are deployed and tested. Use compatibility wrappers only as a temporary migration aid; do not leave both client and server paths able to commit the same action.

### Progress note — internal processing update (2026-11-09)

The internal processing update implements part of this roadmap's integrity and read-model groundwork: transaction reads now precede writes, player and corporation versions are checked at commit, duplicate action keys are bounded and replay-safe, failed persistence returns failure, private player-save reads are owner/admin scoped, and minimal public leaderboard projections are maintained atomically.

This does **not** complete Phase 1 or Phase 2. The game action path still executes through the Firebase client SDK; client-authoritative player saves, ledger creation, global stock writes, corporation authorization and private ledger reads remain to be moved behind a verified trusted backend. The production hosting runtime and server-only secret provisioning must be identified before implementing that boundary. See [Internal Processing Update](INTERNAL_PROCESSING_UPDATE.md) and [Architecture Baseline](ARCHITECTURE_BASELINE.md).

## Phase 2 — Unified financial transaction service

**Priority: Critical**

**Deliverables**
- Define a single financial transaction contract for debits, credits, transfers, fees, and reservations already supported by existing game systems.
- Use a durable append-only ledger with unique transaction IDs and idempotency keys.
- Commit balance/state changes and ledger entries atomically.
- Define account ownership and visibility for private transaction history.
- Route existing banking, business, property, market, casino, and corporation financial operations through the shared boundary where applicable.
- Preserve existing formulas and mechanics; do not invent new rates, fees, or balances.

**Acceptance**
- Every financial mutation has one authorized command path.
- Duplicate command delivery cannot double-apply a transaction.
- Concurrent operations cannot overspend or duplicate rewards.
- Failed operations leave no partial balance or ledger changes.
- Ledger records reconcile with committed state transitions.
- Regression tests cover success, rejection, retry, concurrency, and rollback.

## Phase 3 — Domain/application/persistence separation

**Priority: High**

**Deliverables**
- Keep `src/game/` provider- and UI-independent.
- Extract typed application commands and queries around existing game operations.
- Isolate Firestore access behind persistence adapters/repositories.
- Define explicit DTOs/read models for overview, profile, leaderboard, banking, corporation, and other screens.
- Add persisted-state versioning and safe migration/default handling.
- Remove duplicate or unused provider abstractions only after a call-site audit.

**Acceptance**
- Domain tests run without Firebase or browser mocks.
- UI components do not calculate or authorize economic outcomes.
- Server handlers do not return full private player state to unrelated views.
- Existing saves load without loss or unexpected reset.
- The existing gameplay behavior remains unchanged.

## Phase 4 — Shared UI and navigation system

**Priority: High**

**Deliverables**
- Standardize design tokens for typography, spacing, radii, elevations, surfaces, and semantic status colors.
- Consolidate reusable buttons, cards, badges, tables/lists, dialogs, tabs, empty states, and loading/error states.
- Define consistent currency, percentage, date/time, and large-number formatting.
- Establish responsive layout rules for desktop and mobile portrait.
- Keep current navigation destinations and feature behavior; reorganize only where an approved UX change exists.

**Acceptance**
- Existing screens use shared primitives rather than near-duplicate local styles.
- Mobile portrait screens avoid horizontal overflow and inaccessible controls.
- Keyboard focus, dialog behavior, and screen-reader labels are consistent.
- No route or feature disappears during the visual consolidation.

## Phase 5 — Centralized events, notifications, and observability

**Priority: Medium**

**Deliverables**
- Define typed domain events for existing game actions.
- Centralize notification creation and read-state handling.
- Add structured server logs with request, command, player, and transaction correlation identifiers.
- Add admin audit events for privileged actions.
- Add safe error reporting and operational health diagnostics.

**Acceptance**
- Notifications are generated from committed events, not optimistic UI assumptions.
- Failed or rolled-back actions do not produce success notifications.
- Logs exclude tokens, secrets, and unnecessary personal information.
- Admin actions can be traced without granting extra data access.

## Phase 6 — Reliability, test coverage, and release controls

**Priority: Medium**

**Deliverables**
- Add unit tests for domain rules and financial calculations.
- Add integration tests for trusted command handlers and persistence transactions.
- Add Firestore emulator security-rule tests.
- Add regression coverage for save compatibility, concurrency, idempotency, and mobile navigation.
- Keep CI validation for tests, lint, and production build.
- Document backup, restore, migration, and rollback procedures.

**Acceptance**
- Critical economy/security paths have deterministic automated coverage.
- CI blocks changes that break tests, lint, or production builds.
- Data migrations are reversible or have a documented recovery plan.
- Release notes identify schema and security-rule changes.

## Recommended execution order

| Order | Work | Why |
| --- | --- | --- |
| 1 | Security boundary | Prevent client-controlled writes and identity spoofing |
| 2 | Financial transaction service | Protect balance and ledger consistency |
| 3 | Domain/application/persistence separation | Make systems maintainable without changing gameplay |
| 4 | UI design system | Improve consistency without coupling UI to game rules |
| 5 | Events and observability | Make operations diagnosable |
| 6 | Reliability and release controls | Protect future expansion |

## Change-control rules

- Use a separate branch and pull request for each coherent phase or sub-phase.
- Do not merge pull requests automatically.
- Do not change gameplay formulas, catalogue contents, progression, or feature scope as part of architecture refactoring.
- Do not migrate databases or authentication providers without a separate architecture decision and data migration plan.
- Update `docs/architecture/ARCHITECTURE_BASELINE.md` when implementation changes make the baseline inaccurate.
- Validate with `bun run test`, `bun run lint`, and `bun run build`; add emulator/security tests for rule or backend changes.
- Distinguish automated validation from physical-device visual testing.
