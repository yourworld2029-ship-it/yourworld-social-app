const fs = require("fs");

// 1. Fix video-quality.ts (remove not available error, use fallback)
const vqPath = "artifacts/yourworld/src/lib/video-quality.ts";
if (fs.existsSync(vqPath)) {
  let vq = fs.readFileSync(vqPath, "utf8");
  vq = vq.replace(
    /if\s*\(!t\)\s*throw new Error\([^)]*\);/g,
    `if (!t) {
      const anyUrl = Object.values(i || {}).find(v => typeof v === "string" && v.trim().length > 0);
      if (anyUrl) return anyUrl.trim();
      return "";
    }`
  );
  fs.writeFileSync(vqPath, vq, "utf8");
  console.log("1. video-quality.ts patched!");
}

// 2. Fix DownloadSheet.tsx (uploaded quality se neeche wali sab, plus direct download fallback)
const dsPath = "artifacts/yourworld/src/components/yw/DownloadSheet.tsx";
if (fs.existsSync(dsPath)) {
  let ds = fs.readFileSync(dsPath, "utf8");

  const tierLogic = `const ALL_ORDERED_TIERS: VideoQualityTier[] = ["4320p", "2160p", "1440p", "1080p", "720p", "480p", "360p"];
  const choices = useMemo<DownloadChoice[]>(() => {
    const raw = (sourceQualityTier || "").toLowerCase();
    const idx = ALL_ORDERED_TIERS.findIndex(t => t === raw || raw.includes(t));
    const startIdx = idx >= 0 ? idx : 3;
    return [...ALL_ORDERED_TIERS.slice(startIdx), "original"];
  }, [sourceQualityTier]);`;

  ds = ds.replace(/const choices\s*=\s*useMemo<DownloadChoice\[\]>\([\s\S]*?\);/, tierLogic);

  ds = ds.replace(
    /const url = resolveDownloadUrl\([^)]*\);/g,
    `let url = "";
     try {
       url = resolveDownloadUrl(choice, qualityMediaUrls);
     } catch(e) {}
     if (!url) url = sourceMediaUrl || "";`
  );

  fs.writeFileSync(dsPath, ds, "utf8");
  console.log("2. DownloadSheet.tsx patched!");
}

console.log("All done!");
