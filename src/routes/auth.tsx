import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/local-auth";

export const Route = createFileRoute("/auth")({ component: LocalGameEntry });

function LocalGameEntry() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then(() => {
        if (active) navigate({ to: "/home", replace: true });
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "Unable to open the local save.");
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <h1 className="text-lg font-semibold">Preparing your local game</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Opening the save stored on this device. No account or internet connection is required.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
