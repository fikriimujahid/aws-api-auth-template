import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { CognitoOperationError } from "@shared-cognito/core";
import { createErrorResponse } from "@shared-utils/response";
import { InvalidIdTokenError } from "./applicationErrors";

export interface AuthErrorFallback {
  statusCode: number;
  message: string;
  code: string;
}

export const mapAuthErrorToResponse = (
  event: APIGatewayProxyEventV2,
  error: unknown,
  fallback: AuthErrorFallback
): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof InvalidIdTokenError) {
    return createErrorResponse(event, 502, error.message, {
      code: "INVALID_ID_TOKEN"
    });
  }

  if (error instanceof CognitoOperationError) {
    return createErrorResponse(event, error.statusCode, error.message, {
      code: error.code
    });
  }

  return createErrorResponse(event, fallback.statusCode, fallback.message, {
    code: fallback.code
  });
};