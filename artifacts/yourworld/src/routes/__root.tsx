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
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
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
import { EarningsCreditWatcher } from "@/lib/earnings-credit";
import { SafeProvider } from "@/lib/safe-provider";
import { AdaptiveMediaController } from "@/lib/adaptive-performance";
import { VideoPlaybackProvider } from "@/lib/video-playback";

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
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [isPlatformResolved, setIsPlatformResolved] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const isWatchPreview = pathname.startsWith("/watch/");
  const hideNav = isWatchPreview || pathname.startsWith("/auth") || pathname.startsWith("/verify-2fa") || pathname.startsWith("/create") || pathname.startsWith("/moment/create") || pathname.startsWith("/channel/create");
  const wideProfileLayout = pathname === "/profile";

  useEffect(() => {
    const environment = detectCapacitorEnvironment();
    setIsNativeApp(environment.isNative);
    setIsPlatformResolved(true);
    if (!environment.isAndroid) return;

    void (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#000000" });
        await StatusBar.show();
      } catch (error) {
        console.error("[nativeStatusBar] configuration failed", error);
      }
    })();
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

  if (!isNativeApp && !isWatchPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold">YourWorld Android app</h1>
          <p className="mt-2 text-sm text-white/70">
            YourWorld is available only in the installed Android app.
          </p>
          <a
            href="/download-apk"
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
        <AdaptiveMediaController />
        <AuthProvider>
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
                                       {!isWatchPreview && <DownloadBanner />}
                                      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                                      <AuthGate>
                                        <div className={cn("mx-auto min-h-screen w-full", isWatchPreview ? "max-w-5xl" : wideProfileLayout ? "max-w-4xl" : "max-w-lg", hideNav ? "" : "pb-20")}>
                                          <Outlet />
                                        </div>
                                        {!hideNav && <BottomNav onOpenCreate={() => setCreateOpen(true)} />}
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
    </QueryClientProvider>
  );
}
