import { memo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Film, PlusSquare, MessageSquare, User } from "lucide-react";
import { useUnreadMessageCount } from "@/lib/social-data";
import { useAppLanguage } from "@/lib/app-language";

interface BottomNavProps {
  onOpenCreate?: () => void;
}

export const BottomNav = memo(function BottomNav({ onOpenCreate }: BottomNavProps) {
  const { pathname: currentPath } = useLocation();
  const unreadChatCount = useUnreadMessageCount();
  const { t } = useAppLanguage();
  const chatLabel =
    unreadChatCount > 0
      ? `${t("navChat")}, ${unreadChatCount} ${
          unreadChatCount === 1 ? t("unreadMessage") : t("unreadMessages")
        }`
      : t("navChat");

  return (
    <nav 
      aria-label={t("mainNavigation")}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-neutral-900 select-none pointer-events-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
    >
      <div className="flex w-full items-center justify-around h-14 max-w-md mx-auto px-2">
        <Link
          to="/"
          aria-label={t("navHome")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath === "/" ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Home className="size-6 shrink-0 stroke-[1.8]" />
          <span className="text-[9px] leading-none">{t("navHome")}</span>
        </Link>

        <Link
          to="/reels"
          aria-label={t("navReels")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/reels") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Film className="size-6 shrink-0 stroke-[1.8]" />
          <span className="text-[9px] leading-none">{t("navReels")}</span>
        </Link>

        <button
          type="button"
          onClick={onOpenCreate}
          aria-label={t("navCreate")}
          className="flex-1 flex flex-col items-center justify-center py-1 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <PlusSquare className="size-6 shrink-0 stroke-[1.8]" />
          <span className="text-[9px] leading-none">{t("navCreate")}</span>
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
          <span className="text-[9px] leading-none">{t("navChat")}</span>
        </Link>

        <Link
          to="/profile"
          aria-label={t("navProfile")}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentPath.startsWith("/profile") ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <User className="size-6 shrink-0 stroke-[1.8]" />
          <span className="text-[9px] leading-none">{t("navProfile")}</span>
        </Link>
      </div>
    </nav>
  );
});
