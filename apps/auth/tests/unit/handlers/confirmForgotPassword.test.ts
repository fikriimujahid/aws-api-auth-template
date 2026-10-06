import { APIGatewayProxyEventV2 } from "aws-lambda";
import { confirmForgotPasswordHandler } from "../../../src/handlers/confirmForgotPasswordHandler";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { confirmForgotPassword } from "../../../src/services/cognito";

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
  confirmForgotPassword: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/forgot-password/confirm"
} as APIGatewayProxyEventV2);

describe("confirmPasswordReset handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockImplementation(() => {
      throw new Error("invalid json");
    });

    const result = await confirmForgotPasswordHandler(event);

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

  it("returns 400 when any required field is missing", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockReturnValue({ email: "", code: "", newPassword: "" });

    const result = await confirmForgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(
      event,
      400,
      "email, code, and newPassword are required",
      {
        code: "VALIDATION_ERROR"
      }
    );
    expect(result).toEqual({
      statusCode: 400,
      message: "email, code, and newPassword are required",
      meta: { code: "VALIDATION_ERROR" },
      kind: "error"
    });
    expect(confirmForgotPassword).not.toHaveBeenCalled();
  });

  it("confirms password reset successfully", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({
      email: " user@example.com ",
      code: " 123456 ",
      newPassword: "NewPassword123!"
    });
    (confirmForgotPassword as jest.Mock).mockResolvedValue(undefined);

    const result = await confirmForgotPasswordHandler(event);

    expect(confirmForgotPassword).toHaveBeenCalledWith(
      "user@example.com",
      "123456",
      "NewPassword123!"
    );
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      passwordResetConfirmed: true
    });
    expect(result).toEqual({
      statusCode: 200,
      data: { passwordResetConfirmed: true },
      kind: "success"
    });
  });

  it("maps CognitoOperationError to API error response", async () => {
    const event = createEvent();
    const cognitoError = new CognitoOperationError("Code mismatch", "CodeMismatchException", 400);

    (parseEventBody as jest.Mock).mockReturnValue({
      email: "user@example.com",
      code: "123456",
      newPassword: "NewPassword123!"
    });
    (confirmForgotPassword as jest.Mock).mockRejectedValue(cognitoError);

    const result = await confirmForgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Code mismatch", {
      code: "CodeMismatchException"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Code mismatch",
      meta: { code: "CodeMismatchException" },
      kind: "error"
    });
  });

  it("returns generic 500 for unexpected errors", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({
      email: "user@example.com",
      code: "123456",
      newPassword: "NewPassword123!"
    });
    (confirmForgotPassword as jest.Mock).mockRejectedValue(new Error("upstream down"));

    const result = await confirmForgotPasswordHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 500, "Failed to confirm password reset", {
      code: "CONFIRM_PASSWORD_RESET_FAILED"
    });
    expect(result).toEqual({
      statusCode: 500,
      message: "Failed to confirm password reset",
      meta: { code: "CONFIRM_PASSWORD_RESET_FAILED" },
      kind: "error"
    });
  });
});
