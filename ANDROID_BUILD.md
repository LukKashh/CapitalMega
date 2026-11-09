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

Google sign-in uses the native Android Credential Manager flow through `@capgo/capacitor-social-login`, then exchanges the Google ID token with the existing Firebase Authentication project. Browser sign-in continues to use Firebase popup authentication. The Android OAuth client must be registered in the same Google Cloud project with package name `com.capitalfortune.app` and the SHA-1 fingerprint of the signing certificate used for the APK. The configured `oAuthClientId` must be the Web application OAuth client ID. This workflow does not alter Firebase database rules.

## Important

The application remains a web-based React app hosted in a native Capacitor Android shell. Backend services remain external. This process does not make client-side game logic authoritative or protect secrets embedded in the app.
