import { registerPlugin } from "@capacitor/core";

export type ApkUpdaterPlugin = {
  downloadAndVerify(options: { url: string; sha256: string }): Promise<{ downloadId: number }>;
  installVerifiedApk(): Promise<{ permissionRequired: boolean }>;
  getUpdateStatus(): Promise<{ ready: boolean }>;
  addListener(
    eventName: "downloadStarted" | "updateReady" | "downloadFailed",
    listenerFunc: (event: { downloadId?: number; sha256?: string; message?: string }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
};

export const ApkUpdater = registerPlugin<ApkUpdaterPlugin>("ApkUpdater");
