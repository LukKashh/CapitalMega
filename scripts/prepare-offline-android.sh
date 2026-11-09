#!/usr/bin/env bash
set -euo pipefail

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [[ ! -f "$MANIFEST" ]]; then
  echo "Android manifest not found: $MANIFEST" >&2
  exit 1
fi

python3 - "$MANIFEST" <<'PY'
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

path = Path(sys.argv[1])
android = "{http://schemas.android.com/apk/res/android}"
tools = "{http://schemas.android.com/tools}"
ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
ET.register_namespace("tools", "http://schemas.android.com/tools")

tree = ET.parse(path)
root = tree.getroot()
root.set(android + "allowBackup", "false")

application = root.find("application")
if application is None:
    raise SystemExit("Android manifest has no application element")
application.set(android + "allowBackup", "false")
application.set(android + "fullBackupContent", "false")

for permission in (
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
):
    for element in list(root):
        if element.tag.endswith("uses-permission") and element.get(android + "name") == permission:
            root.remove(element)
    removal = ET.Element("uses-permission")
    removal.set(android + "name", permission)
    removal.set(tools + "node", "remove")
    root.insert(0, removal)

tree.write(path, encoding="utf-8", xml_declaration=True)
PY

grep -q 'tools:node="remove"' "$MANIFEST"
grep -q 'android:allowBackup="false"' "$MANIFEST"
echo "Offline Android manifest prepared."
