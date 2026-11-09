#!/usr/bin/env bash
set -euo pipefail

MAIN_ACTIVITY="$(find android/app/src/main/java -type f -name 'MainActivity.java' -print -quit)"
if [[ -z "${MAIN_ACTIVITY}" ]]; then
  echo "MainActivity.java was not generated; refusing to build without native Google activity integration." >&2
  exit 1
fi

python3 - "${MAIN_ACTIVITY}" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
source = path.read_text()

required = [
    "import ee.forgr.capacitor.social.login.GoogleProvider;",
    "import ee.forgr.capacitor.social.login.SocialLoginPlugin;",
    "import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;",
    "import com.getcapacitor.PluginHandle;",
    "import com.getcapacitor.Plugin;",
    "import android.content.Intent;",
    "import android.util.Log;",
]
if "ModifiedMainActivityForSocialLoginPlugin" in source and "handleGoogleLoginIntent" in source:
    print(f"Native Google activity integration already present: {path}")
    raise SystemExit(0)

for item in required:
    if item not in source:
        source = source.replace("import com.getcapacitor.BridgeActivity;", item + "\nimport com.getcapacitor.BridgeActivity;")

source = source.replace(
    "public class MainActivity extends BridgeActivity {",
    "public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {"
)
if "implements ModifiedMainActivityForSocialLoginPlugin" not in source:
    raise SystemExit("Unexpected MainActivity template; could not safely add Google provider interface.")

methods = """
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
"""
source = re.sub(r"\\n}\\s*$", methods + "\\n}\\n", source)
if "handleGoogleLoginIntent" not in source:
    raise SystemExit("Failed to inject Google activity result handler.")
path.write_text(source)
print(f"Patched native Google activity integration: {path}")
PY

grep -q 'handleGoogleLoginIntent' "${MAIN_ACTIVITY}"
grep -q 'implements ModifiedMainActivityForSocialLoginPlugin' "${MAIN_ACTIVITY}"
