import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/local-auth";
import { AppShell } from "@/components/game/AppShell";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-mono text-muted-foreground">Loading local Capitalfortune save...</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: LoadingScreen,
  beforeLoad: async () => ({ user: await getCurrentUser() }),
  component: AppShell,
});
