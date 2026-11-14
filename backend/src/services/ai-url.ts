export function getAIServiceBaseUrl(configuredUrl: string): string {
  return configuredUrl.trim().replace(/\/+$/, "").replace(/\/(?:analyze|predict)$/i, "");
}