import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { confirmForgotPasswordSchema } from "../schemas/confirmForgotPasswordSchema";
import { confirmForgotPassword } from "../use-cases/confirmForgotPassword";

export const confirmForgotPasswordHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = confirmForgotPasswordSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: parsedPayload.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  try {
    const result = await confirmForgotPassword({
      email: parsedPayload.data.email,
      code: parsedPayload.data.code,
      newPassword: parsedPayload.data.newPassword
    });
    return createSuccessResponse(event, 200, result);
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to confirm password reset",
      code: "CONFIRM_PASSWORD_RESET_FAILED"
    });
  }
};