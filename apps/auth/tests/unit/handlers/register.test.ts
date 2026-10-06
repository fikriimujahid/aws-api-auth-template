import { APIGatewayProxyEventV2 } from "aws-lambda";
import { registerHandler } from "../../../src/handlers/registerHandler";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { registerWithPassword } from "../../../src/services/cognito";

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
  registerWithPassword: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/register"
} as APIGatewayProxyEventV2);

describe("register handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockImplementation(() => {
      throw new Error("invalid json");
    });

    const result = await registerHandler(event);

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

  it("returns 400 when fullName, email, or password is missing", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockReturnValue({ fullName: "", email: "", password: "" });

    const result = await registerHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(
      event,
      400,
      "fullName, email, and password are required",
      {
        code: "VALIDATION_ERROR"
      }
    );
    expect(result).toEqual({
      statusCode: 400,
      message: "fullName, email, and password are required",
      meta: { code: "VALIDATION_ERROR" },
      kind: "error"
    });
    expect(registerWithPassword).not.toHaveBeenCalled();
  });

  it("registers successfully and returns confirmation details", async () => {
    const event = createEvent();
    const registerResult = {
      userConfirmed: false,
      codeDeliveryDetails: {
        attributeName: "email",
        deliveryMedium: "EMAIL",
        destination: "u***@example.com"
      }
    };

    (parseEventBody as jest.Mock).mockReturnValue({
      fullName: "  User Name  ",
      email: " user@example.com ",
      password: "Password123!"
    });
    (registerWithPassword as jest.Mock).mockResolvedValue(registerResult);

    const result = await registerHandler(event);

    expect(registerWithPassword).toHaveBeenCalledWith("user@example.com", "Password123!", "User Name");
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      userConfirmed: false,
      codeDeliveryDetails: registerResult.codeDeliveryDetails
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        userConfirmed: false,
        codeDeliveryDetails: registerResult.codeDeliveryDetails
      },
      kind: "success"
    });
  });

  it("maps CognitoOperationError to API error response", async () => {
    const event = createEvent();
    const cognitoError = new CognitoOperationError("Already exists", "UsernameExistsException", 409);

    (parseEventBody as jest.Mock).mockReturnValue({
      fullName: "User Name",
      email: "user@example.com",
      password: "Password123!"
    });
    (registerWithPassword as jest.Mock).mockRejectedValue(cognitoError);

    const result = await registerHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 409, "Already exists", {
      code: "UsernameExistsException"
    });
    expect(result).toEqual({
      statusCode: 409,
      message: "Already exists",
      meta: { code: "UsernameExistsException" },
      kind: "error"
    });
  });

  it("returns generic 500 for unexpected errors", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({
      fullName: "User Name",
      email: "user@example.com",
      password: "Password123!"
    });
    (registerWithPassword as jest.Mock).mockRejectedValue(new Error("timeout"));

    const result = await registerHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 500, "Registration failed", {
      code: "REGISTRATION_FAILED"
    });
    expect(result).toEqual({
      statusCode: 500,
      message: "Registration failed",
      meta: { code: "REGISTRATION_FAILED" },
      kind: "error"
    });
  });
});
