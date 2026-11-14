import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import axios from "axios";
import { AppDataSource } from "../../config/database.config";
import { env } from "../../config/env";
import { logFilePath } from "../../config/logger";
import { getAIServiceBaseUrl } from "../../services/ai-url";
import { User } from "../user/user.entity";

export type OperationalStatus = "healthy" | "warning" | "error" | "disabled";

export interface OperationalResource {
  name: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface OperationalSummary {
  generatedAt: string;
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalScans: number;
  latestScanAt: string | null;
  healthScore: number;
  registrationTrend: Array<{ date: string; count: number }>;
  scanTrend: Array<{ date: string; count: number }>;
  popularFoods: Array<{ name: string; count: number; averageConfidence: number }>;
  recentAdminActions: AdminAuditEntry[];
  database: {
    status: OperationalStatus;
    checkedAt: string;
    details: string;
  };
  models: {
    status: OperationalStatus;
    checkedAt: string;
    fileCount: number;
    files: OperationalResource[];
  };
  storage: {
    status: OperationalStatus;
    checkedAt: string;
  };
  diagnosticChecks: Array<{
    id: string;
    name: string;
    status: OperationalStatus;
    checkedAt: string;
    details: string;
  }>;
}

export interface SystemHealthResponse {
  generatedAt: string;
  status: OperationalStatus;
  backend: {
    status: OperationalStatus;
    details: string;
  };
  database: {
    status: OperationalStatus;
    details: string;
  };
  ai: {
    status: OperationalStatus;
    details: string;
    version: string | null;
    modelCount: number;
  };
  alerts: Array<{ level: string; message: string; source: string; timestamp: string }>;
}

export interface SystemLogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  meta?: Record<string, unknown>;
}

export interface SystemLogSnapshot {
  logs: SystemLogEntry[];
  total: number;
  limit: number;
  unavailableSources?: string[];
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  target: string;
  outcome: "success" | "failure";
  details?: string;
}

const modelDirectory = path.resolve(process.cwd(), "../ai-service/snapFood-ai/models");
const auditFilePath = path.join(path.dirname(logFilePath), "admin-audit.jsonl");

export function formatLogLevel(level?: string): string {
  if (!level) return "info";
  switch (level.toLowerCase()) {
    case "warn":
      return "warning";
    case "error":
      return "error";
    default:
      return level.toLowerCase();
  }
}

export function getLogSnapshot(logs: SystemLogEntry[] = [], limit = 25): SystemLogSnapshot {
  const safeLogs = logs
    .filter((log) => typeof log?.message === "string" && log.message.trim().length > 0)
    .slice(-Math.max(1, limit));

  return {
    logs: safeLogs,
    total: logs.length,
    limit: Math.max(1, limit),
  };
}

async function listResources(directory: string): Promise<OperationalResource[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(directory, entry.name);
          const stats = await fs.stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            sizeBytes: stats.size,
            updatedAt: stats.mtime.toISOString(),
          };
        }),
    );
    return files.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } catch {
    return [];
  }
}

async function readRecentLogs(limit = 25): Promise<SystemLogEntry[]> {
  try {
    const content = await fs.readFile(logFilePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-Math.max(1, limit));

    const entries = lines.map((line): SystemLogEntry | null => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        try {
          const parsed = JSON.parse(trimmed);
          const message = typeof parsed.message === "string" ? parsed.message : typeof parsed.msg === "string" ? parsed.msg : String(parsed);
          return {
            timestamp: parsed.timestamp ?? new Date().toISOString(),
            level: formatLogLevel(parsed.level ?? "info"),
            message,
            source: parsed.source ?? parsed.service ?? "backend",
            meta: parsed.meta ?? parsed,
          };
        } catch {
          const match = trimmed.match(/\[(\w+)\]\s*:\s*(.*)/);
          if (match) {
            return {
              timestamp: new Date().toISOString(),
              level: formatLogLevel(match[1]),
              message: match[2] ?? trimmed,
              source: "backend",
            };
          }
          return {
            timestamp: new Date().toISOString(),
            level: "info",
            message: trimmed,
            source: "backend",
          };
        }
      });
    return entries.filter((entry): entry is SystemLogEntry => entry !== null);
  } catch {
    return [];
  }
}

export async function recordAdminAction(
  entry: Omit<AdminAuditEntry, "id" | "timestamp">,
): Promise<void> {
  const auditEntry: AdminAuditEntry = {
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  await fs.appendFile(auditFilePath, `${JSON.stringify(auditEntry)}\n`, "utf8");
}

async function readAdminAudit(limit = 50): Promise<AdminAuditEntry[]> {
  try {
    const content = await fs.readFile(auditFilePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-Math.max(1, Math.min(limit, 200)))
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as AdminAuditEntry];
        } catch {
          return [];
        }
      })
      .reverse();
  } catch {
    return [];
  }
}

export class SystemRepository {
  async getOperationalSummary(): Promise<OperationalSummary> {
    const checkedAt = new Date().toISOString();
    const createdAtColumn = AppDataSource.getMetadata(User).findColumnWithPropertyName("createdAt");
    if (!createdAtColumn) {
      throw new Error("User creation timestamp metadata is unavailable.");
    }
    const quotedCreatedAtColumn = `"${createdAtColumn.databaseName.replace(/"/g, '""')}"`;

    const [
      userResult,
      scanResult,
      latestScanResult,
      riskResult,
      newUsersResult,
      registrationTrendResult,
      scanTrendResult,
      popularFoodsResult,
    ] = await Promise.all([
      AppDataSource.query(
        "SELECT COUNT(*) AS total_users, COUNT(*) FILTER (WHERE status = 'active') AS active_users FROM users",
      ),
      AppDataSource.query("SELECT COUNT(*) AS total_scans FROM food_scan"),
      AppDataSource.query(
        "SELECT MAX(scanned_at) AS latest_scan_at FROM food_scan",
      ),
      AppDataSource.query(
        "SELECT COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk, COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk FROM food_scan",
      ),
      AppDataSource.query(
        `SELECT COUNT(*) AS count FROM users WHERE ${quotedCreatedAtColumn} >= CURRENT_DATE AND ${quotedCreatedAtColumn} < CURRENT_DATE + INTERVAL '1 day'`,
      ),
      AppDataSource.query(
        `SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, COUNT(users.id) AS count FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS days(day) LEFT JOIN users ON users.${quotedCreatedAtColumn} >= day AND users.${quotedCreatedAtColumn} < day + INTERVAL '1 day' GROUP BY day ORDER BY day`,
      ),
      AppDataSource.query(
        "SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, COUNT(food_scan.id) AS count FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS days(day) LEFT JOIN food_scan ON food_scan.scanned_at >= day AND food_scan.scanned_at < day + INTERVAL '1 day' GROUP BY day ORDER BY day",
      ),
      AppDataSource.query(
        "SELECT dish_name AS name, COUNT(*) AS count, AVG(confidence) AS average_confidence FROM food_scan GROUP BY dish_name ORDER BY COUNT(*) DESC, dish_name ASC LIMIT 5",
      ),
    ]);

    const databaseStatus: OperationalStatus = "healthy";
    const userCounts = userResult[0];
    const scanCounts = scanResult[0];
    const latestScanAt = latestScanResult[0].latest_scan_at ?? null;
    const riskCounts = riskResult[0];
    const totalScans = Number(scanCounts.total_scans ?? 0);
    const highRisk = Number(riskCounts.high_risk ?? 0);
    const mediumRisk = Number(riskCounts.medium_risk ?? 0);
    const healthScore = totalScans === 0 ? 0 : Math.max(0, 100 - highRisk * 10 - mediumRisk * 4);
    const recentAdminActions = await readAdminAudit(5);

    const files = await listResources(modelDirectory);

    return {
      generatedAt: checkedAt,
      totalUsers: Number(userCounts.total_users ?? 0),
      activeUsers: Number(userCounts.active_users ?? 0),
      newUsersToday: Number(newUsersResult[0]?.count ?? 0),
      totalScans,
      latestScanAt,
      healthScore,
      registrationTrend: registrationTrendResult.map((point: { date: string; count: string | number }) => ({
        date: point.date,
        count: Number(point.count),
      })),
      scanTrend: scanTrendResult.map((point: { date: string; count: string | number }) => ({
        date: point.date,
        count: Number(point.count),
      })),
      popularFoods: popularFoodsResult.map((food: { name: string; count: string | number; average_confidence: string | number | null }) => ({
        name: food.name,
        count: Number(food.count),
        averageConfidence: Number(food.average_confidence ?? 0),
      })),
      recentAdminActions,
      database: {
        status: databaseStatus,
        checkedAt,
        details: "PostgreSQL query completed successfully.",
      },
      models: {
        status: files.length > 0 ? "healthy" : "warning",
        checkedAt,
        fileCount: files.length,
        files,
      },
      storage: {
        status: "disabled",
        checkedAt,
      },
      diagnosticChecks: [
        {
          id: "database",
          name: "Database connection",
          status: databaseStatus,
          checkedAt,
          details: "PostgreSQL queries returned valid totals.",
        },
        {
          id: "models",
          name: "ML model files",
          status: files.length > 0 ? "healthy" : "warning",
          checkedAt,
          details: `${files.length} model file${files.length === 1 ? "" : "s"} discovered.`,
        },
        {
          id: "storage",
          name: "Disk usage",
          status: "disabled",
          checkedAt,
          details: "Disk reporting is disabled because this process only sees host-local storage.",
        },
      ],
    };
  }

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const generatedAt = new Date().toISOString();
    const backendStatus: OperationalStatus = "healthy";
    let databaseStatus: OperationalStatus = "healthy";
    let databaseDetails = "PostgreSQL connectivity check succeeded.";
    let aiStatus: OperationalStatus = "warning";
    let aiDetails = "AI service is unavailable.";
    let aiVersion: string | null = null;
    let modelCount = 0;

    try {
      await AppDataSource.query("SELECT 1");
    } catch {
      databaseStatus = "error";
      databaseDetails = "PostgreSQL could not be reached.";
    }

    try {
      const aiBaseUrl = getAIServiceBaseUrl(env.AI_URL);
      const response = await axios.get(`${aiBaseUrl}/health`, { timeout: 7000 });
      const payload = response.data ?? {};
      aiStatus = payload.status === "healthy" ? "healthy" : "warning";
      aiDetails = payload.message ?? payload.details ?? "AI service responded successfully.";
      aiVersion = payload.version ?? null;
      modelCount = Array.isArray(payload.models) ? payload.models.length : 0;
    } catch {
      aiStatus = "error";
      aiDetails = "AI service could not be reached.";
    }

    const alerts = await readRecentLogs(10).then((logs) =>
      logs
        .filter((log) => log.level === "error" || log.level === "warning")
        .slice(0, 5)
        .map((log) => ({
          level: log.level,
          message: log.message,
          source: log.source ?? "backend",
          timestamp: log.timestamp,
        })),
    );

    return {
      generatedAt,
      status: [backendStatus, databaseStatus, aiStatus].includes("error")
        ? "error"
        : [backendStatus, databaseStatus, aiStatus].includes("warning")
          ? "warning"
          : "healthy",
      backend: {
        status: backendStatus,
        details: "Backend is responding normally.",
      },
      database: {
        status: databaseStatus,
        details: databaseDetails,
      },
      ai: {
        status: aiStatus,
        details: aiDetails,
        version: aiVersion,
        modelCount,
      },
      alerts,
    };
  }

  async getRecentLogs(limit = 25, level = "all", source = "all"): Promise<SystemLogSnapshot> {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const [backendLogs, aiResult] = await Promise.all([
      source === "ai" ? Promise.resolve([]) : readRecentLogs(safeLimit),
      source === "backend" ? Promise.resolve({ logs: [], available: true }) : this.getAiLogs(safeLimit),
    ]);
    const aiLogs = aiResult.logs;
    const logs = [...backendLogs, ...aiLogs]
      .filter((log) => level === "all" || log.level.toLowerCase() === formatLogLevel(level).toLowerCase())
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, safeLimit);

    const unavailableSources = aiResult.available ? [] : ["ai"];
    return { logs, total: logs.length, limit: safeLimit, unavailableSources };
  }

  async getAdminAudit(limit = 50): Promise<AdminAuditEntry[]> {
    return readAdminAudit(limit);
  }

  private async getAiLogs(limit: number): Promise<{ logs: SystemLogEntry[]; available: boolean }> {
    if (!env.AI_ADMIN_TOKEN) return { logs: [], available: false };
    try {
      const aiBaseUrl = getAIServiceBaseUrl(env.AI_URL);
      const response = await axios.get(`${aiBaseUrl}/admin/logs`, {
        headers: { "X-Admin-Service-Token": env.AI_ADMIN_TOKEN },
        params: { limit },
        timeout: 5000,
      });
      const entries = Array.isArray(response.data?.logs) ? response.data.logs : [];
      const logs = entries.map((entry: Record<string, unknown>) => ({
        timestamp: typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString(),
        level: formatLogLevel(typeof entry.level === "string" ? entry.level : "info"),
        message: typeof entry.message === "string" ? entry.message : "AI service log entry",
        source: "ai",
      }));
      return { logs, available: true };
    } catch {
      return { logs: [], available: false };
    }
  }
}
