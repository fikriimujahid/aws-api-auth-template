import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";

export const confirmForgotPasswordDocPath = "/api/auth/forgot-password/confirm";

export const confirmForgotPasswordDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Confirm password reset with verification code",
    tags: ["Auth"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "code", "newPassword"],
            properties: {
              email: { type: "string", format: "email" },
              code: { type: "string" },
              newPassword: { type: "string" }
            }
          }
        }
      }
    },
    responses: {
      "200": createOkResponse({
        type: "object",
        required: ["passwordResetConfirmed"],
        properties: {
          passwordResetConfirmed: { type: "boolean", enum: [true] }
        }
      }),
      ...commonErrorResponses
    }
  }
};
