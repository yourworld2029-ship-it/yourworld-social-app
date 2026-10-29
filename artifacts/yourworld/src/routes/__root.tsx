import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { cn } from "@/lib/utils";
import { parseWatchShareUrl } from "@/lib/watch-links";

import appCss from "../styles.css?url";
import { BottomNav } from "@/components/yw/BottomNav";
import { CreateSheet } from "@/components/yw/CreateSheet";
import { YwStoreProvider } from "@/lib/yw-store";
import { NotificationsProvider } from "@/lib/notifications-store";
import { MomentProvider } from "@/lib/moment-store";
import { AuthProvider, AuthGate } from "@/lib/auth-store";
import { SearchProvider } from "@/lib/search-store";
import { ChannelProvider } from "@/lib/channel-store";
import { CallProvider } from "@/lib/call-store";
import { UploadProvider } from "@/lib/upload-progress";
import { Toaster } from "@/components/ui/sonner";
import { DownloadBanner } from "@/components/yw/DownloadBanner";
import { DailyUsageTracker } from "@/components/yw/DailyUsageTracker";
import { EarningsCreditWatcher } from "@/lib/earnings-credit";
import { SafeProvider } from "@/lib/safe-provider";
import { AdaptiveMediaController } from "@/lib/adaptive-performance";
import { VideoPlaybackProvider } from "@/lib/video-playback";
import { MediaConcurrencyProvider } from "@/lib/media-concurrency";
import { APP_SCROLL_RESTORATION_ID } from "@/lib/app-scroll-container";
import { resolveTabSwipeDestination } from "@/lib/tab-swipe";
import { resolveNotificationDestination } from "@/lib/notification-routing";
import {
  addAndroidNotificationActionListener,
  consumeAndroidNotificationAction,
  type AppNotificationAction,
} from "@/lib/call-push-native";
import { dmThreadId } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[RootErrorBoundary]", error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or heading back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
      { title: "YourWorld — Share your world" },
      {
        name: "description",
        content: "YourWorld (YW) is a social app for moments, feeds and full-screen reels.",
      },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "YourWorld — Share your world" },
      {
        property: "og:description",
        content: "Moments, feed and full-screen reels in one dark, fast social app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://mvvliwuldgcmrqffrfgi.supabase.co" },
      { rel: "dns-prefetch", href: "https://mvvliwuldgcmrqffrfgi.supabase.co" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" data-theme="midnight">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type CapacitorRuntimeGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  platform?: string;
};

function detectCapacitorEnvironment() {
  if (typeof window === "undefined") {
    return { isNative: false, isAndroid: false };
  }

  // Capacitor core also installs window.Capacitor in browsers, so use its
  // native/platform signals rather than the global's presence alone.
  const runtime = (window as Window & { Capacitor?: CapacitorRuntimeGlobal }).Capacitor;
  let platform = "";
  try {
    platform =
      runtime?.getPlatform?.() ??
      runtime?.platform ??
      Capacitor.getPlatform();
  } catch {
    platform = runtime?.platform ?? "";
  }

  let isNative = platform !== "" && platform !== "web";
  try {
    isNative =
      isNative ||
      Capacitor.isNativePlatform() ||
      runtime?.isNativePlatform?.() === true;
  } catch {
    // Keep any concrete platform signal if a bridge method is unavailable.
  }

  return { isNative, isAndroid: isNative && platform === "android" };
}

function shouldIgnoreTabSwipeTarget(
  target: EventTarget | null,
  boundary: HTMLElement,
) {
  if (!(target instanceof Element)) return true;
  if (
    target.closest(
      "button, input, textarea, select, video, audio, [contenteditable='true'], [role='slider'], [role='dialog'], [data-radix-popper-content-wrapper], [data-tab-swipe-ignore='true']",
    )
  ) {
    return true;
  }

  let element: HTMLElement | null =
    target instanceof HTMLElement ? target : target.parentElement;
  while (element && boundary.contains(element)) {
    const overflowX = window.getComputedStyle(element).overflowX;
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      element.scrollWidth > element.clientWidth + 1
    ) {
      return true;
    }
    if (element === boundary) break;
    element = element.parentElement;
  }

  return false;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tabSwipeStart = useRef<{
    x: number;
    y: number;
    pathname: string;
  } | null>(null);
  const handledNotificationTap = useRef<{ key: string; at: number } | null>(null);
  const handleTabSwipeStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      const isSwipeTab =
        pathname === "/" || pathname === "/chat" || pathname === "/chat/";
      if (
        !isSwipeTab ||
        event.touches.length !== 1 ||
        !touch ||
        shouldIgnoreTabSwipeTarget(event.target, event.currentTarget)
      ) {
        tabSwipeStart.current = null;
        return;
      }

      tabSwipeStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        pathname,
      };
    },
    [pathname],
  );
  const handleTabSwipeEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const start = tabSwipeStart.current;
      tabSwipeStart.current = null;
      const touch = event.changedTouches[0];
      if (!start || !touch) return;

      const destination = resolveTabSwipeDestination(
        start.pathname,
        touch.clientX - start.x,
        touch.clientY - start.y,
      );
      if (destination === "/chat") {
        void navigate({ to: "/chat" });
      } else if (destination === "/") {
        void navigate({ to: "/" });
      }
    },
    [navigate],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const openCreate = useCallback(() => setCreateOpen(true), []);
  const [isPlatformResolved, setIsPlatformResolved] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const isWatchPreview = pathname.startsWith("/watch/");
  const isPublicPolicyPage =
    pathname === "/privacy" || pathname === "/delete-account";
  const isChatList = pathname === "/chat" || pathname === "/chat/";
  const isChatConversation = pathname.startsWith("/chat/") && !isChatList;
  const isMomentViewer =
    pathname.startsWith("/moment/") &&
    pathname !== "/moment/" &&
    pathname !== "/moment/create";
  const hideNav =
    isWatchPreview ||
    isPublicPolicyPage ||
    isChatConversation ||
    isMomentViewer ||
    pathname.startsWith("/live") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-2fa") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/moment/create") ||
    pathname.startsWith("/channel/create");
  const wideProfileLayout = pathname === "/profile";

  useEffect(() => {
    const environment = detectCapacitorEnvironment();
    setIsNativeApp(environment.isNative);
    setIsPlatformResolved(true);
    document.documentElement.dataset.ywNativeApp = environment.isNative ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.ywNativeApp;
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    const openWatchLink = (url: string) => {
      const destination = parseWatchShareUrl(url);
      if (!destination) return;

      if (destination.kind === "reel") {
        void navigate({
          to: "/reels",
          search: {
            reelId: undefined,
            userId: undefined,
            initialVideoId: destination.id,
            focusComments: undefined,
            returnTo: undefined,
          },
        });
      } else {
        void navigate({
          to: "/video/$videoId",
          params: { videoId: destination.id },
        });
      }
    };

    void (async () => {
      const listener = await App.addListener("appUrlOpen", ({ url }) => openWatchLink(url));
      if (disposed) {
        await listener.remove();
        return;
      }
      removeListener = () => listener.remove();
      const launch = await App.getLaunchUrl();
      if (!disposed && launch?.url) openWatchLink(launch.url);
    })().catch((error) => {
      console.error("[appLinks] unable to register incoming link handler", error);
    });

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [navigate]);

  useEffect(() => {
    const isAndroidNative =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
    let disposed = false;
    let removeNativeListener: (() => void) | undefined;
    const openNotificationDestination = async (action: AppNotificationAction) => {
      if (!action || typeof action.kind !== "string") return;
      const key = action.messageId || action.url || action.conversationId || action.kind;
      const now = Date.now();
      const last = handledNotificationTap.current;
      if (last?.key === key && now - last.at < 1800) return;
      handledNotificationTap.current = { key, at: now };

      let destination = resolveNotificationDestination(action.url);
      if (!destination && action.kind === "message" && action.senderId) {
        const { data } = await supabase.auth.getSession();
        const currentUserId = data.session?.user.id;
        if (currentUserId && currentUserId !== action.senderId) {
          destination = {
            kind: "chat",
            threadId: dmThreadId(currentUserId, action.senderId),
          };
        }
      }
      if (disposed || !destination) return;

      switch (destination.kind) {
        case "chat":
          void navigate({ to: "/chat/$threadId", params: { threadId: destination.threadId } });
          break;
        case "video":
          void navigate({
            to: "/video/$videoId",
            params: { videoId: destination.videoId },
            search: {
              focusComments: destination.focusComments,
              commentId: destination.commentId,
            },
          });
          break;
        case "reels":
          void navigate({
            to: "/reels",
            search: {
              initialVideoId: destination.initialVideoId,
              focusComments: destination.focusComments,
              commentId: destination.commentId,
            },
          });
          break;
        case "profile":
          void navigate({ to: "/u/$userId", params: { userId: destination.userId } });
          break;
        case "moment":
          void navigate({ to: "/moment/$momentId", params: { momentId: destination.momentId } });
          break;
        case "notifications":
          void navigate({ to: "/notifications" });
          break;
      }
    };
    const onServiceWorkerMessage = (event: MessageEvent) => {
      const action = event.data;
      if (action?.type !== "app-notification-click") return;
      void openNotificationDestination({
        kind: typeof action.kind === "string" ? action.kind : "message",
        url: typeof action.url === "string" ? action.url : "/",
        senderId: typeof action.senderId === "string" ? action.senderId : undefined,
        conversationId:
          typeof action.conversationId === "string" ? action.conversationId : undefined,
        messageId: typeof action.messageId === "string" ? action.messageId : undefined,
      });
    };
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);

    if (isAndroidNative) {
      void addAndroidNotificationActionListener((action) => {
        void consumeAndroidNotificationAction().catch(() => null);
        void openNotificationDestination(action);
      }).then((listener) => {
        if (!listener) return;
        if (disposed) {
          void listener.remove();
        } else {
          removeNativeListener = () => void listener.remove();
        }
      }).catch((error) => {
        console.error("[notification-routing] native listener registration failed", error);
      });
      void consumeAndroidNotificationAction()
        .then((action) => {
          if (action) void openNotificationDestination(action);
        })
        .catch((error) => {
          console.error("[notification-routing] pending notification action failed", error);
        });
    }

    return () => {
      disposed = true;
      removeNativeListener?.();
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, [navigate]);

  useEffect(() => {
    setCreateOpen(false);
    toast.dismiss();
  }, [pathname]);

  // Catch unhandled errors / promise rejections so they don't silently
  // crash the app on mobile devices.
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      console.error("[globalError]", e.message, e.filename, e.lineno);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error("[unhandledRejection]", e.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!isPlatformResolved && !isWatchPreview) {
    return null;
  }

  if (!isNativeApp && !isWatchPreview && !isPublicPolicyPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">YourWorld Android app</h1>
          <p className="mt-2 text-sm text-white/70">
            YourWorld is available only in the installed Android app.
          </p>
          <a
            href="/app.apk"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-purple-300/30 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(168,85,247,0.55)] transition hover:brightness-110 hover:shadow-[0_0_34px_rgba(168,85,247,0.72)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Download APK (Android)
          </a>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MediaConcurrencyProvider>
        <AdaptiveMediaController />
        <AuthProvider>
        <DailyUsageTracker />
        <SafeProvider name="YwStore">
          <YwStoreProvider>
            <SafeProvider name="Notifications">
              <NotificationsProvider>
                <SafeProvider name="Moments">
                  <MomentProvider>
                    <SafeProvider name="Search">
                      <SearchProvider>
                        <SafeProvider name="Channel">
                          <ChannelProvider>
                            <SafeProvider name="Call">
                              <CallProvider>
                                <SafeProvider name="Upload">
                                  <UploadProvider>
                                    <VideoPlaybackProvider>
                                        {!isWatchPreview && !isPublicPolicyPage && <DownloadBanner />}
                                      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                                      <AuthGate>
                                        <div
                                          className={cn(
                                            "yw-app-scroll-container mx-auto w-full overflow-x-hidden overflow-y-auto overscroll-y-contain",
                                            isWatchPreview ? "max-w-5xl" : wideProfileLayout ? "max-w-4xl" : "max-w-lg",
                                            hideNav ? "" : "pb-20",
                                          )}
                                          data-scroll-restoration-id={APP_SCROLL_RESTORATION_ID}
                                          onTouchStart={handleTabSwipeStart}
                                          onTouchEnd={handleTabSwipeEnd}
                                          onTouchCancel={() => {
                                            tabSwipeStart.current = null;
                                          }}
                                        >
                                          <Outlet />
                                        </div>
                                        {!hideNav && <BottomNav onOpenCreate={openCreate} />}
                                        <CreateSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
                                      </AuthGate>
                                    </VideoPlaybackProvider>
                                    <EarningsCreditWatcher />
                                    <Toaster position="top-center" />
                                  </UploadProvider>
                                </SafeProvider>
                              </CallProvider>
                            </SafeProvider>
                          </ChannelProvider>
                        </SafeProvider>
                      </SearchProvider>
                    </SafeProvider>
                  </MomentProvider>
                </SafeProvider>
              </NotificationsProvider>
            </SafeProvider>
          </YwStoreProvider>
        </SafeProvider>
        </AuthProvider>
      </MediaConcurrencyProvider>
    </QueryClientProvider>
  );
}
