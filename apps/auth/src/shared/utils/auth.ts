import { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

const getJwtClaims = (
  event: APIGatewayProxyEventV2
): Record<string, string> | undefined => {
  return (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
    ?.claims as Record<string, string> | undefined;
};

export const getAuthenticatedUserId = (
  event: APIGatewayProxyEventV2
): string | undefined => {
  const claims = getJwtClaims(event);
  return claims?.sub ?? claims?.["cognito:username"];
};

export const getAuthenticatedUser = (
  event: APIGatewayProxyEventV2
): AuthenticatedUser | null => {
  const claims = getJwtClaims(event);
  const userId = claims?.sub ?? claims?.["cognito:username"];

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    email: claims?.email ?? "",
    name: claims?.name ?? ""
  };
};