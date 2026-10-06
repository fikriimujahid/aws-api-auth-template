import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { forgotPasswordSchema } from "../schemas/forgotPasswordSchema";
import { forgotPassword } from "../use-cases/forgotPassword";

export const forgotPasswordHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = forgotPasswordSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: parsedPayload.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  try {
    const result = await forgotPassword({ email: parsedPayload.data.email });
    return createSuccessResponse(event, 200, {
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to request password reset",
      code: "FORGOT_PASSWORD_FAILED"
    });
  }
};