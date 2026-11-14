import { Request, Response } from "express";

//local imports
import { FoodService } from "./food.sevice.js";
import type { AuthRequest } from "../../shared/midddleware/auth.middleware.js";
import { logger } from "../../config/logger.js";
import { FoodRepositry } from "./food.repo.js";

const service = new FoodService();
const repository = new FoodRepositry();

export const analyze = async (req: Request, res: Response) => {
  try {
    const { image, healthCondition } = req.body;

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const response = await service.analyzeFood(image, healthCondition, userId);

    res.json(response.result);
  } catch (error: any) {
    logger.error("Error analyzing food:", error);
    res.status(500).json({
      message: "Food analysis failed please try again later",
      error: error.message,
    });
  }
};

export const mealHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await service.getMealHistory(userId);

    res.json({
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fatching meal history please try again later",
      error: error.message,
    });
  }
};

export const adminScans = async (req: Request, res: Response) => {
  const pageValue = Number(req.query.page ?? 1);
  const limitValue = Number(req.query.limit ?? 20);
  if (!Number.isInteger(pageValue) || pageValue < 1 || !Number.isInteger(limitValue) || limitValue < 1) {
    return res.status(400).json({ message: "Page and limit must be positive integers." });
  }

  try {
    const pageSize = Math.min(limitValue, 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 200) : "";
    const lowConfidenceOnly = req.query.lowConfidence === "true";
    const result = await repository.listForAdmin({
      search,
      lowConfidenceOnly,
      take: pageSize,
      skip: (pageValue - 1) * pageSize,
    });
    return res.status(200).json({
      success: true,
      data: {
        ...result,
        page: pageValue,
        pages: Math.max(1, Math.ceil(result.total / pageSize)),
        limit: pageSize,
      },
    });
  } catch (error) {
    logger.error("Unable to load admin food scan review.", error);
    return res.status(500).json({ message: "Unable to load food scan records." });
  }
};
