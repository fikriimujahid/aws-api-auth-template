import { APIGatewayProxyEventV2 } from "aws-lambda";
import { extractRefreshToken } from "@shared-utils/cookies";

interface SessionRequest {
  refreshToken: string | null;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

type SafeParseResult<T> = SafeParseSuccess<T>;

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const safeParsePayload = (input: unknown): SafeParseResult<SessionRequest> => {
  const payload = normalizePayloadObject(input);
  const refreshToken = payload.refreshToken;

  return {
    success: true,
    data: {
      refreshToken: typeof refreshToken === "string" && refreshToken.length > 0 ? refreshToken : null
    }
  };
};

export const sessionSchema = {
  safeParse: (input: unknown): SafeParseResult<SessionRequest> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<SessionRequest> => {
    return safeParsePayload({ refreshToken: extractRefreshToken(event) });
  }
};