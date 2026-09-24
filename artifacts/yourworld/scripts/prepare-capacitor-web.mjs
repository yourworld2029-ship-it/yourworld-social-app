import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = join(process.cwd(), ".output", "public");
const assetsDir = join(outputDir, "assets");
const assets = readdirSync(assetsDir);
const clientEntry = assets.find((name) => /^index-[^/]+\.js$/.test(name));
const stylesheet = assets.find((name) => /^styles-[^/]+\.css$/.test(name));

if (!clientEntry || !stylesheet) {
  throw new Error("Capacitor web shell requires the generated client entry and stylesheet.");
}

writeFileSync(
  join(outputDir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0e0e14" />
   <link rel="manifest" href="/manifest.json" />
    <link rel="stylesheet" href="./assets/${stylesheet}" />
    <title>YourWorld</title>
  </head>
  <body>
    <script type="module" async src="./assets/${clientEntry}"></script>
  </body>
</html>
`,
);

console.info(`[capacitor] wrote ${join(outputDir, "index.html")}`);