import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mediaRouter from "./media";
import postsRouter from "./posts";
import liveRouter from "./live";
import callPushRouter from "./call-push";
import translateCommentRouter from "./translate-comment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mediaRouter);
router.use(postsRouter);
router.use(liveRouter);
router.use(callPushRouter);
router.use(translateCommentRouter);

export default router;
