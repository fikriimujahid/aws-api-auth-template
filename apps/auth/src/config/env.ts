import {
  defineEnvSchema,
  InferEnv,
  parseBooleanEnv,
  parseNumberEnv,
  validateEnv
} from "@shared-utils/env";

const authEnvSchema = defineEnvSchema({
  COGNITO_API_ENDPOINT: { required: true },
  COGNITO_USER_POOL_CLIENT_ID: { required: true },
  AUTH_ALLOWED_ORIGIN: { defaultValue: "" },
  AUTH_COOKIE_DOMAIN: { defaultValue: "" },
  AUTH_COOKIE_SECURE: { defaultValue: true, parse: parseBooleanEnv },
  AUTH_COOKIE_SAME_SITE: { defaultValue: "Lax" },
  AUTH_REFRESH_COOKIE_NAME: { defaultValue: "kjl_rt" },
  AUTH_REFRESH_COOKIE_PATH: { defaultValue: "/api/auth" },
  AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: { defaultValue: 2592000, parse: parseNumberEnv }
});

export type AuthServiceEnv = InferEnv<typeof authEnvSchema>;

let cachedEnv: AuthServiceEnv | null = null;

export const getAuthServiceEnv = () => {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env, authEnvSchema);
  }

  return cachedEnv;
};
