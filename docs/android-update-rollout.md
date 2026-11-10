# Capital Fortune Android update rollout

## Manual connection lifecycle

- The APK always opens on the disconnected launch gateway.
- A saved Supabase login may be detected locally, but no game session or cloud save is requested at launch.
- The player must press **Connect** to begin the public client-version check.
- Version verification runs before authentication. If the installed version is behind the latest published version, connection is blocked until the update is installed.
- If the client is current, an existing saved login proceeds to the game. A player without a saved login is sent to authentication only after passing the version check.
- After installing an update and reopening the app, the player must press **Connect** again. There is no automatic connection or automatic reconnection.

## Update manifest

The client reads `public/update-manifest.json` over HTTPS with caching disabled.

Fields:

- `latestVersion`: latest published semantic version.
- `minimumSupportedVersion`: retained as server policy metadata.
- `releaseUrl`: HTTPS release page fallback.
- `apkUrl`: optional direct HTTPS APK asset URL. Set this to the exact APK asset attached to the published GitHub release; do not guess the asset name.
- `releaseNotes`: player-facing update notes.
- `mandatory`: retained for manifest compatibility. The client currently requires every newer version, regardless of this flag.

On Android, when both `apkUrl` and `apkSha256` are configured, the Connect gateway downloads the APK using Android DownloadManager, verifies the SHA-256 digest, and enables the in-app **Install verified update** action. The native bridge hands the verified file to Android Package Installer. If permission to install unknown apps is not enabled, Android settings are opened first; return to the app and continue installation. Android always requires the user to approve the installation. After installation, reopen the app and press Connect again. If either direct APK field is absent, the client falls back to the release page. Web builds continue to use the release destination.

## Native updater implementation

The Android CI job copies the native `ApkUpdaterPlugin` and `ApkDownloadReceiver` sources into the generated Capacitor project. The bridge uses Android DownloadManager, verifies the downloaded file against the manifest SHA-256 before marking it installable, persists verification state across backgrounding, and shares the file with Android Package Installer through FileProvider. It does not bypass Android installation consent.

The native download path is only activated when a newer manifest entry has both a direct `apkUrl` and a matching `apkSha256`. The current manifest has neither field, so no update is currently advertised and a future update without those fields will use the release-page fallback. Web builds continue to use the release destination.

## Current implementation boundary

The version check is a public, read-only bootstrap request to the branch's raw GitHub manifest. It runs before Supabase Auth and before any game-session request. The authenticated `game-session` and `game-action` endpoints remain authenticated.

This source update does not deploy a new Supabase Edge Function, alter the production database, or add a server-side version rejection check to existing gameplay endpoints. The UI gate is therefore a client launch gate, not a tamper-proof server enforcement boundary. Server-side enforcement requires a separately deployed bootstrap/version policy and corresponding checks in authenticated gameplay endpoints.

The current manifest does not yet contain `apkUrl` or `apkSha256`; until a real APK release asset exists and its exact URL and checksum are added, the native download flow cannot activate. This branch currently builds a debug APK signed with the runner-generated debug key; it is not a signed production release. The earlier APK was also built with an ephemeral runner key, so the first installation of this updater build may require uninstalling the previous debug build and installing this one. A stable private release keystore must be configured as GitHub Actions secrets before release builds can update existing installations in place. Do not commit a private signing key to the repository.

## Publishing a release

Before publishing:

1. Set a monotonically increasing Android `versionCode` and matching `versionName`.
2. Inject the matching semantic version into `VITE_APP_VERSION`.
3. Build and sign the APK using the same stable release certificate used for the installed application.
4. Verify the APK signature and calculate its final published asset URL.
5. Update `latestVersion`, `releaseNotes`, and `apkUrl` in `public/update-manifest.json`.
6. Verify that the manifest version and APK metadata agree before publishing.

Do not publish a manifest version higher than the APK's actual version.

## Signing and installation constraints

Android only installs an APK as an in-place update when its signing certificate matches the installed app's certificate and its version code is higher. The current CI workflow creates a fresh Android project and builds a debug APK on an ephemeral runner; it does not preserve a release signing key.

A stable release keystore must be created and protected outside the repository. Configure GitHub Actions secrets for the base64-encoded keystore, keystore password, key alias and key password. Never commit the private key or embed it in the app.

The original debug signing key used for earlier ephemeral CI APKs is not available in the repository. Consequently, the first transition from those APKs to a stable release signing key may require a one-time uninstall/reinstall and sign-in again. Cloud game progress remains on Supabase, but uninstalling clears the local remembered login.

Ordinary sideloaded Android apps cannot silently replace themselves. Android's package installer requires user approval. Google Play distribution with Play In-App Updates is the smoother alternative if the app is later published through Play.
