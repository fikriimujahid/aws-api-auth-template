import { APIGatewayProxyEventV2 } from "aws-lambda";

const REFRESH_COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME?.trim() || "kjl_rt";
const REFRESH_COOKIE_PATH = process.env.AUTH_REFRESH_COOKIE_PATH?.trim() || "/api/auth";
const REFRESH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN?.trim() || null;
const REFRESH_COOKIE_MAX_AGE_SECONDS = Number(process.env.AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS ?? "2592000");
const REFRESH_COOKIE_SECURE = (process.env.AUTH_COOKIE_SECURE ?? "true").toLowerCase() === "true";
const REFRESH_COOKIE_SAME_SITE = (process.env.AUTH_COOKIE_SAME_SITE ?? "Lax").trim();

const readCookieFromHeader = (cookieHeader: string, key: string): string | null => {
  const cookiePairs = cookieHeader.split(";");

  for (const pair of cookiePairs) {
    const [rawName, ...rawValueParts] = pair.split("=");
    if (!rawName || rawValueParts.length === 0) {
      continue;
    }

    if (rawName.trim() !== key) {
      continue;
    }

    return decodeURIComponent(rawValueParts.join("=").trim());
  }

  return null;
};

export const extractCookieValue = (event: APIGatewayProxyEventV2, key: string): string | null => {
  for (const cookie of event.cookies ?? []) {
    const matched = readCookieFromHeader(cookie, key);
    if (matched) {
      return matched;
    }
  }

  const cookieHeader = event.headers.cookie ?? event.headers.Cookie;
  if (cookieHeader) {
    const matched = readCookieFromHeader(cookieHeader, key);
    if (matched) {
      return matched;
    }
  }

  return null;
};

export const extractRefreshToken = (event: APIGatewayProxyEventV2): string | null => {
  return extractCookieValue(event, REFRESH_COOKIE_NAME);
};

const buildCookie = (name: string, value: string, maxAgeSeconds: number): string => {
  const chunks = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${REFRESH_COOKIE_PATH}`,
    "HttpOnly",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    `SameSite=${REFRESH_COOKIE_SAME_SITE}`
  ];

  if (REFRESH_COOKIE_SECURE) {
    chunks.push("Secure");
  }

  if (REFRESH_COOKIE_DOMAIN) {
    chunks.push(`Domain=${REFRESH_COOKIE_DOMAIN}`);
  }

  return chunks.join("; ");
};

export const buildRefreshCookie = (refreshToken: string): string => {
  return buildCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_MAX_AGE_SECONDS);
};

export const buildClearRefreshCookie = (): string => {
  return buildCookie(REFRESH_COOKIE_NAME, "", 0);
};
