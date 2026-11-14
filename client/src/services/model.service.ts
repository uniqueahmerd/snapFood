    import { api } from './api';

export interface ModelStatus {
  active_model: string;
  registration_enabled?: boolean;
  models: Array<{
    name: string;
    display_name: string;
    task: string;
    classes: number;
    active: boolean;
    artifact?: {
      filename: string | null;
      available: boolean;
      size_bytes: number | null;
      updated_at: string | null;
    };
  }>;
}

export interface ModelVersion {
  id: string;
  filename: string;
  size_bytes: number;
  updated_at: string;
}

export type ModelArchitecture = 'keras_classifier' | 'efficientnetv2_s_multilabel';

export interface RegisterModelPayload {
  modelName: string;
  displayName: string;
  architecture: ModelArchitecture;
  labels: string[];
  file: File;
}

export const modelService = {
  async getStatus(): Promise<ModelStatus> {
    const response = await api.get('/system/models/status');
    return response.data.data;
  },

  async activate(modelName: string): Promise<void> {
    await api.post(`/system/models/${encodeURIComponent(modelName)}/activate`);
  },

  async register(payload: RegisterModelPayload): Promise<void> {
    await api.post('/system/models/register', payload.file, {
      timeout: 120_000,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Model-Name': payload.modelName,
        'X-Model-Display-Name': payload.displayName,
        'X-Model-Architecture': payload.architecture,
        'X-Model-Labels': JSON.stringify(payload.labels),
        'X-Model-Filename': payload.file.name,
      },
    });
  },

  async getVersions(modelName: string): Promise<ModelVersion[]> {
    const response = await api.get(`/system/models/${encodeURIComponent(modelName)}/versions`);
    return response.data.data;
  },

  async rollback(modelName: string, versionId: string): Promise<void> {
    await api.post(
      `/system/models/${encodeURIComponent(modelName)}/versions/${encodeURIComponent(versionId)}/rollback`,
    );
  },

  async deleteVersion(modelName: string, versionId: string): Promise<void> {
    await api.delete(
      `/system/models/${encodeURIComponent(modelName)}/versions/${encodeURIComponent(versionId)}`,
    );
  },
};
