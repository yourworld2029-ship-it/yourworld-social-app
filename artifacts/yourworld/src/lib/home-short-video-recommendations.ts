import { VIDEO_CATEGORIES, type LongVideo } from "./video-data";

export const HOME_SHORTS_INTERVAL = 6;
export const HOME_SHORTS_SHELF_BATCH_SIZE = 8;

const EPISODE_PATTERN = /\b(part|pt|episode|ep)\s*\.?\s*#?\s*(\d+)\b/i;
const IGNORED_TOPICS = new Set([
  "episode",
  "ep",
  "fyp",
  "part",
  "pt",
  "reel",
  "reels",
  "short",
  "shorts",
  "trending",
  "video",
  "videos",
  "viral",
]);

function normalizeTopic(value: string) {
  return value
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getVideoTopics(video: LongVideo) {
  const topics = new Set<string>();
  const addTopic = (value: string) => {
    const topic = normalizeTopic(value);
    if (topic && !IGNORED_TOPICS.has(topic)) topics.add(topic);
  };

  for (const tag of video.hashtags ?? []) addTopic(tag);

  const text = `${video.title} ${video.caption}`;
  for (const hashtag of text.match(/#[\p{L}\p{N}_-]+/gu) ?? []) {
    addTopic(hashtag);
  }

  const normalizedText = ` ${normalizeTopic(text)} `;
  for (const category of VIDEO_CATEGORIES) {
    const topic = normalizeTopic(category);
    if (topic && normalizedText.includes(` ${topic} `)) addTopic(topic);
  }

  return topics;
}

function episodeNumber(video: LongVideo) {
  const explicit = video.episodeNumber?.trim() ?? "";
  const explicitMatch = explicit.match(EPISODE_PATTERN);
  if (explicitMatch) return Number(explicitMatch[2]);

  const titleMatch = video.title.match(EPISODE_PATTERN);
  if (titleMatch) return Number(titleMatch[2]);

  const numericEpisode = explicit.match(/^\d+$/);
  return numericEpisode ? Number(numericEpisode[0]) : null;
}

function seriesKey(video: LongVideo) {
  const explicitSeries = video.seriesTitle?.trim();
  const normalizedExplicitSeries = explicitSeries ? normalizeTopic(explicitSeries) : "";
  if (normalizedExplicitSeries) return normalizedExplicitSeries;

  const marker = EPISODE_PATTERN.exec(video.title);
  const explicitNumber = video.episodeNumber?.trim();
  if (!marker && !explicitNumber) return null;

  if (!marker) return normalizeTopic(video.title);

  const before = video.title
    .slice(0, marker.index)
    .replace(/[\s|:·–—-]+$/g, "")
    .trim();
  const after = video.title
    .slice(marker.index + marker[0].length)
    .replace(/^[\s|:·–—-]+/g, "")
    .trim();
  return normalizeTopic(before || after) || null;
}

export function getHomeShortVideoSeriesBadge(video: LongVideo) {
  const explicit = video.episodeNumber?.trim() ?? "";
  const match = explicit.match(EPISODE_PATTERN) ?? video.title.match(EPISODE_PATTERN);
  if (match) {
    const label = /^(episode|ep)$/i.test(match[1]) ? "Ep" : "Part";
    return `${label} ${Number(match[2])}`;
  }

  if (/^\d+$/.test(explicit)) return `Part ${Number(explicit)}`;
  return video.seriesTitle?.trim() ? "Series" : null;
}

type RankedSeriesGroup = {
  firstIndex: number;
  interestScore: number;
  latestCreatedAt: number;
  videos: LongVideo[];
  views: number;
};

export function rankHomeVerticalVideos(
  candidates: readonly LongVideo[],
  recentInteractions: readonly LongVideo[],
) {
  const uniqueVideos = [...new Map(candidates.map((video) => [video.id, video])).values()];
  const interestWeights = new Map<string, number>();

  recentInteractions.forEach((video, index) => {
    const weight = Math.max(1, recentInteractions.length - index);
    for (const topic of getVideoTopics(video)) {
      interestWeights.set(topic, Math.max(interestWeights.get(topic) ?? 0, weight));
    }
  });

  const groupByKey = new Map<string, RankedSeriesGroup>();
  uniqueVideos.forEach((video, index) => {
    const key = seriesKey(video) ?? `video:${video.id}`;
    let interestScore = 0;
    for (const topic of getVideoTopics(video)) {
      interestScore += interestWeights.get(topic) ?? 0;
    }
    const createdAt = Date.parse(video.createdAt);
    const group = groupByKey.get(key);
    if (group) {
      group.firstIndex = Math.min(group.firstIndex, index);
      group.interestScore = Math.max(group.interestScore, interestScore);
      group.latestCreatedAt = Math.max(
        group.latestCreatedAt,
        Number.isFinite(createdAt) ? createdAt : 0,
      );
      group.views = Math.max(group.views, video.views);
      group.videos.push(video);
    } else {
      groupByKey.set(key, {
        firstIndex: index,
        interestScore,
        latestCreatedAt: Number.isFinite(createdAt) ? createdAt : 0,
        videos: [video],
        views: video.views,
      });
    }
  });

  const groups = [...groupByKey.values()];
  for (const group of groups) {
    group.videos.sort((left, right) => {
      const leftEpisode = episodeNumber(left) ?? Number.MAX_SAFE_INTEGER;
      const rightEpisode = episodeNumber(right) ?? Number.MAX_SAFE_INTEGER;
      if (leftEpisode !== rightEpisode) return leftEpisode - rightEpisode;

      const leftCreatedAt = Date.parse(left.createdAt);
      const rightCreatedAt = Date.parse(right.createdAt);
      return (
        (Number.isFinite(leftCreatedAt) ? leftCreatedAt : 0) -
          (Number.isFinite(rightCreatedAt) ? rightCreatedAt : 0) ||
        left.id.localeCompare(right.id)
      );
    });
  }

  groups.sort(
    (left, right) =>
      right.interestScore - left.interestScore ||
      right.views - left.views ||
      right.latestCreatedAt - left.latestCreatedAt ||
      left.firstIndex - right.firstIndex,
  );

  return groups.map((group) => group.videos);
}

export function buildHomeVerticalVideoShelfBatches(
  rankedGroups: readonly LongVideo[][],
  standardVideoCount: number,
  hasMoreStandardVideos: boolean,
) {
  if (rankedGroups.length === 0) return [];
  const allVideos = rankedGroups.flat();
  if (standardVideoCount === 0) return [allVideos];

  const shelfSlots = Math.floor(standardVideoCount / HOME_SHORTS_INTERVAL);
  if (shelfSlots === 0) {
    return hasMoreStandardVideos ? [] : [allVideos];
  }

  const batches: LongVideo[][] = [];
  let currentBatch: LongVideo[] = [];
  for (const group of rankedGroups) {
    if (
      currentBatch.length > 0 &&
      currentBatch.length + group.length > HOME_SHORTS_SHELF_BATCH_SIZE
    ) {
      batches.push(currentBatch);
      currentBatch = [];
    }
    currentBatch.push(...group);
    if (currentBatch.length >= HOME_SHORTS_SHELF_BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  const visibleBatches = batches.slice(0, shelfSlots);
  if (!hasMoreStandardVideos && visibleBatches.length > 0) {
    for (const remainingBatch of batches.slice(shelfSlots)) {
      visibleBatches[visibleBatches.length - 1].push(...remainingBatch);
    }
  }
  return visibleBatches;
}
