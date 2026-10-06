import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { authSessionSchema } from "./schemas";

export const refreshDocPath = "/api/auth/refresh";

export const refreshDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Refresh auth session from refresh token cookie",
    tags: ["Auth"],
    responses: {
      "200": createOkResponse(authSessionSchema),
      ...commonErrorResponses
    }
  }
};
