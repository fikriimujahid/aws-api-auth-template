import { APIGatewayProxyEventV2 } from "aws-lambda";
import { forgotPasswordHandler } from "../../../src/handlers/forgotPasswordHandler";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { requestForgotPassword } from "../../../src/services/cognito";

jest.mock("@shared-utils/logger", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

jest.mock("@shared-utils/request", () => ({
  parseEventBody: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn((_: unknown, statusCode: number, message: string, meta: unknown) => ({
    statusCode,
    message,
    meta,
    kind: "error"
  })),
  createSuccessResponse: jest.fn((_: unknown, statusCode: number, data: unknown) => ({
    statusCode,
    data,
    kind: "success"
  }))
}));

jest.mock("../../../src/services/cognito", () => ({
  requestForgotPassword: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/forgot-password"
} as APIGatewayProxyEventV2);

describe("forgotPassword handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockImplementation(() => {
      throw new Error("invalid json");
    });

    const result = await forgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Invalid JSON body", {
      code: "INVALID_JSON"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Invalid JSON body",
      meta: { code: "INVALID_JSON" },
      kind: "error"
    });
  });

  it("returns 400 when email is missing", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockReturnValue({ email: "  " });

    const result = await forgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "email is required", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "email is required",
      meta: { code: "VALIDATION_ERROR" },
      kind: "error"
    });
    expect(requestForgotPassword).not.toHaveBeenCalled();
  });

  it("requests reset code successfully", async () => {
    const event = createEvent();
    const forgotPasswordResult = {
      codeDeliveryDetails: {
        attributeName: "email",
        deliveryMedium: "EMAIL",
        destination: "u***@example.com"
      }
    };

    (parseEventBody as jest.Mock).mockReturnValue({ email: " user@example.com " });
    (requestForgotPassword as jest.Mock).mockResolvedValue(forgotPasswordResult);

    const result = await forgotPasswordHandler(event);

    expect(requestForgotPassword).toHaveBeenCalledWith("user@example.com");
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      codeDeliveryDetails: forgotPasswordResult.codeDeliveryDetails
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        codeDeliveryDetails: forgotPasswordResult.codeDeliveryDetails
      },
      kind: "success"
    });
  });

  it("maps CognitoOperationError to API error response", async () => {
    const event = createEvent();
    const cognitoError = new CognitoOperationError("Too many requests", "TooManyRequestsException", 429);

    (parseEventBody as jest.Mock).mockReturnValue({ email: "user@example.com" });
    (requestForgotPassword as jest.Mock).mockRejectedValue(cognitoError);

    const result = await forgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 429, "Too many requests", {
      code: "TooManyRequestsException"
    });
    expect(result).toEqual({
      statusCode: 429,
      message: "Too many requests",
      meta: { code: "TooManyRequestsException" },
      kind: "error"
    });
  });

  it("returns generic 500 for unexpected errors", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({ email: "user@example.com" });
    (requestForgotPassword as jest.Mock).mockRejectedValue(new Error("network issue"));

    const result = await forgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 500, "Failed to request password reset", {
      code: "FORGOT_PASSWORD_FAILED"
    });
    expect(result).toEqual({
      statusCode: 500,
      message: "Failed to request password reset",
      meta: { code: "FORGOT_PASSWORD_FAILED" },
      kind: "error"
    });
  });
});
