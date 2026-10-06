export interface InternalApiErrorPayload {
  message: string;
  code?: string;
}

export class InternalApiClientError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "InternalApiClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  error: InternalApiErrorPayload;
}

type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export interface InternalApiClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export interface InternalApiRequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 2000;
const INTERNAL_API_KEY_HEADER = "x-internal-api-key";

const normalizeBaseUrl = (baseUrl: string): string => {
  const trimmedBaseUrl = baseUrl.trim();
  return trimmedBaseUrl.endsWith("/")
    ? trimmedBaseUrl.slice(0, -1)
    : trimmedBaseUrl;
};

const buildPathWithQuery = (
  path: string,
  query: Record<string, string> = {}
): string => {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const queryEntries = Object.entries(query).filter(([, value]) => value.trim().length > 0);

  if (queryEntries.length === 0) {
    return pathname;
  }

  const searchParams = new URLSearchParams(queryEntries);
  return `${pathname}?${searchParams.toString()}`;
};

const parseEnvelope = <T>(payload: unknown): ApiEnvelope<T> => {
  if (!payload || typeof payload !== "object") {
    throw new InternalApiClientError("Invalid internal API response payload", 502, "INVALID_RESPONSE");
  }

  const envelope = payload as Partial<ApiEnvelope<T>>;

  if (envelope.success === true && "data" in envelope) {
    return {
      success: true,
      data: envelope.data as T
    };
  }

  if (envelope.success === false && envelope.error && typeof envelope.error === "object") {
    const rawError = envelope.error as Partial<InternalApiErrorPayload>;

    return {
      success: false,
      error: {
        message: typeof rawError.message === "string"
          ? rawError.message
          : "Internal API request failed",
        code: typeof rawError.code === "string" ? rawError.code : undefined
      }
    };
  }

  throw new InternalApiClientError("Invalid internal API response payload", 502, "INVALID_RESPONSE");
};

export const createInternalApiClient = (options: InternalApiClientOptions) => {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const executeGet = async <T>(
    path: string,
    requestOptions: InternalApiRequestOptions = {}
  ): Promise<T> => {
    const requestPath = buildPathWithQuery(path, requestOptions.query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${requestPath}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          [INTERNAL_API_KEY_HEADER]: options.apiKey,
          ...(requestOptions.headers ?? {})
        },
        signal: controller.signal
      });

      let parsedBody: unknown = null;

      try {
        parsedBody = await response.json();
      } catch {
        parsedBody = null;
      }

      if (!response.ok) {
        const envelope = parseEnvelope<never>(parsedBody);
        const errorMessage = envelope.success
          ? "Internal API request failed"
          : envelope.error.message;
        const errorCode = envelope.success
          ? undefined
          : envelope.error.code;

        throw new InternalApiClientError(errorMessage, response.status, errorCode);
      }

      const envelope = parseEnvelope<T>(parsedBody);

      if (!envelope.success) {
        throw new InternalApiClientError(envelope.error.message, response.status, envelope.error.code);
      }

      return envelope.data;
    } catch (error) {
      if (error instanceof InternalApiClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new InternalApiClientError("Internal API request timed out", 504, "INTERNAL_API_TIMEOUT");
      }

      throw new InternalApiClientError("Internal API request failed", 502, "INTERNAL_API_REQUEST_FAILED");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return {
    get: executeGet
  };
};
