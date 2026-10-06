export type LogLevel = "info" | "warn" | "error";

export interface LoggerContext {
  [key: string]: unknown;
}

export interface Logger {
  info: (event: string, context?: LoggerContext) => void;
  warn: (event: string, context?: LoggerContext) => void;
  error: (event: string, context?: LoggerContext) => void;
}

const MAX_LOG_STRING_LENGTH = 2000;
const MAX_LOG_DEPTH = 5;

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "setcookie",
  "password",
  "token",
  "accesstoken",
  "idtoken",
  "refreshtoken",
  "serverkey",
  "secret",
  "signature",
  "signaturekey"
]);

const normalizeKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const isSensitiveKey = (key: string): boolean => SENSITIVE_KEYS.has(normalizeKey(key));

const truncateString = (value: string): string => {
  if (value.length <= MAX_LOG_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_LOG_STRING_LENGTH)}...<truncated>`;
};

const serializeError = (error: Error): Record<string, unknown> => {
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message
  };

  if (typeof error.stack === "string" && error.stack.trim()) {
    serialized.stack = truncateString(error.stack);
  }

  const candidate = error as Error & { code?: unknown; statusCode?: unknown };

  if (candidate.code !== undefined) {
    serialized.code = candidate.code;
  }

  if (candidate.statusCode !== undefined) {
    serialized.statusCode = candidate.statusCode;
  }

  return serialized;
};

const sanitizeLogValue = (value: unknown, depth: number): unknown => {
  if (depth >= MAX_LOG_DEPTH) {
    return "[MaxDepthExceeded]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = isSensitiveKey(key)
        ? "[REDACTED]"
        : sanitizeLogValue(entryValue, depth + 1);
    }

    return sanitized;
  }

  return String(value);
};

const writeLog = (level: LogLevel, service: string, event: string, context: LoggerContext = {}): void => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service,
    event,
    ...(sanitizeLogValue(context, 0) as Record<string, unknown>)
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
};

export const createLogger = (service: string): Logger => ({
  info: (event, context) => writeLog("info", service, event, context),
  warn: (event, context) => writeLog("warn", service, event, context),
  error: (event, context) => writeLog("error", service, event, context)
});

export const redactLogContext = (context: LoggerContext): LoggerContext => {
  return (sanitizeLogValue(context, 0) as LoggerContext) ?? {};
};