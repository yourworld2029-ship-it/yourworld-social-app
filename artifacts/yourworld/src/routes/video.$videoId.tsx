import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { loadLongVideosByIds, resolveLongVideoUrl, type LongVideo } from "@/lib/video-data";
import { isPlayableMediaUrl } from "@/lib/video-playback-engine";
import { useVideoPlayback } from "@/lib/video-playback";
import { consumeVideoResumeRequest } from "@/lib/video-resume";

type VideoRouteData = {
  video: LongVideo;
  url: string | null;
  locked: boolean;
};

function isRestrictedAudience(row: Record<string, unknown>) {
  if (row.is_private === true || row.is_followers_only === true || row.close_friends_only === true) {
    return true;
  }
  const restrictedAudiences = ["private", "close_friends", "friends", "followers", "only_me"];
  return [row.audience, row.privacy, row.visibility]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((audience) => audience.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .some((audience) => restrictedAudiences.includes(audience));
}

export const Route = createFileRoute("/video/$videoId")({
  component: VideoRouteComponent,
});

async function loadVideoForPlayback(videoId: string): Promise<VideoRouteData> {
  const video = (await loadLongVideosByIds([videoId]))[0];
  if (!video) throw new Error("Video is no longer available.");

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", video.id)
    .maybeSingle();
  if (postError) throw postError;
  if (!post) throw new Error("Video is no longer available.");
  const row = post as unknown as Record<string, unknown>;

  if (row.archived === true || row.is_hidden === true) {
    throw new Error("Video is no longer available.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  const isOwner = user?.id === video.userId;
  const requiresGrant =
    video.access !== "public" ||
    Number(video.price ?? 0) > 0 ||
    isRestrictedAudience(row);

  if (requiresGrant && !isOwner) {
    if (!user || isRestrictedAudience(row)) return { video, url: null, locked: true };
    const { data: grant, error: grantError } = await supabase
      .from("video_access_grants")
      .select("expires_at")
      .eq("post_id", video.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (grantError) throw grantError;

    const grantIsActive =
      !!grant &&
      (grant.expires_at === null ||
        (Number.isFinite(Date.parse(grant.expires_at)) &&
          Date.parse(grant.expires_at) > Date.now()));
    if (!grantIsActive) return { video, url: null, locked: true };
  }

  const url = await resolveLongVideoUrl(video.mediaUrl);
  if (!url || !isPlayableMediaUrl(url)) {
    throw new Error("The video source is not available.");
  }
  return { video, url, locked: false };
}

function VideoRouteComponent() {
  const { videoId } = Route.useParams();
  const navigate = useNavigate();
  const { activeVideo, activateVideo, closeVideo } = useVideoPlayback();
  const resumeTimeRef = useRef<number | null>(null);
  const validVideoId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  const query = useQuery({
    queryKey: ["long-video-playback", videoId],
    enabled: validVideoId,
    retry: false,
    queryFn: () => loadVideoForPlayback(videoId),
  });

  useEffect(() => {
    resumeTimeRef.current = consumeVideoResumeRequest(videoId);
  }, [videoId]);

  useEffect(() => {
    if (
      activeVideo &&
      (activeVideo.id !== videoId || query.isError || query.data?.locked)
    ) {
      closeVideo();
    }
  }, [activeVideo, closeVideo, query.data?.locked, query.isError, videoId]);

  useEffect(() => {
    const data = query.data;
    if (!data || data.locked || !data.url || data.video.id !== videoId) return;

    activateVideo({
      id: data.video.id,
      url: data.url,
      title: data.video.title,
      thumbnailUrl: data.video.thumbnailUrl,
      initialTime: resumeTimeRef.current ?? undefined,
    });
    resumeTimeRef.current = null;
  }, [activateVideo, query.data, videoId]);

  if (!validVideoId || query.isError || (query.isSuccess && !query.data)) {
    return (
      <RouteMessage
        title="This video isn’t available"
        description="It may have been removed or shared with a limited audience."
        onBack={() => {
          closeVideo();
          void navigate({ to: "/" });
        }}
        onRetry={validVideoId && query.isError ? () => void query.refetch() : undefined}
      />
    );
  }

  if (query.data?.locked) {
    return (
      <RouteMessage
        title="This video needs access"
        description="This video is limited to its intended audience or requires an active access grant."
        onBack={() => {
          closeVideo();
          void navigate({ to: "/" });
        }}
      />
    );
  }

  if (!query.data) {
    return (
      <div
        className="grid min-h-[40vh] place-items-center bg-black"
        role="status"
        aria-label="Loading video"
      >
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white/90"
        />
      </div>
    );
  }

  // The application-shell VideoPlaybackProvider owns and renders the persistent player.
  return null;
}

function RouteMessage({
  title,
  description,
  onBack,
  onRetry,
}: {
  title: string;
  description: string;
  onBack: () => void;
  onRetry?: () => void;
}) {
  return (
    <section
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white"
      role="alert"
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-white/70">{description}</p>
      <div className="flex items-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Try again
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
        >
          Back to feed
        </button>
      </div>
    </section>
  );
}