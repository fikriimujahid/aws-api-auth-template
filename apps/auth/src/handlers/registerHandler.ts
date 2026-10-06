import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { registerSchema } from "../schemas/registerSchema";
import { register } from "../use-cases/register";

export const registerHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = registerSchema.safeParseEvent(event);

  if (!parsedPayload.success) {
    return createErrorResponse(event, 400, parsedPayload.error, {
      code: parsedPayload.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  try {
    const result = await register({
      email: parsedPayload.data.email,
      password: parsedPayload.data.password,
      fullName: parsedPayload.data.fullName
    });

    return createSuccessResponse(event, 200, {
      userConfirmed: result.userConfirmed,
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Registration failed",
      code: "REGISTRATION_FAILED"
    });
  }
};