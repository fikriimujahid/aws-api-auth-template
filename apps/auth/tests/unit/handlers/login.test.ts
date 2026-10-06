import { APIGatewayProxyEventV2 } from "aws-lambda";
import { loginHandler } from "../../../src/handlers/loginHandler";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getAuthUserFromIdToken } from "@shared-cognito/tokens";
import { CognitoOperationError } from "@shared-cognito/core";
import { loginWithPassword } from "../../../src/services/cognito";
import { buildRefreshCookie } from "@shared-utils/cookies";

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
  createSuccessResponse: jest.fn(
    (_: unknown, statusCode: number, data: unknown, options?: { cookies?: string[] }) => ({
      statusCode,
      data,
      options,
      kind: "success"
    })
  )
}));

jest.mock("@shared-cognito/tokens", () => ({
  getAuthUserFromIdToken: jest.fn()
}));

jest.mock("../../../src/services/cognito", () => ({
  loginWithPassword: jest.fn()
}));

jest.mock("@shared-utils/cookies", () => ({
  buildRefreshCookie: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/login"
} as APIGatewayProxyEventV2);

describe("login handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockImplementation(() => {
      throw new Error("bad json");
    });

    const result = await loginHandler(event);

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

  it("returns 400 when email or password is missing", async () => {
    const event = createEvent();
    (parseEventBody as jest.Mock).mockReturnValue({ email: " ", password: "" });

    const result = await loginHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "email and password are required", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "email and password are required",
      meta: { code: "VALIDATION_ERROR" },
      kind: "error"
    });
    expect(loginWithPassword).not.toHaveBeenCalled();
  });

  it("authenticates successfully and returns token + parsed user", async () => {
    const event = createEvent();
    const authResult = {
      accessToken: "access-token",
      idToken: "id-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
      tokenType: "Bearer"
    };
    const user = {
      id: "user-1",
      email: "user@example.com",
      name: "User"
    };

    (parseEventBody as jest.Mock).mockReturnValue({ email: " user@example.com ", password: "pass123" });
    (loginWithPassword as jest.Mock).mockResolvedValue(authResult);
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(user);
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=refresh-token");

    const result = await loginHandler(event);

    expect(loginWithPassword).toHaveBeenCalledWith("user@example.com", "pass123");
    expect(getAuthUserFromIdToken).toHaveBeenCalledWith("id-token");
    expect(buildRefreshCookie).toHaveBeenCalledWith("refresh-token");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      {
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        user
      },
      {
        cookies: ["kjl_rt=refresh-token"]
      }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: {
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
        tokenType: "Bearer",
        user
      },
      options: {
        cookies: ["kjl_rt=refresh-token"]
      },
      kind: "success"
    });
  });

  it("falls back to derived user when ID token has no user payload", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({ email: "alice@example.com", password: "secret" });
    (loginWithPassword as jest.Mock).mockResolvedValue({
      accessToken: "access",
      idToken: "id",
      expiresIn: 1800,
      tokenType: "Bearer"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(null);
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=");

    await loginHandler(event);

    expect(buildRefreshCookie).toHaveBeenCalledWith("");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      expect.objectContaining({
        user: {
          id: "alice@example.com",
          email: "alice@example.com",
          name: "alice"
        }
      }),
      {
        cookies: ["kjl_rt="]
      }
    );
  });

  it("maps CognitoOperationError to API error response", async () => {
    const event = createEvent();
    const cognitoError = new CognitoOperationError("Unauthorized", "NotAuthorizedException", 401);

    (parseEventBody as jest.Mock).mockReturnValue({ email: "user@example.com", password: "wrong" });
    (loginWithPassword as jest.Mock).mockRejectedValue(cognitoError);

    const result = await loginHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 401, "Unauthorized", {
      code: "NotAuthorizedException"
    });
    expect(result).toEqual({
      statusCode: 401,
      message: "Unauthorized",
      meta: { code: "NotAuthorizedException" },
      kind: "error"
    });
  });

  it("returns generic 500 for unexpected errors", async () => {
    const event = createEvent();

    (parseEventBody as jest.Mock).mockReturnValue({ email: "user@example.com", password: "pass" });
    (loginWithPassword as jest.Mock).mockRejectedValue(new Error("network down"));

    const result = await loginHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 500, "Login failed", {
      code: "LOGIN_FAILED"
    });
    expect(result).toEqual({
      statusCode: 500,
      message: "Login failed",
      meta: { code: "LOGIN_FAILED" },
      kind: "error"
    });
  });
});
