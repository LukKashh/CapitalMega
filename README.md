# Capital Fortune

**Capital Fortune** is a wealth and business tycoon game focused on building and managing an expanding business empire.

This repository contains the application source code for the Google AI Studio project. The project is developed in Google AI Studio Build mode and maintained in GitHub for version control, code review, testing, and continued development.

- **Google AI Studio project:** [Open Capital Fortune](https://aistudio.google.com/u/3/apps/77653b74-49b5-4027-bed8-1275ae6fb345?showPreview=true)
- **Repository:** [LukKashh/CapitalMega](https://github.com/LukKashh/CapitalMega)

> **Project status:** Active development. Features, balancing, and architecture may change. The repository is the application source, not a promise that every documented or planned feature is complete.

## Game overview

Capital Fortune is built around the player's own growing empire. Its systems include business and property ownership, financial management, markets, progression, collectibles, casino activities, and cooperative corporation features.

The main progression is individually managed. Online player accounts and cloud-backed progression support continuity, while corporations provide a limited cooperative layer.

## Application architecture

This is a **web application**, not a native Android project or a website wrapper for an Android APK.

| Layer | Current implementation |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS, Radix-based UI components |
| Application framework | TanStack Start with file-based routing |
| Development and build | Vite, Bun |
| Game rules and simulation | TypeScript modules in `src/game/` |
| Game screens | `src/components/game/` and `src/routes/` |
| Authentication and game persistence | Firebase Authentication and Cloud Firestore integration |
| Public ranking reads | Lightweight Firestore projections in `public_players` and `public_corporations` |
| Asset storage | Firebase Storage helpers and repository-hosted assets |
| Database artifacts | Firestore rules/blueprint plus retained Drizzle migration files |

Some Supabase and Lovable-named compatibility files and dependencies remain in the codebase. Their presence does not define the project's origin or mean they are the primary game-state backend. Review their actual call sites before removing or replacing them.

For the detailed directory map and rules for where new files belong, see [Repository Structure](docs/REPOSITORY_STRUCTURE.md).

## Getting started

### Requirements

- Node.js 22 or later
- [Bun](https://bun.sh/)
- Access to the Firebase project configuration and any required server-side secrets for the environment you are running

### Install dependencies

```bash
git clone https://github.com/LukKashh/CapitalMega.git
cd CapitalMega
bun install --frozen-lockfile
```

### Run the development server

```bash
bun run dev
```

Open the local URL printed by Vite in the terminal.

### Available scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create the production build |
| `bun run preview` | Preview the production build |
| `bun run test` | Run the automated test suite once |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Run ESLint |
| `bun run format` | Format project files with Prettier |

Before submitting a change, run:

```bash
bun run test
bun run lint
bun run build
```

## Public leaderboard projections

The game maintains minimal `public_players` and `public_corporations` documents for ranking screens. Full player saves remain in `player_states` and are owner/admin readable only. Existing accounts and corporations populate their projection the next time they successfully synchronize or perform an action. Deploy updated Firestore rules alongside the application release; see [Internal Processing Update](docs/architecture/INTERNAL_PROCESSING_UPDATE.md).

The current game action path still uses the Firebase client SDK. It is not yet a trusted server-authoritative command service; see the architecture baseline for the required hosting/runtime and secret-provisioning decisions.

## Configuration and secrets

- `firebase-applet-config.json` is imported by the Firebase initialization module. Keep it aligned with the intended Firebase project.
- `.env.example` documents environment variables used by the retained Supabase integration. It is not necessarily an exhaustive list of every server-side secret used by the application.
- Supply private values such as service-role credentials and server-only signing secrets through the environment or the hosting platform's secret manager.
- Never commit `.env`, `.env.local`, service-role keys, private signing keys, or other secret values.
- Review `firestore.rules` whenever changing client-accessible Firestore data or permissions.

Do not add a second persistence provider or migrate existing player data as part of an unrelated feature change. First inspect the active data flow and the existing security rules.

## Working with Google AI Studio

The project is connected to the Google AI Studio Build workflow. Google documents GitHub linking as a two-way synchronization workflow: changes can be pushed from AI Studio to GitHub, and changes made in GitHub can be pulled back into AI Studio.

When working across both environments:

1. Confirm which branch and revision contain the intended changes.
2. Avoid editing the same files independently in AI Studio and GitHub before syncing.
3. Review diffs and resolve conflicts deliberately rather than overwriting one side.
4. Keep the default branch buildable.

See Google's [Google AI Studio Build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode) for current GitHub synchronization and export guidance.

## Development conventions

- Keep game rules, calculations, progression, and balancing logic in `src/game/`, not inside presentation components.
- Keep route components in `src/routes/`; TanStack Start uses file-based routing.
- Keep game-specific reusable UI in `src/components/game/` and generic UI primitives in `src/components/ui/`.
- Keep Firebase access and application services in their existing integration/service modules.
- Preserve existing player data and backward-compatible defaults when changing persisted state.
- Add or update tests for game-rule changes and important regressions.
- Do not manually edit generated route trees, generated integration files, or generated migration metadata.
- Do not invent new game mechanics, balance values, or catalogue entries without an approved requirement.

See [AGENTS.md](AGENTS.md) for repository-level implementation rules and [docs/](docs/) for project specifications.

## Security

Security-sensitive changes must be reviewed against:

- `firestore.rules`
- `firebase-blueprint.json`
- `security_spec.md`
- The server-side action and persistence paths

Never rely on hidden UI controls as the only authorization check. Validate permissions at the data-access or authoritative action boundary.

## Contributing

Use a focused branch for each change. Keep pull requests limited to a coherent feature, fix, or documentation update. Include:

- A concise description of the change and its scope.
- Relevant test coverage.
- Test, lint, and build results.
- Any required configuration or migration notes.

Do not include unrelated formatting churn or generated build output.
