import { Briefcase, Crown, Gem, Rocket, ShieldCheck, Star, UserCheck } from "lucide-react";
import { useGame, useAct, useNow } from "@/hooks/use-game";
import { ACHIEVEMENTS } from "@/game/achievements";
import { COLLECTIBLE_BY_ID } from "@/game/collectibles";
import { levelReward, netWorth, xpForLevel } from "@/game/engine";
import { date, money } from "@/lib/format";
import { Card, GameImg, Loading, Pill, Progress, Row } from "@/components/game/ui";
import { art, getPlayerTier } from "@/components/game/art";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AVATARS = {
  briefcase: Briefcase,
  crown: Crown,
  gem: Gem,
  rocket: Rocket,
  star: Star,
} as const;

export function ProfileView() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 30_000);
  const { run, pending } = useAct();
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (data) {
      setTitle(data.state.profile.title);
      setBio(data.state.profile.bio);
      setUsername(data.state.username);
    }
  }, [data]);

  if (!data) return <Loading />;
  const s = data.state;
  const Av = AVATARS[s.profile.avatar as keyof typeof AVATARS] ?? Briefcase;
  const tierInfo = getPlayerTier(s.level);
  const featured = s.profile.featured ? s.collectibles[s.profile.featured] : null;

  const titles = [
    "Aspiring Tycoon",
    "Entrepreneur",
    ...(s.level >= 10 ? ["Mogul"] : []),
    ...(s.level >= 25 ? ["Magnate"] : []),
    ...(Object.keys(s.achievements).length >= 50 ? ["Achiever"] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Profile Overview Card */}
      <Card className="border-primary/40 bg-card/90">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-primary-glow/80 bg-gradient-to-b from-primary/20 via-surface/60 to-card/90 p-1 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.45)]">
              <img
                src={tierInfo.badgePath}
                alt={`${tierInfo.tierName} badge`}
                className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
              />
            </div>
            <Av className="absolute -bottom-1 -right-1 h-5 w-5 rounded-md bg-primary text-primary-foreground p-0.5 shadow-md border border-background" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-lg font-bold text-foreground truncate">
              {s.username}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-primary">{s.profile.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 font-mono text-primary-glow">
                {tierInfo.tierName} · {tierInfo.romanSublevel}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Joined {date(s.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Player Level {s.level}</span>
            <span className="num font-semibold text-foreground">
              {Math.floor(s.xp)} / {xpForLevel(s.level)} XP
            </span>
          </div>
          <Progress value={(s.xp / xpForLevel(s.level)) * 100} className="h-2" />
        </div>

        {s.profile.bio && (
          <p className="mt-3 text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-2.5 py-0.5">
            "{s.profile.bio}"
          </p>
        )}
      </Card>

      {/* Empire Overview Stats */}
      <Card className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
          Empire Holdings Summary
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <Row label="Total Net Worth" value={money(netWorth(s, now).total)} />
          <Row label="Active Companies" value={Object.keys(s.companies).length} />
          <Row label="Real Estate Properties" value={Object.keys(s.properties).length} />
          <Row label="Luxury Collectibles" value={Object.keys(s.collectibles).length} />
          <Row
            label="Achievements"
            value={`${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}`}
          />
          <Row label="R&D Completed" value={s.research.done.length} />
        </div>
      </Card>

      {/* Profile Customization Card */}
      <Card className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5 flex items-center gap-1.5">
          <UserCheck className="h-4 w-4 text-primary" />
          Public Profile Customization
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-foreground">Avatar Emblem</div>
          <div className="flex gap-2">
            {Object.entries(AVATARS).map(([k, I]) => (
              <Button
                variant="ghost"
                size="sm"
                key={k}
                aria-label={k}
                onClick={() => run({ type: "setProfile", avatar: k })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                  s.profile.avatar === k
                    ? "border-primary bg-primary/20 text-primary-glow"
                    : "border-border text-muted-foreground"
                }`}
              >
                <I className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-foreground">Honorific Title</div>
          <Select
            value={titles.includes(title) ? title : titles[0]}
            onValueChange={(v) => {
              setTitle(v);
              void run({ type: "setProfile", title: v }, "Title updated");
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {titles.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-foreground">Bio Description</div>
          <Textarea
            placeholder="Write a brief bio..."
            value={bio}
            maxLength={280}
            onChange={(e) => setBio(e.target.value)}
            className="text-xs min-h-[70px]"
          />
          <Button
            size="sm"
            className="w-full text-xs h-8 bg-gradient-primary"
            disabled={pending}
            onClick={() => run({ type: "setProfile", bio }, "Profile saved")}
          >
            Save Description
          </Button>
        </div>

        <div className="space-y-1 pt-2 border-t border-border/60">
          <div className="text-xs font-medium text-foreground">Tycoon Username</div>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="h-8 text-xs flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={pending || username === s.username || username.length < 3}
              onClick={() => run({ type: "setProfile", username }, "Username changed")}
            >
              Rename
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
