import { APIGatewayProxyEventV2 } from "aws-lambda";
import { sessionHandler } from "../../../src/handlers/sessionHandler";
import { buildClearRefreshCookie, buildRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { getAuthUserFromIdToken } from "@shared-cognito/tokens";
import { refreshWithToken } from "../../../src/services/cognito";

jest.mock("@shared-utils/cookies", () => ({
  buildClearRefreshCookie: jest.fn(),
  buildRefreshCookie: jest.fn(),
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

jest.mock("@shared-cognito/tokens", () => ({
  getAuthUserFromIdToken: jest.fn()
}));

jest.mock("../../../src/services/cognito", () => ({
  refreshWithToken: jest.fn()
}));

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "GET"
    }
  },
  routeKey: "GET /api/auth/session"
} as APIGatewayProxyEventV2);

describe("session handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buildClearRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=; Max-Age=0");
  });

  it("returns authenticated=false when refresh token does not exist", async () => {
    const event = createEvent();
    (extractRefreshToken as jest.Mock).mockReturnValue("");

    const result = await sessionHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, { authenticated: false });
    expect(result).toEqual({
      statusCode: 200,
      data: { authenticated: false },
      options: undefined,
      kind: "success"
    });
    expect(refreshWithToken).not.toHaveBeenCalled();
  });

  it("returns authenticated=false and clears cookie when ID token user parsing fails", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("refresh-token");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "access",
      idToken: "id",
      expiresIn: 1200,
      tokenType: "Bearer"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(null);

    const result = await sessionHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      { authenticated: false },
      { cookies: ["kjl_rt=; Max-Age=0"] }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: { authenticated: false },
      options: { cookies: ["kjl_rt=; Max-Age=0"] },
      kind: "success"
    });
  });

  it("returns authenticated=true session payload and rotates cookie", async () => {
    const event = createEvent();
    const user = {
      id: "user-1",
      email: "user@example.com",
      name: "User"
    };

    (extractRefreshToken as jest.Mock).mockReturnValue("old-token");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "new-access",
      idToken: "new-id",
      expiresIn: 3600,
      tokenType: "Bearer",
      refreshToken: "next-token"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(user);
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=next-token");

    const result = await sessionHandler(event);

    expect(refreshWithToken).toHaveBeenCalledWith("old-token");
    expect(buildRefreshCookie).toHaveBeenCalledWith("next-token");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      {
        authenticated: true,
        session: {
          accessToken: "new-access",
          idToken: "new-id",
          expiresIn: 3600,
          tokenType: "Bearer",
          user
        }
      },
      {
        cookies: ["kjl_rt=next-token"]
      }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: {
        authenticated: true,
        session: {
          accessToken: "new-access",
          idToken: "new-id",
          expiresIn: 3600,
          tokenType: "Bearer",
          user
        }
      },
      options: {
        cookies: ["kjl_rt=next-token"]
      },
      kind: "success"
    });
  });

  it("reuses current refresh token when refresh response does not include one", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("current-token");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "new-access",
      idToken: "new-id",
      expiresIn: 3600,
      tokenType: "Bearer"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      name: "User"
    });
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=current-token");

    await sessionHandler(event);

    expect(buildRefreshCookie).toHaveBeenCalledWith("current-token");
  });

  it("returns authenticated=false and clears cookie when refresh throws", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("refresh-token");
    (refreshWithToken as jest.Mock).mockRejectedValue(new Error("cognito unavailable"));

    const result = await sessionHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      { authenticated: false },
      { cookies: ["kjl_rt=; Max-Age=0"] }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: { authenticated: false },
      options: { cookies: ["kjl_rt=; Max-Age=0"] },
      kind: "success"
    });
  });
});
