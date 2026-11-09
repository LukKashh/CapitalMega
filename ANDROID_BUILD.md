# Capital Fortune Android APK Build

This branch adds a phone-accessible cloud APK build using GitHub Actions.

## Build

1. Open the repository on GitHub and select Actions.
2. Select **Android APK** and choose **Run workflow**.
3. When the run succeeds, open its summary and download the **capital-fortune-debug-apk** artifact.
4. Extract the ZIP on Android and install `app-debug.apk`. Android may ask you to allow installs from the app used to open the APK.

The workflow builds a debug APK for testing. A Play Store release requires a separately managed signing key and release configuration.

## App identity

- Name: Capital Fortune
- Application ID: `com.capitalfortune.app`
- Capacitor: 8.x
- Web output: `dist`

Google sign-in uses the native Android Credential Manager flow through `@capgo/capacitor-social-login`, then exchanges the Google ID token with the existing Firebase Authentication project. Browser sign-in continues to use Firebase popup authentication. The Android OAuth client must be registered in the same Google Cloud project with package name `com.capitalfortune.app` and the debug signing SHA-1 `64:BC:09:50:D6:43:91:11:23:CA:E0:53:61:16:B0:2F:4B:88:4E:CE`. The workflow caches the debug keystore under `capital-fortune-debug-keystore-v1` so subsequent debug builds retain this fingerprint. The configured `oAuthClientId` must be the Web application OAuth client ID. Add the Android client in Google Cloud Console / Firebase project settings before testing Google sign-in; this external console change cannot be made by the repository build. This workflow does not alter Firebase database rules.

## Important

The application remains a web-based React app hosted in a native Capacitor Android shell. Backend services remain external. This process does not make client-side game logic authoritative or protect secrets embedded in the app.
