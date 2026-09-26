import { Router, type IRouter } from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

const router: IRouter = Router();
const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const apkPublicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../yourworld/public",
);

function registerApkDownload(
  filename: string,
  routePath = `/${filename}`,
  downloadName = filename,
) {
  const filePath = path.join(apkPublicDir, filename);

  router.get(routePath, (req, res, next) => {
    res.download(
      filePath,
      downloadName,
      {
        headers: {
          "Content-Type": APK_CONTENT_TYPE,
          "Cache-Control": "no-transform",
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

registerApkDownload("yourworld-debug.apk");
registerApkDownload("yourworld-v3.apk");
registerApkDownload("yourworld-debug.apk", "/download-apk", "yourworld.apk");

export default router;