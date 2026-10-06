import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { codeDeliveryDetailsSchema } from "./schemas";

export const forgotPasswordDocPath = "/api/auth/forgot-password";

export const forgotPasswordDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Request password reset code",
    tags: ["Auth"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: { type: "string", format: "email" }
            }
          }
        }
      }
    },
    responses: {
      "200": createOkResponse({
        type: "object",
        required: ["codeDeliveryDetails"],
        properties: {
          codeDeliveryDetails: {
            oneOf: [codeDeliveryDetailsSchema, { type: "null" }]
          }
        }
      }),
      ...commonErrorResponses
    }
  }
};
