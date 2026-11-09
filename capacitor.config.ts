import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.capitalfortune.app",
  appName: "Capital Fortune",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
