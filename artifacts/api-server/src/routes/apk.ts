import { Router, type IRouter } from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

const router: IRouter = Router();
const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const apkPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../yourworld/public/yourworld-debug.apk",
);

router.get("/yourworld-debug.apk", (req, res, next) => {
  res.download(
    apkPath,
    "yourworld-debug.apk",
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

export default router;