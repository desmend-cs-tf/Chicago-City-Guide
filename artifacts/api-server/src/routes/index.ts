import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import unsplashRouter from "./unsplash";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter); // Activity 1: POST /api/chat
router.use(unsplashRouter); // Activity 4: Unsplash photo search and gallery selection

export default router;
