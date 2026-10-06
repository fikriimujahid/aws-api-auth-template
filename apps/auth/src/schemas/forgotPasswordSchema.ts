import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface ForgotPasswordPayload {
  email: string;
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

const readEmail = (payload: Record<string, unknown>): string | null => {
  const value = payload.email;
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  return normalizedValue.length > 0 ? normalizedValue : null;
};

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const safeParsePayload = (input: unknown): SafeParseResult<ForgotPasswordPayload> => {
  const payload = normalizePayloadObject(input);
  const email = readEmail(payload);

  if (!email) {
    return {
      success: false,
      error: "email is required"
    };
  }

  return {
    success: true,
    data: {
      email
    }
  };
};

export const forgotPasswordSchema = {
  safeParse: (input: unknown): SafeParseResult<ForgotPasswordPayload> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<ForgotPasswordPayload> => {
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