import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface ConfirmForgotPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
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

const readCode = (payload: Record<string, unknown>): string | null => {
  const value = payload.code;
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  return normalizedValue.length > 0 ? normalizedValue : null;
};

const readNewPassword = (payload: Record<string, unknown>): string | null => {
  const value = payload.newPassword;

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

const safeParsePayload = (input: unknown): SafeParseResult<ConfirmForgotPasswordPayload> => {
  const payload = normalizePayloadObject(input);
  const email = readEmail(payload);
  const code = readCode(payload);
  const newPassword = readNewPassword(payload);

  if (!email || !code || !newPassword) {
    return {
      success: false,
      error: "email, code, and newPassword are required"
    };
  }

  return {
    success: true,
    data: {
      email,
      code,
      newPassword
    }
  };
};

export const confirmForgotPasswordSchema = {
  safeParse: (input: unknown): SafeParseResult<ConfirmForgotPasswordPayload> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (
    event: APIGatewayProxyEventV2
  ): SafeParseResult<ConfirmForgotPasswordPayload> => {
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