import { CognitoOperationError } from "./errors";
import type {
  CognitoAuthResult,
  CognitoForgotPasswordSuccess,
  CognitoInitiateAuthSuccess,
  CognitoSignUpSuccess,
  ForgotPasswordResult,
  SignUpResult
} from "./types";

const mapCodeDeliveryDetails = (
  value:
    | CognitoSignUpSuccess["CodeDeliveryDetails"]
    | CognitoForgotPasswordSuccess["CodeDeliveryDetails"]
) => {
  if (!value) {
    return null;
  }

  return {
    attributeName: value.AttributeName,
    deliveryMedium: value.DeliveryMedium,
    destination: value.Destination
  };
};

export const validateAuthResult = (result: CognitoInitiateAuthSuccess): CognitoAuthResult => {
  if (result.ChallengeName) {
    throw new CognitoOperationError(
      "Account requires additional challenge. This flow is not supported yet.",
      "ChallengeRequired",
      400
    );
  }

  const accessToken = result.AuthenticationResult?.AccessToken;
  const idToken = result.AuthenticationResult?.IdToken;

  if (!accessToken || !idToken) {
    throw new CognitoOperationError("Authentication response is missing token data", "InvalidAuthResponse", 502);
  }

  return {
    accessToken,
    idToken,
    refreshToken: result.AuthenticationResult?.RefreshToken,
    expiresIn: result.AuthenticationResult?.ExpiresIn,
    tokenType: result.AuthenticationResult?.TokenType
  };
};

export const mapSignUpResult = (result: CognitoSignUpSuccess): SignUpResult => {
  return {
    userConfirmed: Boolean(result.UserConfirmed),
    codeDeliveryDetails: mapCodeDeliveryDetails(result.CodeDeliveryDetails)
  };
};

export const mapForgotPasswordResult = (result: CognitoForgotPasswordSuccess): ForgotPasswordResult => {
  return {
    codeDeliveryDetails: mapCodeDeliveryDetails(result.CodeDeliveryDetails)
  };
};