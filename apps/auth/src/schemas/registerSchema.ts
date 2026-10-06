import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: string;
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const readFullName = (payload: Record<string, unknown>): string | null => {
  const value = payload.fullName;
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  return normalizedValue.length > 0 ? normalizedValue : null;
};

const readEmail = (payload: Record<string, unknown>): string | null => {
  const value = payload.email;
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  return normalizedValue.length > 0 ? normalizedValue : null;
};

const readPassword = (payload: Record<string, unknown>): string | null => {
  const value = payload.password;

  if (typeof value !== "string") {
    return null;
  }

  return value.length > 0 ? value : null;
};

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const safeParsePayload = (input: unknown): SafeParseResult<RegisterPayload> => {
  const payload = normalizePayloadObject(input);
  const fullName = readFullName(payload);
  const email = readEmail(payload);
  const password = readPassword(payload);

  if (!fullName || !email || !password) {
    return {
      success: false,
      error: "fullName, email, and password are required"
    };
  }

  return {
    success: true,
    data: {
      fullName,
      email,
      password
    }
  };
};

export const registerSchema = {
  safeParse: (input: unknown): SafeParseResult<RegisterPayload> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<RegisterPayload> => {
    try {
      return safeParsePayload(parseEventBody(event));
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};