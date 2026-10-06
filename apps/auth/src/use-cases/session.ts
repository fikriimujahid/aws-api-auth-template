import { getAuthUserFromIdToken } from "@shared-cognito/tokens";
import { refreshWithToken } from "../services/cognito";

export interface SessionInput {
  refreshToken: string;
}

export interface SessionResult {
  authenticated: boolean;
  session?: {
    accessToken: string;
    idToken: string;
    expiresIn: number | undefined;
    tokenType: string | undefined;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
  nextRefreshToken?: string;
  clearRefreshCookie?: boolean;
}

export const session = async (input: SessionInput): Promise<SessionResult> => {
  try {
    const authResult = await refreshWithToken(input.refreshToken);
    const user = getAuthUserFromIdToken(authResult.idToken);

    if (!user) {
      return {
        authenticated: false,
        clearRefreshCookie: true
      };
    }

    return {
      authenticated: true,
      session: {
        accessToken: authResult.accessToken,
        idToken: authResult.idToken,
        expiresIn: authResult.expiresIn,
        tokenType: authResult.tokenType,
        user
      },
      nextRefreshToken: authResult.refreshToken ?? input.refreshToken
    };
  } catch {
    return {
      authenticated: false,
      clearRefreshCookie: true
    };
  }
};