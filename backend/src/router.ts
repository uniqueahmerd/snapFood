import { Router } from "express";

import { userRouter } from "./modules/user";
import { authRouter } from "./modules/auth";
import foodRouter from "./modules/food/food.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import { systemRouter } from "./modules/system/system.routes";
import { env } from "./config/env";
import { testEmail } from "./shared/utils/testEmail";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/food", foodRouter);
router.use("/dashboard", dashboardRouter);
router.use("/system", systemRouter);

if (env.NODE_ENV === "development") {
	router.get("/test-email", testEmail);
}

export default router;
