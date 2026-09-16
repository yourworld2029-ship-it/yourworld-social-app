import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YwAvatar } from "@/components/yw/Avatar";
import { Button } from "@/components/ui/button";
import { useFollowList, type FollowUser } from "@/lib/follow-data";
import { useYw } from "@/lib/yw-store";
import { SportsIdentityMark } from "@/components/yw/SportsIdentityBadge";

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  tab,
  onTabChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string | null;
  tab: "followers" | "following";
  onTabChange: (t: "followers" | "following") => void;
}) {
  const [value, setValue] = useState(tab);
  useEffect(() => setValue(tab), [tab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="font-display">Connections</DialogTitle>
        </DialogHeader>
        <Tabs
          value={value}
          onValueChange={(v) => {
            setValue(v as "followers" | "following");
            onTabChange(v as "followers" | "following");
          }}
        >
          <TabsList className="mx-5 grid w-[calc(100%-2.5rem)] grid-cols-2 rounded-full">
            <TabsTrigger value="followers" className="rounded-full">
              Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-full">
              Following
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-0">
            <List userId={userId} kind="followers" open={open && value === "followers"} />
          </TabsContent>
          <TabsContent value="following" className="mt-0">
            <List userId={userId} kind="following" open={open && value === "following"} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function List({
  userId,
  kind,
  open,
}: {
  userId: string | null;
  kind: "followers" | "following";
  open: boolean;
}) {
  const { users, loading, error } = useFollowList(userId, kind, open);
  const { following, toggleFollow } = useYw();
  const navigate = useNavigate();

  if (loading)
    return (
      <ul className="space-y-2 px-5 py-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-12 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </ul>
    );

  if (error)
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        {error}
      </p>
    );
  if (!users.length)
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No connections yet.</p>;

  return (
    <ul className="max-h-[55vh] space-y-1 overflow-y-auto px-3 py-3">
      {users.map((u: FollowUser, i) => (
        <li
          key={u.id}
          className="animate-rise flex items-center gap-3 rounded-2xl px-2 py-2"
          style={{ animationDelay: `${i * 25}ms` }}
          role="button"
          tabIndex={0}
          onClick={() => void navigate({ to: "/u/$userId", params: { userId: u.id } })}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void navigate({ to: "/u/$userId", params: { userId: u.id } });
            }
          }}
        >
          <YwAvatar
            user={{ id: u.id, username: u.username, name: u.display_name, hue: 280 }}
            size={40}
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 truncate text-sm font-medium">
              <span className="truncate">{u.display_name}</span>
              <SportsIdentityMark userId={u.id} />
            </span>
            <span className="block truncate text-xs text-muted-foreground">@{u.username}</span>
          </span>
          <Button
            size="sm"
            variant={following[u.id] ? "secondary" : "default"}
            className="h-8 shrink-0 rounded-full px-4 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              void toggleFollow(u.id);
            }}
          >
            {following[u.id] ? "Following" : "Follow"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
