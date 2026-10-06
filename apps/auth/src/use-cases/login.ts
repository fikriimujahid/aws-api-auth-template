import { getAuthUserFromIdToken } from "@shared-cognito/tokens";
import { loginWithPassword } from "../services/cognito";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  idToken: string;
  expiresIn: number | undefined;
  tokenType: string | undefined;
  user: {
    id: string;
    email: string;
    name: string;
    lastCheckinDate?: string;
  };
  refreshToken: string;
}

export const login = async (input: LoginInput): Promise<LoginResult> => {
  const authResult = await loginWithPassword(input.email, input.password);

  const user = getAuthUserFromIdToken(authResult.idToken) ?? {
    id: input.email,
    email: input.email,
    name: input.email.split("@")[0] || "Pengguna"
  };

  return {
    accessToken: authResult.accessToken,
    idToken: authResult.idToken,
    expiresIn: authResult.expiresIn,
    tokenType: authResult.tokenType,
    user,
    refreshToken: authResult.refreshToken ?? ""
  };
};