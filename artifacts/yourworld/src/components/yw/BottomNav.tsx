import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Film, PlusSquare, MessageSquare, User } from "lucide-react";

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export const BottomNav = memo(function BottomNav({ onOpenCreate }: BottomNavProps) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav 
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-neutral-900 select-none pointer-events-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
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
          aria-label="Chat"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/chat") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <MessageSquare className="size-6 shrink-0 stroke-[1.8]" />
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
