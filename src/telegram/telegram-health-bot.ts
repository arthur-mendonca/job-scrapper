export interface HealthResponse {
  status?: string;
  database?: string;
  uptimeSeconds?: number;
  timestamp?: string;
}

export function parseAllowedChatIds(
  configValue: string,
  fallbackValue: string,
): Set<string> {
  const raw = (configValue || fallbackValue || "").trim();
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set(values);
}

export function isAllowedChat(
  chatId: string | number,
  allowed: Set<string>,
): boolean {
  if (allowed.size === 0) return false;
  return allowed.has(String(chatId));
}

export function isHealthCommand(text: string): boolean {
  const trimmed = text.trim();
  return trimmed === "/health" || trimmed.startsWith("/health ");
}

export function formatHealthOk(health: HealthResponse): string {
  const status = health.status ?? "ok";
  const database = health.database ?? "unknown";
  const uptime =
    typeof health.uptimeSeconds === "number"
      ? `${health.uptimeSeconds}s`
      : "unknown";
  const timestamp = health.timestamp ?? new Date().toISOString();
  return `Health: ${status}\nDatabase: ${database}\nUptime: ${uptime}\nTimestamp: ${timestamp}`;
}

export function formatHealthError(): string {
  return `Health: error\nDatabase: unavailable\nTimestamp: ${new Date().toISOString()}`;
}
