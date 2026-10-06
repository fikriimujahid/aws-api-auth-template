export const ROUTES = {
  LOGIN: {
    method: "POST",
    path: "/api/auth/login",
    routeKey: "POST /api/auth/login",
  },
  REGISTER: {
    method: "POST",
    path: "/api/auth/register",
    routeKey: "POST /api/auth/register",
  },
  FORGOT_PASSWORD: {
    method: "POST",
    path: "/api/auth/forgot-password",
    routeKey: "POST /api/auth/forgot-password",
  },
  CONFIRM_FORGOT_PASSWORD: {
    method: "POST",
    path: "/api/auth/forgot-password/confirm",
    routeKey: "POST /api/auth/forgot-password/confirm",
  },
  REFRESH: {
    method: "POST",
    path: "/api/auth/refresh",
    routeKey: "POST /api/auth/refresh",
  },
  LOGOUT: {
    method: "POST",
    path: "/api/auth/logout",
    routeKey: "POST /api/auth/logout",
  },
  SESSION: {
    method: "GET",
    path: "/api/auth/session",
    routeKey: "GET /api/auth/session",
  },
} as const;
