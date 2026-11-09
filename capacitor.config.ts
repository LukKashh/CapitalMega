import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.capitalfortune.game",
  appName: "Capitalfortune",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    backgroundColor: "#0b0b12",
    allowMixedContent: false,
  },
};

export default config;
