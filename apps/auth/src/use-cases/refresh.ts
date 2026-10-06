import { getAuthUserFromIdToken } from "@shared-cognito/tokens";
import { refreshWithToken } from "../services/cognito";
import { InvalidIdTokenError } from "../errors/applicationErrors";

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  idToken: string;
  expiresIn: number | undefined;
  tokenType: string | undefined;
  user: {
    id: string;
    email: string;
    name: string;
  };
  nextRefreshToken: string;
}

export const refresh = async (input: RefreshInput): Promise<RefreshResult> => {
  const authResult = await refreshWithToken(input.refreshToken);
  const user = getAuthUserFromIdToken(authResult.idToken);

  if (!user) {
    throw new InvalidIdTokenError();
  }

  return {
    accessToken: authResult.accessToken,
    idToken: authResult.idToken,
    expiresIn: authResult.expiresIn,
    tokenType: authResult.tokenType,
    user,
    nextRefreshToken: authResult.refreshToken ?? input.refreshToken
  };
};