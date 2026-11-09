import type { ComponentType } from "react";

export async function checkDeveloperAccess(): Promise<boolean> {
  return false;
}

export const DeveloperToolsDialog: ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = () => null;
