import { memo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Film, MessageSquare, User, Plus } from "lucide-react";
import { useUnreadMessageCount } from "@/lib/social-data";

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export const BottomNav = memo(function BottomNav({ onOpenCreate }: BottomNavProps) {
  const location = useLocation();
  const unreadMessages = useUnreadMessageCount();
  const isRouteActive = (route: string) =>
    location.pathname === route || location.pathname.startsWith(`${route}/`);
  const itemClass = (active: boolean) =>
    `flex min-w-0 flex-1 items-center justify-center rounded-lg py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  // Hide bottom nav completely when on /create route
  if (location.pathname === "/create") {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className="bottom-nav-safe-area fixed inset-x-0 bottom-0 z-40 isolate w-full border-t border-border/70 bg-background/95 px-1.5 pt-2 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-12 w-full max-w-md items-center justify-around">
        <Link
          to="/"
          aria-label="Home"
          aria-current={isRouteActive("/") ? "page" : undefined}
          className={itemClass(isRouteActive("/"))}
        >
          <Home className="size-6 max-h-6 max-w-6 shrink-0" aria-hidden="true" />
        </Link>

        <Link
          to="/reels"
          search={{ reelId: undefined, userId: undefined, initialVideoId: undefined, returnTo: undefined }}
          aria-label="Video"
          aria-current={isRouteActive("/reels") ? "page" : undefined}
          className={itemClass(isRouteActive("/reels"))}
        >
          <Film className="size-6 max-h-6 max-w-6 shrink-0" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={() => onOpenCreate?.()}
          aria-label="Open create menu"
          className={`${itemClass(false)} text-foreground`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border transition active:scale-95">
            <Plus className="size-6 max-h-6 max-w-6 shrink-0" aria-hidden="true" />
          </span>
        </button>

        <Link
          to="/chat"
          aria-label={unreadMessages > 0 ? `Chat, ${unreadMessages} unread` : "Chat"}
          aria-current={isRouteActive("/chat") ? "page" : undefined}
          className={itemClass(isRouteActive("/chat"))}
        >
          <span className="relative grid place-items-center">
            <MessageSquare className="size-6 max-h-6 max-w-6 shrink-0" aria-hidden="true" />
            {unreadMessages > 0 ? (
              <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-pink-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            ) : null}
          </span>
        </Link>

        <Link
          to="/profile"
          aria-label="Profile"
          aria-current={isRouteActive("/profile") ? "page" : undefined}
          className={itemClass(isRouteActive("/profile"))}
        >
          <User className="size-6 max-h-6 max-w-6 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
});
