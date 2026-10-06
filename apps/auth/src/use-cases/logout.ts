import { revokeRefreshToken } from "../services/cognito";

export interface LogoutInput {
  refreshToken?: string | null;
}

export const logout = async (input: LogoutInput): Promise<void> => {
  if (!input.refreshToken) {
    return;
  }

  try {
    await revokeRefreshToken(input.refreshToken);
  } catch {
    // Continue logout flow even when revoke fails to ensure local cookie is removed.
  }
};