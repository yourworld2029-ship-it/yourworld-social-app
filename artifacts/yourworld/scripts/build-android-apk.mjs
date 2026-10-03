import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, mkdir, opendir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(appDir, "android");
const apkPath = path.join(androidDir, "app/build/outputs/apk/release/app-release.apk");
const publicDownloadsDir = path.join(appDir, "public/downloads");
const stagedApkPattern = /^yourworld-\d{8}T\d{6}Z-v\d+(?:-[a-z0-9-]+)?\.apk$/i;

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

async function findJava21Environment() {
  const currentVersion = spawnSync("java", ["-version"], { encoding: "utf8" });
  const currentOutput = `${currentVersion.stdout ?? ""}\n${currentVersion.stderr ?? ""}`;
  const candidates = new Set();
  if (process.env.JAVA_HOME) candidates.add(path.join(process.env.JAVA_HOME, "bin"));
  for (const entry of process.env.PATH?.split(path.delimiter) ?? []) {
    if (/(?:openjdk|jdk)[-_].*21/i.test(entry)) candidates.add(entry);
  }
  if (currentOutput.includes('version "21.')) {
    const javaCommand = spawnSync("which", ["java"], { encoding: "utf8" }).stdout?.trim();
    if (javaCommand) {
      const resolvedJava = spawnSync("readlink", ["-f", javaCommand], {
        encoding: "utf8",
      }).stdout?.trim();
      candidates.add(path.dirname(resolvedJava || javaCommand));
    }
  }

  const makeJava21Environment = async (java21Bin) => {
    const java21Path = path.join(java21Bin, "java");
    const javac21Path = path.join(java21Bin, "javac");
    try {
      await Promise.all([access(java21Path), access(javac21Path)]);
    } catch {
      return null;
    }
    const candidateVersion = spawnSync(java21Path, ["-version"], { encoding: "utf8" });
    const candidateOutput = `${candidateVersion.stdout ?? ""}\n${candidateVersion.stderr ?? ""}`;
    const compilerVersion = spawnSync(javac21Path, ["-version"], { encoding: "utf8" });
    const compilerOutput = `${compilerVersion.stdout ?? ""}\n${compilerVersion.stderr ?? ""}`;
    if (
      candidateOutput.includes('version "21.') &&
      /(?:^|\s)javac 21\./.test(compilerOutput)
    ) {
      return {
        ...process.env,
        JAVA_HOME: path.dirname(java21Bin),
        PATH: `${java21Bin}${path.delimiter}${process.env.PATH ?? ""}`,
      };
    }
    return null;
  };

  for (const java21Bin of candidates) {
    const java21Environment = await makeJava21Environment(java21Bin);
    if (java21Environment) return java21Environment;
  }

  // Replit may have JDK 21 in the Nix store without exposing it on PATH.
  // Scan only after checking configured paths so normal builds stay fast.
  try {
    const nixStore = await opendir("/nix/store");
    for await (const entry of nixStore) {
      if (!entry.isDirectory() || !/-(?:openjdk|jdk)-?21(?:[.+-]|$)/i.test(entry.name)) {
        continue;
      }
      const java21Environment = await makeJava21Environment(
        path.join("/nix/store", entry.name, "bin"),
      );
      if (java21Environment) return java21Environment;
    }
  } catch {
    // Non-Nix environments can still provide JDK 21 through JAVA_HOME or PATH.
  }

  throw new Error("JDK 21 is required; add its bin directory to PATH.");
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

async function pruneStagedApks() {
  const entries = await readdir(publicDownloadsDir, { withFileTypes: true });
  const stagedApks = entries
    .filter((entry) => entry.isFile() && stagedApkPattern.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));
  const retainedApks = new Set(stagedApks.slice(0, 3));
  let removedCount = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".apk")) continue;
    if (retainedApks.has(entry.name)) continue;
    await rm(path.join(publicDownloadsDir, entry.name));
    removedCount += 1;
  }

  console.log(`[apk] retained ${Math.min(stagedApks.length, 3)} staged APKs; removed ${removedCount} older or unversioned APKs`);
}

async function stageApkInWebOutput(apkFilePath) {
  const webDownloadsDir = path.join(appDir, ".output/public/downloads");
  await mkdir(webDownloadsDir, { recursive: true });
  for (const entry of await readdir(webDownloadsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".apk")) {
      await rm(path.join(webDownloadsDir, entry.name));
    }
  }
  const webApkPath = path.join(webDownloadsDir, path.basename(apkFilePath));
  await copyFile(apkFilePath, webApkPath);
  console.log(`Staged APK in web output: ${webApkPath}`);
}

async function main() {
  const gradleFile = await readFile(path.join(androidDir, "app/build.gradle"), "utf8");
  const versionCode = gradleFile.match(/versionCode\s+(\d+)/)?.[1];
  if (!versionCode) throw new Error("Could not read Android versionCode from app/build.gradle.");

  const java21Env = await findJava21Environment();
  const javaHome = java21Env.JAVA_HOME;
  if (!javaHome) throw new Error("Could not determine the JDK 21 home directory.");

  const releaseSecrets = {
    keystoreBase64: process.env.ANDROID_RELEASE_KEYSTORE_BASE64,
    keystorePassword: process.env.ANDROID_RELEASE_KEYSTORE_PASSWORD,
    keyAlias: process.env.ANDROID_RELEASE_KEY_ALIAS,
    keyPassword: process.env.ANDROID_RELEASE_KEY_PASSWORD,
  };
  if (Object.values(releaseSecrets).some((value) => !value?.trim())) {
    throw new Error(
      "A production-signed APK requires the existing Android release keystore and signing secrets. " +
      "Add them through Replit Secrets; this build will not fall back to the debug key.",
    );
  }
  const encodedKeystore = releaseSecrets.keystoreBase64.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedKeystore)) {
    throw new Error("ANDROID_RELEASE_KEYSTORE_BASE64 is not valid Base64.");
  }
  const keystoreBytes = Buffer.from(encodedKeystore, "base64");
  if (keystoreBytes.length === 0) {
    throw new Error("ANDROID_RELEASE_KEYSTORE_BASE64 did not contain a keystore file.");
  }
  const temporaryKeystorePath = path.join(
    tmpdir(),
    `yourworld-release-${process.pid}-${Date.now()}.jks`,
  );
  await writeFile(temporaryKeystorePath, keystoreBytes, { mode: 0o600, flag: "wx" });
  keystoreBytes.fill(0);

  // This project may pin org.gradle.java.home to an older JDK in gradle.properties.
  // Override it for this build so Gradle's compiler toolchain also uses JDK 21.
  const gradleEnv = {
    ...java21Env,
    GRADLE_OPTS: [
      java21Env.GRADLE_OPTS,
      `-Dorg.gradle.java.home=${javaHome}`,
      `-Dorg.gradle.java.installations.paths=${javaHome}`,
    ].filter(Boolean).join(" "),
  };
  const safeBuildEnv = { ...java21Env };
  delete safeBuildEnv.ANDROID_RELEASE_KEYSTORE_BASE64;
  delete safeBuildEnv.ANDROID_RELEASE_KEYSTORE_PASSWORD;
  delete safeBuildEnv.ANDROID_RELEASE_KEY_ALIAS;
  delete safeBuildEnv.ANDROID_RELEASE_KEY_PASSWORD;
  const productionGradleEnv = {
    ...gradleEnv,
    ANDROID_RELEASE_KEYSTORE_PATH: temporaryKeystorePath,
    ANDROID_RELEASE_KEYSTORE_PASSWORD: releaseSecrets.keystorePassword,
    ANDROID_RELEASE_KEY_ALIAS: releaseSecrets.keyAlias,
    ANDROID_RELEASE_KEY_PASSWORD: releaseSecrets.keyPassword,
  };
  delete productionGradleEnv.ANDROID_RELEASE_KEYSTORE_BASE64;
  try {
    await run("pnpm", ["run", "build"], appDir, safeBuildEnv);
    await run("pnpm", ["exec", "cap", "sync", "android"], appDir, safeBuildEnv);
    await run(
      "./gradlew",
      ["clean", "assembleRelease", "--no-build-cache"],
      androidDir,
      productionGradleEnv,
    );
  } finally {
    await rm(temporaryKeystorePath, { force: true });
  }

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
  const signerDetails = runTool(apksigner, ["verify", "--verbose", "--print-certs", apkPath]);
  if (!/Signer #1 certificate SHA-256 digest:/i.test(signerDetails)) {
    throw new Error("The APK does not contain a verifiable production signing certificate.");
  }

  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const filename = `yourworld-${timestamp}-v${versionCode}-release-signed.apk`;
  const outputPath = path.join(publicDownloadsDir, filename);
  await mkdir(publicDownloadsDir, { recursive: true });
  await copyFile(apkPath, outputPath);
  await stageApkInWebOutput(outputPath);

  const hash = createHash("sha256").update(await readFile(outputPath)).digest("hex");
  console.log(`Verified APK: ${outputPath}`);
  console.log(`Build ID: ${timestamp}; versionCode: ${versionCode}; sha256: ${hash}`);
  if (process.env.KEEP_OLD_APKS === "1") {
    console.log("Preserving older staged APKs because KEEP_OLD_APKS=1.");
  } else {
    await pruneStagedApks();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});