import { mapForgotPasswordResult, mapSignUpResult, validateAuthResult } from "./auth";
import { CognitoOperationError } from "./errors";
import { postToCognito } from "./http";
import type {
  CognitoAuthResult,
  CognitoClientConfig,
  CognitoForgotPasswordSuccess,
  CognitoInitiateAuthSuccess,
  CognitoSignUpSuccess,
  ForgotPasswordResult,
  SignUpResult
} from "./types";

const COGNITO_TARGETS = {
  confirmForgotPassword: "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
  forgotPassword: "AWSCognitoIdentityProviderService.ForgotPassword",
  initiateAuth: "AWSCognitoIdentityProviderService.InitiateAuth",
  updateUserAttributes: "AWSCognitoIdentityProviderService.UpdateUserAttributes",
  revokeToken: "AWSCognitoIdentityProviderService.RevokeToken",
  signUp: "AWSCognitoIdentityProviderService.SignUp"
} as const;

const normalizeConfig = (config: CognitoClientConfig): CognitoClientConfig => {
  return {
    ...config,
    apiEndpoint: String(config.apiEndpoint).trim(),
    userPoolClientId: String(config.userPoolClientId).trim()
  };
};

export const createCognitoClient = (config: CognitoClientConfig) => {
  const normalizedConfig = normalizeConfig(config);

  const post = <TResponse>(target: string, payload: Record<string, unknown>) => {
    return postToCognito<TResponse>(
      normalizedConfig.apiEndpoint,
      target,
      payload,
      normalizedConfig.fetcher ?? fetch
    );
  };

  const loginWithPassword = async (email: string, password: string): Promise<CognitoAuthResult> => {
    const result = await post<CognitoInitiateAuthSuccess>(COGNITO_TARGETS.initiateAuth, {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: normalizedConfig.userPoolClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const authResult = validateAuthResult(result);

    if (!authResult.refreshToken) {
      throw new CognitoOperationError("Login succeeded but refresh token is missing", "MissingRefreshToken", 502);
    }

    return authResult;
  };

  const refreshWithToken = async (refreshToken: string): Promise<CognitoAuthResult> => {
    const result = await post<CognitoInitiateAuthSuccess>(COGNITO_TARGETS.initiateAuth, {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: normalizedConfig.userPoolClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    });

    return validateAuthResult(result);
  };

  const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
    await post<Record<string, unknown>>(COGNITO_TARGETS.revokeToken, {
      ClientId: normalizedConfig.userPoolClientId,
      Token: refreshToken
    });
  };

  const registerWithPassword = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<SignUpResult> => {
    const result = await post<CognitoSignUpSuccess>(COGNITO_TARGETS.signUp, {
      ClientId: normalizedConfig.userPoolClientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email
        },
        {
          Name: "name",
          Value: fullName
        }
      ]
    });

    return mapSignUpResult(result);
  };

  const requestForgotPassword = async (email: string): Promise<ForgotPasswordResult> => {
    const result = await post<CognitoForgotPasswordSuccess>(COGNITO_TARGETS.forgotPassword, {
      ClientId: normalizedConfig.userPoolClientId,
      Username: email
    });

    return mapForgotPasswordResult(result);
  };

  const updateUserAttributes = async (
    accessToken: string,
    attributes: Array<{ name: string; value: string }>
  ): Promise<void> => {
    await post<Record<string, unknown>>(COGNITO_TARGETS.updateUserAttributes, {
      AccessToken: accessToken,
      UserAttributes: attributes.map((attribute) => ({
        Name: attribute.name,
        Value: attribute.value
      }))
    });
  };

  const confirmForgotPassword = async (
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> => {
    await post<Record<string, unknown>>(COGNITO_TARGETS.confirmForgotPassword, {
      ClientId: normalizedConfig.userPoolClientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    });
  };

  return {
    confirmForgotPassword,
    loginWithPassword,
    refreshWithToken,
    registerWithPassword,
    requestForgotPassword,
    updateUserAttributes,
    revokeRefreshToken
  };
};