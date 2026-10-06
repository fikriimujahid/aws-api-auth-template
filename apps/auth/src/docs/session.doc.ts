import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { authSessionSchema } from "./schemas";

export const sessionDocPath = "/api/auth/session";

export const sessionDocPathItem: OpenApiPathItem = {
  get: {
    summary: "Get current authentication session status",
    tags: ["Auth"],
    responses: {
      "200": createOkResponse({
        oneOf: [
          {
            type: "object",
            required: ["authenticated"],
            properties: {
              authenticated: { type: "boolean", enum: [false] }
            }
          },
          {
            type: "object",
            required: ["authenticated", "session"],
            properties: {
              authenticated: { type: "boolean", enum: [true] },
              session: authSessionSchema
            }
          }
        ]
      })
    }
  }
};
