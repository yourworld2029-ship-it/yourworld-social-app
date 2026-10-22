import { supabase } from "@/integrations/supabase/client";

export type VideoReaction = "like" | "dislike" | "none";

export type VideoReactionState = {
  likeCount: number;
  dislikeCount: number;
  liked: boolean;
  disliked: boolean;
};

type RpcResponse = {
  data: unknown;
  error: { message?: string } | null;
};

type ReactionRpcClient = {
  rpc(
    functionName: string,
    args: Record<string, string>,
  ): PromiseLike<RpcResponse>;
};

const reactionRpc = supabase as unknown as ReactionRpcClient;

function normalizeReactionState(data: unknown): VideoReactionState {
  const payload = (Array.isArray(data) ? data[0] : data) as
    | Record<string, unknown>
    | null;

  const count = (value: unknown) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
  };

  return {
    likeCount: count(payload?.likeCount),
    dislikeCount: count(payload?.dislikeCount),
    liked: payload?.liked === true,
    disliked: payload?.disliked === true,
  };
}

async function callReactionRpc(
  functionName: string,
  args: Record<string, string>,
): Promise<VideoReactionState> {
  const { data, error } = await reactionRpc.rpc(functionName, args);
  if (error) {
    throw new Error(error.message || "Unable to update video reaction.");
  }

  return normalizeReactionState(data);
}

export function getVideoReactionState(postId: string) {
  return callReactionRpc("get_video_reaction_state", {
    p_post_id: postId,
  });
}

export function setVideoReaction(postId: string, reaction: VideoReaction) {
  return callReactionRpc("set_video_reaction", {
    p_post_id: postId,
    p_reaction: reaction,
  });
}
