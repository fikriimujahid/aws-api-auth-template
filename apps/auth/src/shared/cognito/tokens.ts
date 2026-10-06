import type { AuthUser, JwtPayload } from "./types";

export type { AuthUser, JwtPayload } from "./types";

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

export const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadJson = decodeBase64Url(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

export const getAuthUserFromIdToken = (idToken: string): AuthUser | null => {
  const payload = parseJwtPayload(idToken);
  if (!payload) {
    return null;
  }

  const id = payload.sub ?? payload["cognito:username"] ?? "";
  const email = payload.email ?? "";
  const name = payload.name ?? payload.email ?? "Pengguna";

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    name,
    lastCheckinDate: payload["custom:last_checkin_date"]
  };
};