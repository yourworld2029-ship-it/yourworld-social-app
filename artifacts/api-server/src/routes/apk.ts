import { Router, type IRouter } from "express";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const router: IRouter = Router();
const apkPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../yourworld/public/yourworld-debug.apk",
);

router.get("/yourworld-debug.apk", async (_req, res) => {
  try {
    await access(apkPath);
  } catch {
    res.status(404).json({ error: "APK is not available" });
    return;
  }

  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", "attachment; filename=yourworld-debug.apk");
  res.sendFile(apkPath);
});

export default router;