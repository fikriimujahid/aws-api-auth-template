import { OpenApiResponseObject, OpenApiSchemaObject } from "./openapi";

const jsonResponse = (description: string, schema: OpenApiSchemaObject): OpenApiResponseObject => ({
  description,
  content: {
    "application/json": {
      schema
    }
  }
});

export const successEnvelopeSchema = (dataSchema: OpenApiSchemaObject): OpenApiSchemaObject => ({
  type: "object",
  required: ["success", "data", "meta"],
  properties: {
    success: { type: "boolean", enum: [true] },
    data: dataSchema,
    meta: {
      type: "object",
      required: ["timestamp"],
      properties: {
        requestId: { type: "string" },
        timestamp: { type: "string", format: "date-time" }
      }
    }
  }
});

export const createOkResponse = (schema: OpenApiSchemaObject): OpenApiResponseObject =>
  jsonResponse("OK", successEnvelopeSchema(schema));

export const createCreatedResponse = (schema: OpenApiSchemaObject): OpenApiResponseObject =>
  jsonResponse("Created", successEnvelopeSchema(schema));

export const createNoContentResponse = (): OpenApiResponseObject => ({
  description: "No Content"
});
