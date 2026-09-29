import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(appDir, "android");
const apkPath = path.join(androidDir, "app/build/outputs/apk/debug/app-debug.apk");
const publicDownloadsDir = path.join(appDir, "public/downloads");

function run(command, args, cwd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function findJava21Environment() {
  const currentVersion = spawnSync("java", ["-version"], { encoding: "utf8" });
  const currentOutput = `${currentVersion.stdout ?? ""}\n${currentVersion.stderr ?? ""}`;
  if (currentOutput.includes('version "21.')) return process.env;

  const java21Bin = process.env.PATH
    ?.split(path.delimiter)
    .find((entry) => /(?:openjdk|jdk)[-_].*21/i.test(entry));
  if (!java21Bin) {
    throw new Error("JDK 21 is required; add its bin directory to PATH.");
  }

  const java21Path = path.join(java21Bin, "java");
  const candidateVersion = spawnSync(java21Path, ["-version"], { encoding: "utf8" });
  const candidateOutput = `${candidateVersion.stdout ?? ""}\n${candidateVersion.stderr ?? ""}`;
  if (!candidateOutput.includes('version "21.')) {
    throw new Error(`The Java executable at ${java21Path} is not JDK 21.`);
  }

  return {
    ...process.env,
    JAVA_HOME: path.dirname(java21Bin),
    PATH: `${java21Bin}${path.delimiter}${process.env.PATH ?? ""}`,
  };
}

async function getSdkRoot() {
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;

  try {
    const properties = await readFile(path.join(androidDir, "local.properties"), "utf8");
    const sdkDir = properties.match(/^sdk\.dir=(.+)$/m)?.[1]?.replace(/\\:/g, ":");
    if (sdkDir) return sdkDir;
  } catch {
    // The explicit SDK environment variables are the supported configuration.
  }
  throw new Error("Set ANDROID_SDK_ROOT or ANDROID_HOME before building the Android APK.");
}

async function findAndroidTool(sdkRoot, toolName) {
  const buildToolsDir = path.join(sdkRoot, "build-tools");
  const entries = await readdir(buildToolsDir);
  const versions = [];
  for (const version of entries) {
    try {
      // Android SDKs assembled from Nix packages expose version directories as
      // symlinks, which Dirent.isDirectory() does not follow.
      if ((await stat(path.join(buildToolsDir, version))).isDirectory()) {
        versions.push(version);
      }
    } catch {
      // Ignore broken symlinks and non-directory entries.
    }
  }
  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  for (const version of versions) {
    const candidate = path.join(buildToolsDir, version, toolName);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next installed build-tools version.
    }
  }
  throw new Error(`Could not find ${toolName} under ${buildToolsDir}.`);
}

function runTool(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

async function main() {
  const gradleFile = await readFile(path.join(androidDir, "app/build.gradle"), "utf8");
  const versionCode = gradleFile.match(/versionCode\s+(\d+)/)?.[1];
  if (!versionCode) throw new Error("Could not read Android versionCode from app/build.gradle.");

  const java21Env = findJava21Environment();
  await run("pnpm", ["run", "build"], appDir, java21Env);
  await run("pnpm", ["exec", "cap", "sync", "android"], appDir, java21Env);
  await run("./gradlew", ["assembleDebug"], androidDir, java21Env);

  const sdkRoot = await getSdkRoot();
  const aapt = await findAndroidTool(sdkRoot, "aapt");
  const apksigner = await findAndroidTool(sdkRoot, "apksigner");
  const permissions = runTool(aapt, ["dump", "permissions", apkPath]);
  for (const permission of [
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
  ]) {
    if (!permissions.includes(permission)) {
      throw new Error(`Built APK is missing required permission ${permission}.`);
    }
  }
  runTool(apksigner, ["verify", "--verbose", apkPath]);

  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const filename = `yourworld-${timestamp}-v${versionCode}.apk`;
  const outputPath = path.join(publicDownloadsDir, filename);
  await mkdir(publicDownloadsDir, { recursive: true });
  await copyFile(apkPath, outputPath);

  const hash = createHash("sha256").update(await readFile(outputPath)).digest("hex");
  console.log(`Verified APK: ${outputPath}`);
  console.log(`Build ID: ${timestamp}; versionCode: ${versionCode}; sha256: ${hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});