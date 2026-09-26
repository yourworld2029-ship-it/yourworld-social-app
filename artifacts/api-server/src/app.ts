import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import apkRouter from "./routes/apk";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Serve the APK before compression so it is always delivered byte-for-byte.
app.use(apkRouter);
app.use(
  compression({
    filter(req, res) {
      const cacheControl = String(res.getHeader("Cache-Control") ?? "");
      const contentType = String(res.getHeader("Content-Type") ?? "").toLowerCase();
      // Byte ranges and media marked no-transform must remain byte-for-byte
      // compatible with Content-Range and Content-Length.
      if (
        req.headers.range ||
        /(?:^|,)\s*no-transform(?:\s*(?:,|$))/i.test(cacheControl) ||
        contentType.startsWith("video/")
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
