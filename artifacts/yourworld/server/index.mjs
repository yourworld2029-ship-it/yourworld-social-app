const rawPort = process.env.PORT ?? process.env.NITRO_PORT ?? "3000";
const port = Number.parseInt(rawPort, 10);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Nitro reads these variables while its generated node-server entry is loaded.
// Set both explicitly so published containers never bind to localhost or a
// build-time port.
process.env.NITRO_PORT = String(port);
process.env.NITRO_HOST = process.env.HOST?.trim() || "0.0.0.0";
process.env.NODE_ENV ||= "production";

await import("../.output/server/index.mjs");