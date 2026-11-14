import { Router } from "express";
import { Role } from "../../shared/types/types";

//local imports
import { authenticate, authorize } from "../../shared/midddleware/auth.middleware.js";
import { healthRisk, nutritionBreakdown, recentScans, summary, weeklyTrend } from "./dashboard.controller.js";

const DashboardRouter: Router = Router();

DashboardRouter.get("/summary",  authenticate, authorize(Role.USER), summary);

DashboardRouter.get("/recent-scans", authenticate, authorize(Role.USER), recentScans);

DashboardRouter.get("/weekly-trend",  authenticate,authorize(Role.USER), weeklyTrend);

DashboardRouter.get("/nutrition-breakdown",  authenticate, authorize(Role.USER), nutritionBreakdown);

DashboardRouter.get("/health-risk",  authenticate, authorize(Role.USER), healthRisk);

export default DashboardRouter;