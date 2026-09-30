import { copyFile, mkdir, readdir, rm, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const projectDir = process.cwd();
const publicDir = join(projectDir, "public");
const webPublicDir = join(projectDir, ".output", "public");
const capacitorDir = join(projectDir, ".output", "capacitor");

async function removeApkFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeApkFiles(sourcePath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".apk")) {
      await rm(sourcePath);
    }
  }
}

async function copyPublicAssets(sourceDir, targetDir, isRoot = false) {
  await mkdir(targetDir, { recursive: true });
  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    if (
      entry.name.toLowerCase().endsWith(".apk") ||
      (isRoot && entry.name.toLowerCase() === "index.html")
    ) {
      continue;
    }

    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyPublicAssets(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
    }
  }
}

await rm(join(webPublicDir, "index.html"), { force: true });
await removeApkFiles(webPublicDir);
await copyPublicAssets(publicDir, capacitorDir, true);

const capacitorHtmlPath = join(capacitorDir, "index.html");
let capacitorHtml = await readFile(capacitorHtmlPath, "utf8");
capacitorHtml = capacitorHtml
  .replace(/((?:src|href)=["'])\/(?:\.\/)?assets\//g, "$1./assets/")
  .replace(/((?:src|href)=["'])\/(favicon\.(?:png|svg)|icon-512\.png)/g, "$1./$2");
if (
  !/<html(?:\s|>)/i.test(capacitorHtml) ||
  !/<body(?:\s|>)/i.test(capacitorHtml) ||
  !capacitorHtml.includes('id="$tsr-stream-barrier"') ||
  !/<script\b[^>]*type="module"[^>]*src="\.\/assets\/index-[^"]+\.js"/i.test(
    capacitorHtml,
  )
) {
  throw new Error("Capacitor output is missing the rendered TanStack Start SPA shell.");
}
if (/(?:src|href)=["']\/(?:\.\/)?assets\//.test(capacitorHtml)) {
  throw new Error("Capacitor output contains an absolute asset path.");
}
await writeFile(capacitorHtmlPath, capacitorHtml);

console.info(`[capacitor] prepared local client bundle at ${capacitorDir}`);