import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie } from "@shared-utils/cookies";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { refreshSchema } from "../schemas/refreshSchema";
import { refresh } from "../use-cases/refresh";

export const refreshHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = refreshSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 401, parsedPayload.error, {
      code: "REFRESH_TOKEN_NOT_FOUND"
    });
  }

  try {
    const result = await refresh({ refreshToken: parsedPayload.data.refreshToken });

    return createSuccessResponse(
      event,
      200,
      {
        accessToken: result.accessToken,
        idToken: result.idToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
        user: result.user
      },
      {
        cookies: [buildRefreshCookie(result.nextRefreshToken)]
      }
    );
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to refresh session",
      code: "REFRESH_FAILED"
    });
  }
};