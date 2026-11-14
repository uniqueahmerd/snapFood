import type { RequestHandler } from "express";
import { SystemRepository } from "./system.repo";

const repository = new SystemRepository();

export const operationalSummary: RequestHandler = async (_req, res, next) => {
  try {
    const summary = await repository.getOperationalSummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const systemHealth: RequestHandler = async (_req, res, next) => {
  try {
    const health = await repository.getSystemHealth();
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
};

export const systemLogs: RequestHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 25);
    const level = typeof req.query.level === "string" ? req.query.level : "all";
    const source = typeof req.query.source === "string" ? req.query.source : "all";
    const logs = await repository.getRecentLogs(Number.isFinite(limit) ? limit : 25, level, source);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const adminAudit: RequestHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const entries = await repository.getAdminAudit(Number.isFinite(limit) ? limit : 50);
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};
