import { ROUTES } from "../../src/routes";

describe("auth routes", () => {
  it.each([
    ["CHECKIN", ROUTES.CHECKIN, "POST", "/api/auth/checkin", "POST /api/auth/checkin"],
    ["GET_CHECKIN_ACTIVITY", ROUTES.GET_CHECKIN_ACTIVITY, "GET", "/api/auth/checkin", "GET /api/auth/checkin"],
    ["LOGIN", ROUTES.LOGIN, "POST", "/api/auth/login", "POST /api/auth/login"],
    ["REGISTER", ROUTES.REGISTER, "POST", "/api/auth/register", "POST /api/auth/register"],
    [
      "FORGOT_PASSWORD",
      ROUTES.FORGOT_PASSWORD,
      "POST",
      "/api/auth/forgot-password",
      "POST /api/auth/forgot-password"
    ],
    [
      "CONFIRM_FORGOT_PASSWORD",
      ROUTES.CONFIRM_FORGOT_PASSWORD,
      "POST",
      "/api/auth/forgot-password/confirm",
      "POST /api/auth/forgot-password/confirm"
    ],
    ["REFRESH", ROUTES.REFRESH, "POST", "/api/auth/refresh", "POST /api/auth/refresh"],
    ["LOGOUT", ROUTES.LOGOUT, "POST", "/api/auth/logout", "POST /api/auth/logout"],
    ["SESSION", ROUTES.SESSION, "GET", "/api/auth/session", "GET /api/auth/session"]
  ])("keeps %s route contract", (_, route, method, path, routeKey) => {
    expect(route.method).toBe(method);
    expect(route.path).toBe(path);
    expect(route.routeKey).toBe(routeKey);
  });

  it("uses unique route keys for all endpoints", () => {
    const routeKeys = Object.values(ROUTES).map((route) => route.routeKey);
    const uniqueRouteKeys = new Set(routeKeys);

    expect(uniqueRouteKeys.size).toBe(routeKeys.length);
  });
});
