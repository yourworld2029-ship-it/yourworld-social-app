import { Link, useLocation } from "@tanstack/react-router";
import { Home, Film, MessageSquare, User, Plus } from "lucide-react";
import { useUnreadMessageCount } from "@/lib/social-data";

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export function BottomNav({ onOpenCreate }: BottomNavProps) {
  const location = useLocation();
  const unreadMessages = useUnreadMessageCount();

  // Hide bottom nav completely when on /create route
  if (location.pathname === "/create") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/90 px-4 py-2 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <Link to="/" className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/reels"
          search={{ reelId: undefined, userId: undefined, initialVideoId: undefined, returnTo: undefined }}
          className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Film className="w-5 h-5" />
          <span>Video</span>
        </Link>

        <button
          onClick={() => onOpenCreate?.()}
          aria-label="Open create menu"
          className="w-12 h-12 -mt-5 bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-400 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <Link
          to="/chat"
          aria-label={unreadMessages > 0 ? `Chat, ${unreadMessages} unread` : "Chat"}
          className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <span className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadMessages > 0 ? (
              <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-pink-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            ) : null}
          </span>
          <span>Chat</span>
        </Link>

        <Link to="/profile" className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}
