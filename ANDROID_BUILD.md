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

Google sign-in inside the native app may still require Android OAuth client configuration and a native authentication integration. This workflow does not alter Firebase authentication or database rules.

## Important

The application remains a web-based React app hosted in a native Capacitor Android shell. Backend services remain external. This process does not make client-side game logic authoritative or protect secrets embedded in the app.
