import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Keep direct reel detail links compatible with the full-screen reel player.
 * The player owns loading, not-found handling, and focus behavior on /reels.
 */
export const Route = createFileRoute("/reel/$reelId")({
  beforeLoad: ({ params }) => {
    const reelId = typeof params.reelId === "string" ? params.reelId.trim() : "";
    throw redirect({
      to: "/reels",
      search: {
        reelId: reelId || undefined,
        userId: undefined,
        initialVideoId: undefined,
        returnTo: undefined,
      },
    });
  },
  component: () => null,
});