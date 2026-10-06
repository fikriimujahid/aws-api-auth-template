export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastCheckinDate?: string;
}

export type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  ["cognito:username"]?: string;
  ["custom:last_checkin_date"]?: string;
};

export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface SignUpResult {
  userConfirmed: boolean;
  codeDeliveryDetails: {
    attributeName?: string;
    deliveryMedium?: string;
    destination?: string;
  } | null;
}

export interface ForgotPasswordResult {
  codeDeliveryDetails: {
    attributeName?: string;
    deliveryMedium?: string;
    destination?: string;
  } | null;
}

export interface CognitoErrorPayload {
  __type?: string;
  message?: string;
}

export interface CognitoInitiateAuthSuccess {
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    ExpiresIn?: number;
    TokenType?: string;
  };
  ChallengeName?: string;
}

export interface CognitoSignUpSuccess {
  UserConfirmed?: boolean;
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
}

export interface CognitoForgotPasswordSuccess {
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
}

export interface CognitoClientConfig {
  apiEndpoint: string;
  userPoolClientId: string;
  fetcher?: typeof fetch;
}