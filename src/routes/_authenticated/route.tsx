import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { AppShell } from "@/components/game/AppShell";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-mono text-muted-foreground">Loading Capitalfortune...</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: LoadingScreen,
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return { user: { uid: "guest_player", email: "guest@capitalfortune.local" } };
    }
    const isAutostart =
      window.location.search.includes("autostart=1") ||
      window.location.search.includes("guest=1") ||
      localStorage.getItem("guest_mode") === "true";
    if (isAutostart) {
      localStorage.setItem("guest_mode", "true");
      return { user: { uid: "guest_player", email: "guest@capitalfortune.local" } };
    }
    const user = await new Promise((resolve) => {
      if (auth.currentUser) return resolve(auth.currentUser);
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 2000);
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(u);
      });
    });
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: AppShell,
});
