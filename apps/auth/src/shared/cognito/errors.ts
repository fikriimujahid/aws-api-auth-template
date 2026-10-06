import type { CognitoErrorPayload } from "./types";

export class CognitoOperationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "InternalError", statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const mapCognitoErrorToHttp = (payload: CognitoErrorPayload): CognitoOperationError => {
  const errorCode = typeof payload.__type === "string" ? payload.__type.split("#").pop() ?? "CognitoError" : "CognitoError";
  const message = payload.message || "Cognito request failed";

  switch (errorCode) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return new CognitoOperationError(message, errorCode, 401);
    case "UserNotConfirmedException":
      return new CognitoOperationError(message, errorCode, 403);
    case "UsernameExistsException":
      return new CognitoOperationError(message, errorCode, 409);
    case "InvalidParameterException":
    case "InvalidPasswordException":
      return new CognitoOperationError(message, errorCode, 400);
    case "TooManyRequestsException":
      return new CognitoOperationError(message, errorCode, 429);
    default:
      return new CognitoOperationError(message, errorCode, 502);
  }
};