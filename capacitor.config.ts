import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.capitalfortune.app",
  appName: "Capital Fortune",
  webDir: "dist",
  server: { androidScheme: "https" },
  plugins: {
    SocialLogin: {
      providers: { google: true, facebook: false, apple: false, twitter: false },
    },
  },
};

export default config;
