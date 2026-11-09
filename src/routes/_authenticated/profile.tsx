import { createFileRoute } from "@tanstack/react-router";
import { AccountManagerMenu } from "@/components/game/AccountManagerMenu";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Account Manager — Capitalfortune" },
      {
        name: "description",
        content: "Account management, profile settings, and achievements.",
      },
      { property: "og:title", content: "Account Manager — Capitalfortune" },
      {
        property: "og:description",
        content: "Account management, profile settings, and achievements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="flex-1 overflow-y-auto px-1 py-2">
      <AccountManagerMenu />
    </div>
  );
}
