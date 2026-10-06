export const bearerAuthScheme = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT"
} as const;

export const withBearerAuth = (security: Array<Record<string, string[]>> = []): Array<Record<string, string[]>> => {
  return [{ bearerAuth: [] }, ...security];
};
