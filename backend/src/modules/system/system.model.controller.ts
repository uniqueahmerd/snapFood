import type { Request, Response, RequestHandler } from "express";
import { modelService } from "../../services/model.service";
import type { AuthRequest } from "../../shared/midddleware/auth.middleware";
import { recordAdminAction } from "./system.repo";

async function auditModelAction(req: Request, action: string, modelName: string, outcome: "success" | "failure", details?: string) {
  const actorId = (req as AuthRequest).user?.userId;
  if (!actorId) return;
  try {
    await recordAdminAction({ actorId, action, target: modelName, outcome, details });
  } catch {
    // An audit storage failure must not hide the result of the model operation.
  }
}

export const modelStatus: RequestHandler = async (_req, res, next) => {
  try {
    const status = await modelService.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

export const registerModel: RequestHandler = async (req, res, next) => {
  const actorId = (req as AuthRequest).user?.userId;
  const modelName = getRouteString(req.headers["x-model-name"]);
  try {
    const displayName = getRouteString(req.headers["x-model-display-name"]);
    const architecture = getRouteString(req.headers["x-model-architecture"]);
    const filename = getRouteString(req.headers["x-model-filename"]);
    const labelsHeader = getRouteString(req.headers["x-model-labels"]);
    if (!modelName || !displayName || !architecture || !filename || !labelsHeader || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ success: false, message: "Model metadata and a binary model artifact are required." });
      return;
    }

    let labels: unknown;
    try {
      labels = JSON.parse(labelsHeader);
    } catch {
      res.status(400).json({ success: false, message: "Model labels must be valid JSON." });
      return;
    }
    if (!Array.isArray(labels) || !labels.every((label) => typeof label === "string")) {
      res.status(400).json({ success: false, message: "Model labels must be an array of strings." });
      return;
    }
    if (architecture !== "keras_classifier" && architecture !== "efficientnetv2_s_multilabel") {
      res.status(400).json({ success: false, message: "Unsupported model architecture." });
      return;
    }

    const result = await modelService.register({
      modelName,
      displayName,
      architecture,
      labels,
      filename,
      content: req.body,
    });
    await auditModelAction(req, "model.register", modelName, "success", `${architecture}; ${labels.length} labels`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (actorId && modelName) {
      await auditModelAction(req, "model.register", modelName, "failure");
    }
    next(error);
  }
};

export const modelVersions: RequestHandler = async (req, res, next) => {
  try {
    const modelName = getRouteString(req.params.modelName);
    if (!modelName) {
      res.status(400).json({ success: false, message: "A model name is required." });
      return;
    }
    const versions = await modelService.getVersions(modelName);
    res.status(200).json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
};

function getRouteString(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length === 1 && value[0].length > 0) return value[0];
  return null;
}

export const activateModel: RequestHandler = async (req, res, next) => {
  const modelName = getRouteString(req.params.modelName);
  try {
    if (!modelName) {
      res.status(400).json({ success: false, message: "A model name is required." });
      return;
    }

    const result = await modelService.activate(modelName);
    await auditModelAction(req, "model.activate", modelName, "success");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (modelName) await auditModelAction(req, "model.activate", modelName, "failure");
    next(error);
  }
};

export const rollbackModel: RequestHandler = async (req, res, next) => {
  const modelName = getRouteString(req.params.modelName);
  const versionId = getRouteString(req.params.versionId);
  try {
    if (!modelName || !versionId) {
      res.status(400).json({ success: false, message: "A model name and version are required." });
      return;
    }
    const result = await modelService.rollback(modelName, versionId);
    await auditModelAction(req, "model.rollback", `${modelName}:${versionId}`, "success");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (modelName && versionId) await auditModelAction(req, "model.rollback", `${modelName}:${versionId}`, "failure");
    next(error);
  }
};

export const deleteModelVersion: RequestHandler = async (req, res, next) => {
  const modelName = getRouteString(req.params.modelName);
  const versionId = getRouteString(req.params.versionId);
  try {
    if (!modelName || !versionId) {
      res.status(400).json({ success: false, message: "A model name and version are required." });
      return;
    }
    await modelService.deleteVersion(modelName, versionId);
    await auditModelAction(req, "model.version.delete", `${modelName}:${versionId}`, "success");
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    if (modelName && versionId) await auditModelAction(req, "model.version.delete", `${modelName}:${versionId}`, "failure");
    next(error);
  }
};
