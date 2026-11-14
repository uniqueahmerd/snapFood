import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../shared/utils/AppError";
import { getAIServiceBaseUrl } from "./ai-url";

function aiUrl(path: string): string {
  const baseUrl = getAIServiceBaseUrl(env.AI_URL ?? "");
  if (!baseUrl) {
    throw new Error("AI_URL is not configured");
  }
  return `${baseUrl}/${path.replace(/^\//, "")}`;
}

interface ModelStatusResponse {
  active_model?: string;
  registration_enabled?: boolean;
  models?: Array<{ name: string; active?: boolean }>;
}

export interface ModelVersion {
  id: string;
  filename: string;
  size_bytes: number;
  updated_at: string;
}

export interface NewModelRegistration {
  modelName: string;
  displayName: string;
  architecture: "keras_classifier" | "efficientnetv2_s_multilabel";
  labels: string[];
  filename: string;
  content: Buffer;
}


function adminHeaders(): { "X-Admin-Service-Token": string } {
  if (!env.AI_ADMIN_TOKEN) {
    throw new AppError(
      "AI_ADMIN_TOKEN must be configured in the backend and AI service.",
      503,
    );
  }

  return {
    "X-Admin-Service-Token": env.AI_ADMIN_TOKEN,
  };
}


export const modelService = {
  
  async getStatus(): Promise<ModelStatusResponse> {
    const response = await axios.get<ModelStatusResponse>(aiUrl("models/status"), {headers: adminHeaders()});
    return {
      ...response.data,
      registration_enabled: Boolean(env.AI_ADMIN_TOKEN && response.data.registration_enabled),
    };
  },

  async register(registration: NewModelRegistration): Promise<Record<string, unknown>> {
    if (!env.AI_ADMIN_TOKEN) {
      throw new AppError("AI_ADMIN_TOKEN must be configured in the backend and AI service to register models.", 503);
    }
    try {
      const response = await axios.post(
        aiUrl("models/register"),
        registration.content,
        {
          timeout: 120_000,
          maxBodyLength: 210 * 1024 * 1024,
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Admin-Service-Token": env.AI_ADMIN_TOKEN,
            "X-Model-Name": registration.modelName,
            "X-Model-Display-Name": registration.displayName,
            "X-Model-Architecture": registration.architecture,
            "X-Model-Labels": JSON.stringify(registration.labels),
            "X-Model-Filename": registration.filename,
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
        if (status && status >= 400 && status < 500) {
          throw new AppError(typeof detail === "string" ? detail : "The AI service rejected this model registration.", status);
        }
      }
      throw new AppError("The AI model registry is unavailable.", 502);
    }
  },

  async activate(modelName: string): Promise<{ active_model: string }> {
    const response = await axios.post<{ active_model: string }>(
      aiUrl(`models/${encodeURIComponent(modelName)}/activate`),
      {headers: adminHeaders()},
      {},
    );
    return response.data;
  },

  async getVersions(modelName: string): Promise<ModelVersion[]> {
    const response = await axios.get<{ versions: ModelVersion[] }>(
      aiUrl(`models/${encodeURIComponent(modelName)}/versions`),
      {headers: adminHeaders()},
    );
    return response.data.versions;
  },

  async rollback(modelName: string, versionId: string): Promise<void> {
    await axios.post(
      aiUrl(`models/${encodeURIComponent(modelName)}/versions/${encodeURIComponent(versionId)}/rollback`),
      {headers: adminHeaders()},
      {},
    );
  },

  async deleteVersion(modelName: string, versionId: string): Promise<void> {
    await axios.delete(
      aiUrl(`models/${encodeURIComponent(modelName)}/versions/${encodeURIComponent(versionId)}`),
      {headers: adminHeaders()},
    );
  },
};
