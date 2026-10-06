import { getAuthServiceEnv } from "../config/env";
import { createCognitoClient } from "@shared-cognito/client";

const getCognitoConfig = () => {
  const { COGNITO_API_ENDPOINT, COGNITO_USER_POOL_CLIENT_ID } = getAuthServiceEnv();

  return {
    apiEndpoint: String(COGNITO_API_ENDPOINT).trim(),
    userPoolClientId: String(COGNITO_USER_POOL_CLIENT_ID).trim()
  };
};

const getCognitoClient = () => createCognitoClient(getCognitoConfig());

export const loginWithPassword = (email: string, password: string) => {
  return getCognitoClient().loginWithPassword(email, password);
};

export const refreshWithToken = (refreshToken: string) => {
  return getCognitoClient().refreshWithToken(refreshToken);
};

export const revokeRefreshToken = (refreshToken: string) => {
  return getCognitoClient().revokeRefreshToken(refreshToken);
};

export const registerWithPassword = (email: string, password: string, fullName: string) => {
  return getCognitoClient().registerWithPassword(email, password, fullName);
};

export const requestForgotPassword = (email: string) => {
  return getCognitoClient().requestForgotPassword(email);
};

export const confirmForgotPassword = (
  email: string,
  confirmationCode: string,
  newPassword: string
) => {
  return getCognitoClient().confirmForgotPassword(email, confirmationCode, newPassword);
};

export const updateUserLastCheckinDate = (accessToken: string, lastCheckinDate: string) => {
  return getCognitoClient().updateUserAttributes(accessToken, [
    {
      name: "custom:last_checkin_date",
      value: lastCheckinDate
    }
  ]);
};
