import { OpenApiResponseObject, OpenApiSchemaObject } from "./openapi";

export const errorEnvelopeSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["success", "error", "meta"],
  properties: {
    success: { type: "boolean", enum: [false] },
    error: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" },
        code: { type: "string" }
      }
    },
    meta: {
      type: "object",
      required: ["timestamp"],
      properties: {
        requestId: { type: "string" },
        timestamp: { type: "string", format: "date-time" }
      }
    }
  }
};

export const createErrorResponse = (description: string): OpenApiResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: errorEnvelopeSchema
    }
  }
});

export const commonErrorResponses = {
  "400": createErrorResponse("Bad Request"),
  "401": createErrorResponse("Unauthorized"),
  "403": createErrorResponse("Forbidden"),
  "404": createErrorResponse("Not Found"),
  "409": createErrorResponse("Conflict"),
  "429": createErrorResponse("Too Many Requests"),
  "500": createErrorResponse("Internal Server Error")
};
