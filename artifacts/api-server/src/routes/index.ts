import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import dishesRouter from "./dishes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter); // Activity 1: POST /api/chat
router.use(dishesRouter); // Activity 2: /api/dishes

export default router;
