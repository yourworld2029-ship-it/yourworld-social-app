import { Router, type IRouter } from "express";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const router: IRouter = Router();
const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const APK_DOWNLOAD_FILENAME = "YourWorld.apk";
const apkPublicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../yourworld/public",
);
const apkDownloadDir = path.join(apkPublicDir, "downloads");
const timestampedApkPattern = /^yourworld-(\d{8}T\d{6}Z)-v(\d+)\.apk$/;

async function findLatestApk() {
  const entries = await readdir(apkDownloadDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && timestampedApkPattern.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
}

function registerApkDownload(routePath: string) {
  router.get(routePath, async (req, res, next) => {
    let filename: string | null;
    try {
      filename = await findLatestApk();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        res.status(404).json({ error: "APK is not available" });
        return;
      }
      next(error);
      return;
    }

    if (!filename) {
      res.status(404).json({ error: "APK is not available" });
      return;
    }

    const filePath = path.join(apkDownloadDir, filename);
    const buildId = timestampedApkPattern.exec(filename)?.[1] ?? "unknown";
    res.download(
      filePath,
      APK_DOWNLOAD_FILENAME,
      {
        headers: {
          "Content-Type": APK_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="YourWorld.apk"',
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, no-transform",
          "Pragma": "no-cache",
          "Expires": "0",
          "X-APK-Build": buildId,
        },
      },
      (error) => {
        if (!error) return;

        // A client closing a large download is not a server failure.
        if (req.aborted || res.destroyed) return;

        if ((error as NodeJS.ErrnoException).code === "ENOENT" && !res.headersSent) {
          res.status(404).json({ error: "APK is not available" });
          return;
        }

        next(error);
      },
    );
  });
}

registerApkDownload("/yourworld-debug.apk");
registerApkDownload("/yourworld-v3.apk");
registerApkDownload("/download-apk");

export default router;