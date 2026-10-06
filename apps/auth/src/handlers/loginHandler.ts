import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie } from "@shared-utils/cookies";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { loginSchema } from "../schemas/loginSchema";
import { login } from "../use-cases/login";

export const loginHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = loginSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: parsedPayload.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  try {
    const result = await login({
      email: parsedPayload.data.email,
      password: parsedPayload.data.password
    });

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
        cookies: [buildRefreshCookie(result.refreshToken)]
      }
    );
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Login failed",
      code: "LOGIN_FAILED"
    });
  }
};