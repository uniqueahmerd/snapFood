import express, { Router } from "express";
import { authenticate, authorize } from "../../shared/midddleware/auth.middleware";
import { Role } from "../../shared/types/types";
import { adminAudit, operationalSummary, systemHealth, systemLogs } from "./system.controller";
import {
  activateModel,
  deleteModelVersion,
  modelStatus,
  modelVersions,
  registerModel,
  rollbackModel,
} from "./system.model.controller";

export const systemRouter = Router();

systemRouter.get(
  "/operational-summary",
  authenticate,
  authorize(Role.ADMIN),
  operationalSummary
);

systemRouter.get(
  "/health",
  authenticate,
  authorize(Role.ADMIN),
  systemHealth
);

systemRouter.get(
  "/logs",
  authenticate,
  authorize(Role.ADMIN),
  systemLogs
);

systemRouter.get(
  "/audit",
  authenticate,
  authorize(Role.ADMIN),
  adminAudit
);

systemRouter.get(
  "/models/status",
  authenticate,
  authorize(Role.ADMIN),
  modelStatus
);

systemRouter.post(
  "/models/register",
  authenticate,
  authorize(Role.ADMIN),
  express.raw({ type: "application/octet-stream", limit: "210mb" }),
  registerModel
);

systemRouter.get(
  "/models/:modelName/versions",
  authenticate,
  authorize(Role.ADMIN),
  modelVersions
);

systemRouter.post(
  "/models/:modelName/versions/:versionId/rollback",
  authenticate,
  authorize(Role.ADMIN),
  rollbackModel
);

systemRouter.delete(
  "/models/:modelName/versions/:versionId",
  authenticate,
  authorize(Role.ADMIN),
  deleteModelVersion
);

systemRouter.post(
  "/models/:modelName/activate",
  authenticate,
  authorize(Role.ADMIN),
  activateModel
);

