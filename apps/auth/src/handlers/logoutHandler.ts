import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { logoutSchema } from "../schemas/logoutSchema";
import { logout } from "../use-cases/logout";

export const logoutHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedPayload = logoutSchema.safeParseEvent(event);

  await logout({ refreshToken: parsedPayload.data.refreshToken });

  return createSuccessResponse(
    event,
    200,
    {
      loggedOut: true
    },
    {
      cookies: [buildClearRefreshCookie()]
    }
  );
};