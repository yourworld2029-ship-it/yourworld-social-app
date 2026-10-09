import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Film, PlusSquare, MessageSquare, User } from "lucide-react";
import { useUnreadMessageCount } from "@/lib/social-data";

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export const BottomNav = memo(function BottomNav({ onOpenCreate }: BottomNavProps) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const unreadChatCount = useUnreadMessageCount();
  const chatLabel =
    unreadChatCount > 0
      ? `Chat, ${unreadChatCount} unread ${unreadChatCount === 1 ? "message" : "messages"}`
      : "Chat";

  return (
    <nav 
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-neutral-900 select-none pointer-events-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
    >
      <div className="flex w-full items-center justify-around h-14 max-w-md mx-auto px-2">
        <Link
          to="/"
          aria-label="Home"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath === "/" ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Home className="size-6 shrink-0 stroke-[1.8]" />
        </Link>

        <Link
          to="/reels"
          aria-label="Reels"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/reels") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Film className="size-6 shrink-0 stroke-[1.8]" />
        </Link>

        <button
          type="button"
          onClick={onOpenCreate}
          aria-label="Create"
          className="flex-1 flex flex-col items-center justify-center py-1 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <PlusSquare className="size-6 shrink-0 stroke-[1.8]" />
        </button>

        <Link
          to="/chat"
          aria-label={chatLabel}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/chat") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span className="relative inline-flex">
            <MessageSquare className="size-6 shrink-0 stroke-[1.8]" />
            {unreadChatCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pink-600 px-1 text-[9px] font-bold leading-none text-white shadow ring-2 ring-black"
              >
                {unreadChatCount > 99 ? "99+" : unreadChatCount}
              </span>
            ) : null}
          </span>
        </Link>

        <Link
          to="/profile"
          aria-label="Profile"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/profile") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <User className="size-6 shrink-0 stroke-[1.8]" />
        </Link>
      </div>
    </nav>
  );
});
