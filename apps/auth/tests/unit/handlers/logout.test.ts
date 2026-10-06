import { APIGatewayProxyEventV2 } from "aws-lambda";
import { logoutHandler } from "../../../src/handlers/logoutHandler";
import { buildClearRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { revokeRefreshToken } from "../../../src/services/cognito";

jest.mock("@shared-utils/cookies", () => ({
  buildClearRefreshCookie: jest.fn(),
  extractRefreshToken: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createSuccessResponse: jest.fn(
    (_: unknown, statusCode: number, data: unknown, options?: { cookies?: string[] }) => ({
      statusCode,
      data,
      options,
      kind: "success"
    })
  )
}));

jest.mock("../../../src/services/cognito", () => ({
  revokeRefreshToken: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/logout"
} as APIGatewayProxyEventV2);

describe("logout handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buildClearRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=; Max-Age=0");
  });

  it("returns success and clear cookie even when no refresh token exists", async () => {
    const event = createEvent();
    (extractRefreshToken as jest.Mock).mockReturnValue("");

    const result = await logoutHandler(event);

    expect(revokeRefreshToken).not.toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      { loggedOut: true },
      { cookies: ["kjl_rt=; Max-Age=0"] }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: { loggedOut: true },
      options: { cookies: ["kjl_rt=; Max-Age=0"] },
      kind: "success"
    });
  });

  it("revokes refresh token when present", async () => {
    const event = createEvent();
    (extractRefreshToken as jest.Mock).mockReturnValue("refresh-token");
    (revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await logoutHandler(event);

    expect(revokeRefreshToken).toHaveBeenCalledWith("refresh-token");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      { loggedOut: true },
      { cookies: ["kjl_rt=; Max-Age=0"] }
    );
  });

  it("still logs out when revokeRefreshToken throws", async () => {
    const event = createEvent();
    (extractRefreshToken as jest.Mock).mockReturnValue("refresh-token");
    (revokeRefreshToken as jest.Mock).mockRejectedValue(new Error("revoke failed"));

    const result = await logoutHandler(event);

    expect(revokeRefreshToken).toHaveBeenCalledWith("refresh-token");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      { loggedOut: true },
      { cookies: ["kjl_rt=; Max-Age=0"] }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: { loggedOut: true },
      options: { cookies: ["kjl_rt=; Max-Age=0"] },
      kind: "success"
    });
  });
});
