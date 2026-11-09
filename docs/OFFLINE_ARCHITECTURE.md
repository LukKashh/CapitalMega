# Capital Fortune — Hybrid Offline Architecture

## Runtime model

The Android application retains its React/TypeScript presentation and Capacitor shell. Game rules and calculations remain in the existing TypeScript domain engine. Persistent game records are stored on-device in SQLite through the Capacitor SQLite plugin.

The native SQLite database is the durable source of truth on Android. Browser development uses a local-storage fallback so the same data-access service can be exercised without Android.

## Data access

`src/lib/local-store.ts` owns persistent record operations. `src/lib/local-firestore.ts` is a compatibility adapter for the existing game service contract; it does not connect to Firestore or any network service. Multi-record game commits are serialized and written in a single SQLite transaction.

Player identity is an installation-local identifier stored with the local save. There is no remote account, email/password authentication, Google sign-in, online verification, cloud save or remote authorization.

## Local data domains

Player states, corporations, usernames, ledger entries, collectible stock and administrator audit records retain their existing domain boundaries as local SQLite records. Existing game calculations, progression, elapsed-time simulation, financial logic and action idempotency continue to use these local records.

## Features whose meaning changes offline

- Player and corporation rankings are local to this installation, not global leaderboards.
- Corporations and membership data are local simulation records; they cannot synchronize members across devices or provide live multiplayer.
- Username registration and collectible stock limits are device-local, not globally shared.
- Developer adjustments and audit records affect this installation only; they are not server-protected administrative operations.
- Offline elapsed-time simulation uses the device clock, which is not a trusted server clock.

## Network and backup policy

Runtime building and property assets use bundled files. The Android manifest merger removes internet/network-state permissions, and Android application backup is disabled so saves are not copied through operating-system cloud backup.

The Android APK workflow verifies merged package permissions after compilation. A successful web build alone is not sufficient for Android release acceptance.
