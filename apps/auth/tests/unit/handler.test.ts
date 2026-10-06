import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ROUTES } from "../../src/routes";
import { handler } from "../../src/handler";
import { getAuthServiceEnv } from "../../src/config/env";
import { optionsResponse, createErrorResponse } from "@shared-utils/response";
import { loginHandler } from "../../src/handlers/loginHandler";
import { registerHandler } from "../../src/handlers/registerHandler";
import { forgotPasswordHandler } from "../../src/handlers/forgotPasswordHandler";
import { confirmForgotPasswordHandler } from "../../src/handlers/confirmForgotPasswordHandler";
import { checkinHandler } from "../../src/handlers/checkinHandler";
import { getCheckinActivityHandler } from "../../src/handlers/getCheckinActivityHandler";
import { refreshHandler } from "../../src/handlers/refreshHandler";
import { logoutHandler } from "../../src/handlers/logoutHandler";
import { sessionHandler } from "../../src/handlers/sessionHandler";

jest.mock("../../src/config/env", () => ({
  getAuthServiceEnv: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  optionsResponse: jest.fn(),
  createErrorResponse: jest.fn()
}));

jest.mock("../../src/handlers/loginHandler", () => ({ loginHandler: jest.fn() }));
jest.mock("../../src/handlers/registerHandler", () => ({ registerHandler: jest.fn() }));
jest.mock("../../src/handlers/forgotPasswordHandler", () => ({ forgotPasswordHandler: jest.fn() }));
jest.mock("../../src/handlers/confirmForgotPasswordHandler", () => ({ confirmForgotPasswordHandler: jest.fn() }));
jest.mock("../../src/handlers/checkinHandler", () => ({ checkinHandler: jest.fn() }));
jest.mock("../../src/handlers/getCheckinActivityHandler", () => ({ getCheckinActivityHandler: jest.fn() }));
jest.mock("../../src/handlers/refreshHandler", () => ({ refreshHandler: jest.fn() }));
jest.mock("../../src/handlers/logoutHandler", () => ({ logoutHandler: jest.fn() }));
jest.mock("../../src/handlers/sessionHandler", () => ({ sessionHandler: jest.fn() }));

const createEvent = (
  routeKey: string,
  method: string = "POST"
): APIGatewayProxyEventV2 =>
  ({
    routeKey,
    requestContext: {
      http: {
        method
      }
    }
  }) as APIGatewayProxyEventV2;

describe("handler entrypoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads env eagerly during module initialization", () => {
    jest.resetModules();

    jest.isolateModules(() => {
      require("../../src/handler");
      const envModule = require("../../src/config/env");

      expect(envModule.getAuthServiceEnv).toHaveBeenCalledTimes(1);
    });
  });

  it("returns CORS options response on OPTIONS method", async () => {
    const event = createEvent("OPTIONS /any", "OPTIONS");
    const optionsResult = { statusCode: 204 } as APIGatewayProxyStructuredResultV2;
    (optionsResponse as jest.Mock).mockReturnValue(optionsResult);

    const result = await handler(event);

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"request.received"'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"request.succeeded"'));
    expect(optionsResponse).toHaveBeenCalledWith(event);
    expect(result).toBe(optionsResult);
  });

  it.each([
    [ROUTES.CHECKIN.routeKey, checkinHandler],
    [ROUTES.GET_CHECKIN_ACTIVITY.routeKey, getCheckinActivityHandler],
    [ROUTES.LOGIN.routeKey, loginHandler],
    [ROUTES.REGISTER.routeKey, registerHandler],
    [ROUTES.FORGOT_PASSWORD.routeKey, forgotPasswordHandler],
    [ROUTES.CONFIRM_FORGOT_PASSWORD.routeKey, confirmForgotPasswordHandler],
    [ROUTES.REFRESH.routeKey, refreshHandler],
    [ROUTES.LOGOUT.routeKey, logoutHandler],
    [ROUTES.SESSION.routeKey, sessionHandler]
  ])("dispatches route %s to its handler", async (routeKey, routeHandler) => {
    const method = routeKey === ROUTES.SESSION.routeKey || routeKey === ROUTES.GET_CHECKIN_ACTIVITY.routeKey
      ? "GET"
      : "POST";
    const event = createEvent(routeKey as string, method);
    const expected = { statusCode: 200, body: JSON.stringify({ ok: true }) };

    (routeHandler as jest.Mock).mockResolvedValue(expected);

    const result = await handler(event);

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"request.received"'));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"request.succeeded"'));
    expect(routeHandler).toHaveBeenCalledWith(event);
    expect(result).toBe(expected);
  });

  it("logs request.failed when a routed handler returns an error response", async () => {
    const event = createEvent(ROUTES.LOGIN.routeKey);
    const failed = {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: {
          message: "Unauthorized",
          code: "NOT_AUTHORIZED"
        }
      })
    } as APIGatewayProxyStructuredResultV2;

    (loginHandler as jest.Mock).mockResolvedValue(failed);

    const result = await handler(event);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"event":"request.failed"'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"errorCode":"NOT_AUTHORIZED"'));
    expect(result).toBe(failed);
  });

  it("returns 404 when route is not defined", async () => {
    const event = createEvent("GET /api/auth/unknown", "GET");
    const notFound = {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: {
          message: "Route not found",
          code: "ROUTE_NOT_FOUND"
        }
      })
    } as APIGatewayProxyStructuredResultV2;

    (createErrorResponse as jest.Mock).mockReturnValue(notFound);

    const result = await handler(event);

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"event":"request.failed"'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"errorCode":"ROUTE_NOT_FOUND"'));
    expect(createErrorResponse).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
  });
});
