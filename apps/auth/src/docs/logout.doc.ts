import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";

export const logoutDocPath = "/api/auth/logout";

export const logoutDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Logout current session and clear refresh cookie",
    tags: ["Auth"],
    responses: {
      "200": createOkResponse({
        type: "object",
        required: ["loggedOut"],
        properties: {
          loggedOut: { type: "boolean", enum: [true] }
        }
      })
    }
  }
};
