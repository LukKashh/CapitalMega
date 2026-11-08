import { createFileRoute } from "@tanstack/react-router";
import { AssetInspectView } from "@/components/game/AssetInspectView";

export const Route = createFileRoute("/_authenticated/markets_/$market/$sym")({
  head: () => ({
    meta: [
      { title: "Asset — Capitalfortune" },
      { name: "description", content: "Asset profile, chart and trading." },
      { property: "og:title", content: "Asset — Capitalfortune" },
      { property: "og:description", content: "Asset profile, chart and trading." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssetPageRoute,
});

function AssetPageRoute() {
  const { market, sym } = Route.useParams();
  return <AssetInspectView market={market as "stock" | "crypto"} sym={sym} />;
}
