import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { ShareWatchPreview } from "@/components/yw/ShareWatchPreview";
import { isPublishedLongVideoRow } from "@/lib/long-video-utils";
import { resolveLongVideoUrl } from "@/lib/video-data";
import { resolveMediaUrl } from "@/lib/social-data";
import { supabase } from "@/integrations/supabase/client";
import { APK_DOWNLOAD_PATH, type WatchContentKind } from "@/lib/watch-links";

type PublicWatchContent = {
  id: string;
  kind: WatchContentKind;
  title: string;
  creatorName: string;
  creatorHandle: string | null;
  description: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  locked: boolean;
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRestrictedAudience(row: Record<string, unknown>) {
  if (row.is_private === true || row.is_followers_only === true || row.close_friends_only === true) {
    return true;
  }
  const restrictedAudiences = ["private", "close_friends", "friends", "followers", "only_me"];
  return [row.audience, row.privacy, row.visibility]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .some((audience) => restrictedAudiences.includes(audience));
}

async function loadPublicWatchContent(id: string, hintedKind?: WatchContentKind) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Record<string, unknown>;
  const rawKind = String(row.kind ?? row.media_type ?? row.post_type ?? "").toLowerCase();
  const isReel = rawKind === "reel" || row.is_reel === true;
  const kind: WatchContentKind = isReel ? "reel" : "video";
  if (hintedKind && hintedKind !== kind) return null;
  if (isRestrictedAudience(row) || row.archived === true || row.is_hidden === true) return null;

  if (isReel) {
    const status = String(row.status ?? "").toLowerCase();
    const reviewStatus = String(row.review_status ?? "").toLowerCase();
    if (status && !["published", "approved", "active"].includes(status)) return null;
    if (reviewStatus && !["published", "approved", "accepted"].includes(reviewStatus)) return null;
  } else if (!isPublishedLongVideoRow(row)) {
    return null;
  }

  const access = String(row.video_access ?? "").toLowerCase();
  const price = Number(row.price ?? 0);
  const locked =
    row.is_paid === true ||
    access === "paid" ||
    access === "vip" ||
    (Number.isFinite(price) && price > 0);

  const rawMediaUrl =
    asString(row.media_url) ??
    asString(row.video_url) ??
    asString(row.url);
  const mediaUrl = locked || !rawMediaUrl
    ? ""
    : isReel
      ? await resolveMediaUrl(rawMediaUrl, "videos")
      : await resolveLongVideoUrl(rawMediaUrl);
  if (!locked && !mediaUrl) return null;

  const thumbnailSource = asString(row.thumbnail_url) ?? asString(row.poster_url);
  const thumbnailUrl = thumbnailSource
    ? await resolveMediaUrl(thumbnailSource, "thumbnails").catch(() => thumbnailSource)
    : null;

  let profile: Record<string, unknown> | null = null;
  const userId = asString(row.user_id);
  if (userId) {
    try {
      const { data: profiles } = await supabase.rpc("get_public_profiles", { ids: [userId] });
      profile = ((profiles ?? []) as Record<string, unknown>[])[0] ?? null;
    } catch (error) {
      console.warn("Unable to load shared video creator", error);
    }
  }

  const title = asString(row.title) ?? asString(row.caption) ?? "YourWorld video";
  const creatorName =
    asString(profile?.full_name) ??
    asString(profile?.display_name) ??
    asString(profile?.username) ??
    "YourWorld creator";

  return {
    id,
    kind,
    title,
    creatorName,
    creatorHandle: asString(profile?.username),
    description: asString(row.caption),
    mediaUrl,
    thumbnailUrl,
    locked,
  } satisfies PublicWatchContent;
}

export const Route = createFileRoute("/watch/$contentId")({
  validateSearch: (search: Record<string, unknown>) => {
    const type: WatchContentKind | undefined =
      search.type === "video" ? "video" : search.type === "reel" ? "reel" : undefined;
    return { type };
  },
  component: WatchPreviewPage,
  head: () => ({
    meta: [
      { title: "Watch on YourWorld" },
      { name: "description", content: "Watch this video from YourWorld." },
      { property: "og:title", content: "Watch on YourWorld" },
      { property: "og:description", content: "Watch this video from YourWorld." },
      { property: "og:type", content: "video.other" },
    ],
  }),
});

function WatchPreviewPage() {
  const { contentId } = Route.useParams();
  const { type } = Route.useSearch();
  const isValidContentId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId);
  const { data, isPending, isError } = useQuery<PublicWatchContent | null>({
    queryKey: ["public-watch-content", contentId, type],
    enabled: isValidContentId,
    retry: false,
    queryFn: () => loadPublicWatchContent(contentId, type),
  });

  useEffect(() => {
    if (data?.title) document.title = `${data.title} — YourWorld`;
  }, [data?.title]);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-[80] border-b border-white/10 bg-black/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="min-w-0 text-sm font-semibold text-white sm:text-base">
            Watch in HD on YourWorld App
          </p>
          <a
            href={APK_DOWNLOAD_PATH}
            download
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-fuchsia-300 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-fuchsia-200 sm:text-sm"
            data-testid="link-sticky-apk-download"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download APK
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl justify-center px-3 py-6 sm:px-6 sm:py-10">
        {isValidContentId && isPending ? (
          <div className="w-full max-w-3xl animate-pulse rounded-3xl border border-white/10 bg-[#0b0c10] p-8 text-sm text-zinc-400">
            Loading shared video…
          </div>
        ) : !isValidContentId || isError || !data ? (
          <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0c10] p-7 text-center">
            <h1 className="text-xl font-bold text-white">This video isn’t available</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              It may have been removed or shared with a limited audience.
            </p>
            <a
              href={APK_DOWNLOAD_PATH}
              download
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-fuchsia-300 px-5 py-3 text-sm font-bold text-black hover:bg-fuchsia-200"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download YourWorld
            </a>
          </section>
        ) : data.locked ? (
          <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0c10] p-7 text-center">
            <h1 className="text-xl font-bold text-white">{data.title}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              This video is available in the YourWorld app.
            </p>
            <a
              href={APK_DOWNLOAD_PATH}
              download
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-fuchsia-300 px-5 py-3 text-sm font-bold text-black hover:bg-fuchsia-200"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download YourWorld
            </a>
          </section>
        ) : (
          <ShareWatchPreview
            mediaUrl={data.mediaUrl}
            title={data.title}
            creatorName={data.creatorName}
            creatorHandle={data.creatorHandle}
            description={data.description}
            posterUrl={data.thumbnailUrl}
            apkUrl={APK_DOWNLOAD_PATH}
            className="max-w-3xl"
          />
        )}
      </main>
    </div>
  );
}