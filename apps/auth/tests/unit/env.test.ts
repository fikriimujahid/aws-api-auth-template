jest.mock("@shared-utils/env", () => ({
  defineEnvSchema: jest.fn((schema: unknown) => schema),
  parseBooleanEnv: jest.fn(),
  parseNumberEnv: jest.fn(),
  validateEnv: jest.fn()
}));

describe("auth env config", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("validates environment once and caches the result", () => {
    jest.isolateModules(() => {
      const sharedEnv = require("@shared-utils/env");
      const fakeEnv = {
        COGNITO_API_ENDPOINT: "https://cognito.example.com",
        COGNITO_USER_POOL_CLIENT_ID: "client-id",
        AUTH_ALLOWED_ORIGIN: "https://example.com",
        AUTH_COOKIE_DOMAIN: "example.com",
        AUTH_COOKIE_SECURE: true,
        AUTH_COOKIE_SAME_SITE: "Lax",
        AUTH_REFRESH_COOKIE_NAME: "kjl_rt",
        AUTH_REFRESH_COOKIE_PATH: "/api/auth",
        AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: 2592000
      };

      sharedEnv.validateEnv.mockReturnValue(fakeEnv);

      const { getAuthServiceEnv } = require("../../src/config/env");
      const first = getAuthServiceEnv();
      const second = getAuthServiceEnv();

      expect(sharedEnv.validateEnv).toHaveBeenCalledTimes(1);
      expect(first).toBe(fakeEnv);
      expect(second).toBe(fakeEnv);
      expect(second).toBe(first);
    });
  });
});
