import reel1 from "@/assets/reel-1.jpg";
import reel2 from "@/assets/reel-2.jpg";
import reel3 from "@/assets/reel-3.jpg";
import post1 from "@/assets/post-1.jpg";
import type { SocialPost } from "@/lib/social-data";
import type { LongVideo } from "@/lib/video-data";

const createdAt = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

const demoAuthors = [
  { id: "demo-riko", username: "riko.night", name: "Riko Tan", hue: 300 },
  { id: "demo-mara", username: "sea.salt", name: "Mara Vega", hue: 190 },
  { id: "demo-ada", username: "spinsolo", name: "Ada Kim", hue: 40 },
];

export const DEMO_REELS: SocialPost[] = [
  {
    id: "demo-reel-neon",
    user_id: demoAuthors[0].id,
    kind: "reel",
    media_url: reel1,
    media_type: "image",
    caption: "3am in Kabukicho, nobody around but the signs.",
    hashtags: ["tokyo", "nightlife", "cinematic"],
    location: "Tokyo, Japan",
    audio: "midnight drive — lowtide",
    allow_download: true,
    created_at: createdAt(2),
    author: demoAuthors[0],
    likeCount: 184300,
    commentCount: 2140,
    likedByMe: false,
  },
  {
    id: "demo-reel-ocean",
    user_id: demoAuthors[1].id,
    kind: "reel",
    media_url: reel2,
    media_type: "image",
    caption: "Held the line for four seconds. Felt like a year.",
    hashtags: ["surf", "sunset", "ocean"],
    location: "Ericeira",
    audio: "saltwater — mara vega",
    allow_download: false,
    created_at: createdAt(5),
    author: demoAuthors[1],
    likeCount: 92110,
    commentCount: 830,
    likedByMe: false,
  },
  {
    id: "demo-reel-studio",
    user_id: demoAuthors[2].id,
    kind: "reel",
    media_url: reel3,
    media_type: "image",
    caption: "One light, one take.",
    hashtags: ["dance", "studio", "onetake"],
    location: "Seoul",
    audio: "spotlight (slowed) — ada k",
    allow_download: true,
    created_at: createdAt(9),
    author: demoAuthors[2],
    likeCount: 271004,
    commentCount: 5120,
    likedByMe: false,
  },
];

export const DEMO_POSTS: SocialPost[] = [
  {
    ...DEMO_REELS[0],
    id: "demo-post-neon",
    kind: "post",
    media_url: reel1,
    caption: "Shinjuku after the rain. The signs do all the work.",
  },
  {
    ...DEMO_REELS[1],
    id: "demo-post-brunch",
    kind: "post",
    media_url: post1,
    caption: "Sunday table. No plans, only pastries.",
    hashtags: ["brunch", "slowmornings"],
  },
];

export const DEMO_LONG_VIDEOS: LongVideo[] = [
  {
    id: "demo-video-city",
    userId: demoAuthors[0].id,
    title: "Tokyo After Dark — A Cinematic Night Walk",
    caption: "Neon streets, quiet alleys, and the city between trains.",
    mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: reel1,
    orientation: "landscape",
    durationSeconds: 95,
    views: 128400,
    hashtags: ["tokyo", "cinematic", "nightwalk"],
    createdAt: createdAt(2),
    scheduledAt: null,
    author: { name: demoAuthors[0].name, username: demoAuthors[0].username, letter: "R" },
    likeCount: 14200,
    commentCount: 684,
    likedByMe: false,
  },
  {
    id: "demo-video-ocean",
    userId: demoAuthors[1].id,
    title: "Chasing the Last Set at Golden Hour",
    caption: "A short surf film from the Atlantic coast.",
    mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: reel2,
    orientation: "landscape",
    durationSeconds: 154,
    views: 87300,
    hashtags: ["surf", "ocean", "goldenhour"],
    createdAt: createdAt(6),
    scheduledAt: null,
    author: { name: demoAuthors[1].name, username: demoAuthors[1].username, letter: "M" },
    likeCount: 9100,
    commentCount: 321,
    likedByMe: false,
  },
  {
    id: "demo-video-creator",
    userId: demoAuthors[2].id,
    title: "Build a Smooth Reel Edit in Five Minutes",
    caption: "Cuts, music, text, speed ramps, and a clean export workflow.",
    mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: reel3,
    orientation: "portrait",
    durationSeconds: 218,
    views: 244900,
    hashtags: ["editing", "creator", "tutorial"],
    createdAt: createdAt(12),
    scheduledAt: null,
    author: { name: demoAuthors[2].name, username: demoAuthors[2].username, letter: "A" },
    likeCount: 28700,
    commentCount: 1402,
    likedByMe: false,
  },
];