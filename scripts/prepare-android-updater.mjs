import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const javaSource = resolve(root, "native/android/app/src/main/java/com/capitalfortune/game/ApkUpdaterPlugin.java");
const javaTarget = resolve(root, "android/app/src/main/java/com/capitalfortune/game/ApkUpdaterPlugin.java");
const pathsSource = resolve(root, "native/android/app/src/main/res/xml/capitalfortune_file_paths.xml");
const pathsTarget = resolve(root, "android/app/src/main/res/xml/capitalfortune_file_paths.xml");
const activityPath = resolve(root, "android/app/src/main/java/com/capitalfortune/game/MainActivity.java");
const manifestPath = resolve(root, "android/app/src/main/AndroidManifest.xml");

await mkdir(dirname(javaTarget), { recursive: true });
await mkdir(dirname(pathsTarget), { recursive: true });
await copyFile(javaSource, javaTarget);
await copyFile(pathsSource, pathsTarget);

let activity = await readFile(activityPath, "utf8");
if (!activity.includes("ApkUpdaterPlugin.class")) {
  activity = activity.replace(
    /public class MainActivity extends BridgeActivity\s*\{/,
    "public class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(android.os.Bundle savedInstanceState) {\n    registerPlugin(ApkUpdaterPlugin.class);\n    super.onCreate(savedInstanceState);\n  }",
  );
}
if (!activity.includes("ApkUpdaterPlugin.class")) throw new Error("Could not register ApkUpdaterPlugin in MainActivity.");
await writeFile(activityPath, activity);

let manifest = await readFile(manifestPath, "utf8");
if (!manifest.includes("REQUEST_INSTALL_PACKAGES")) {
  manifest = manifest.replace("<application", '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n\n    <application');
}
if (!manifest.includes('android:name="androidx.core.content.FileProvider"')) {
  manifest = manifest.replace(
    "</application>",
    `<provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${"\${applicationId}"}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/capitalfortune_file_paths" />
        </provider>
    </application>`,
  );
}
await writeFile(manifestPath, manifest);
console.log("Installed Capital Fortune native APK updater into generated Capacitor Android project.");
