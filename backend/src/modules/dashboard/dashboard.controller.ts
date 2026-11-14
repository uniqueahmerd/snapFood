import type { RequestHandler } from "express";
import { AuthRequest } from "../../shared/midddleware/auth.middleware.js";
import { DashboardRepositry } from "./dashboard.repo.js";

const repo = new DashboardRepositry();

const forCurrentUser = (
  load: (userId: string) => Promise<unknown>,
): RequestHandler =>
  async (req, res, next) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      res.json(await load(userId));
    } catch (error) {
      next(error);
    }
  };

export const summary = forCurrentUser((userId) => repo.getSummary(userId));
export const recentScans = forCurrentUser((userId) => repo.getRecentScans(userId));
export const weeklyTrend = forCurrentUser((userId) => repo.getWeeklyTrend(userId));
export const nutritionBreakdown = forCurrentUser((userId) =>
  repo.getNutritionBreakdown(userId),
);
export const healthRisk = forCurrentUser((userId) => repo.getHealthRisk(userId));
