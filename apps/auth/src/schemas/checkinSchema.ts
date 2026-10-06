import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface CheckinRequest {
  productId: string;
  topicId: string;
  sessionId: string;
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

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const safeParsePayload = (input: unknown): SafeParseResult<CheckinRequest> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      success: false,
      error: "Invalid request body"
    };
  }

  const payload = input as Record<string, unknown>;

  if (!isNonEmptyString(payload.productId)) {
    return {
      success: false,
      error: "Missing product id"
    };
  }

  if (!isNonEmptyString(payload.topicId)) {
    return {
      success: false,
      error: "Missing topic id"
    };
  }

  if (!isNonEmptyString(payload.sessionId)) {
    return {
      success: false,
      error: "Missing session id"
    };
  }

  return {
    success: true,
    data: {
      productId: payload.productId.trim(),
      topicId: payload.topicId.trim(),
      sessionId: payload.sessionId.trim()
    }
  };
};

export const checkinSchema = {
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<CheckinRequest> => {
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
