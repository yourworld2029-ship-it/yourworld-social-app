/** Missing access metadata is legacy public media; explicit restrictions win. */
export function canReadPublicVideoPreview(post: unknown) {
  const metadata = post as {
    video_access?: string | null; is_paid?: boolean | null; price?: number | null;
    audience?: string | null;
  } | null | undefined;
  const access = metadata?.video_access?.toLowerCase();
  return (!access || access === "public") && metadata?.is_paid !== true &&
    !(typeof metadata?.price === "number" && Number.isFinite(metadata.price) && metadata.price > 0) &&
    metadata?.audience !== "close_friends";
}