import { APIGatewayProxyEventV2 } from "aws-lambda";
import { extractRefreshToken } from "@shared-utils/cookies";

interface RefreshRequest {
  refreshToken: string;
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

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const safeParsePayload = (input: unknown): SafeParseResult<RefreshRequest> => {
  const payload = normalizePayloadObject(input);
  const refreshToken = payload.refreshToken;

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return {
      success: false,
      error: "Refresh token not found"
    };
  }

  return {
    success: true,
    data: {
      refreshToken
    }
  };
};

export const refreshSchema = {
  safeParse: (input: unknown): SafeParseResult<RefreshRequest> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<RefreshRequest> => {
    return safeParsePayload({ refreshToken: extractRefreshToken(event) });
  }
};