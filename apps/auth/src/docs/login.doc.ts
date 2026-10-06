import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { authSessionSchema } from "./schemas";

export const loginDocPath = "/api/auth/login";

export const loginDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Authenticate with email and password",
    tags: ["Auth"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" }
            }
          }
        }
      }
    },
    responses: {
      "200": createOkResponse(authSessionSchema),
      ...commonErrorResponses
    }
  }
};
