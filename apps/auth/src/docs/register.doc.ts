import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { codeDeliveryDetailsSchema } from "./schemas";

export const registerDocPath = "/api/auth/register";

export const registerDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Register a new account",
    tags: ["Auth"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["fullName", "email", "password"],
            properties: {
              fullName: { type: "string" },
              email: { type: "string", format: "email" },
              password: { type: "string" }
            }
          }
        }
      }
    },
    responses: {
      "200": createOkResponse({
        type: "object",
        required: ["userConfirmed"],
        properties: {
          userConfirmed: { type: "boolean" },
          codeDeliveryDetails: {
            oneOf: [codeDeliveryDetailsSchema, { type: "null" }]
          }
        }
      }),
      ...commonErrorResponses
    }
  }
};
