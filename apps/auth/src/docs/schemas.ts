import { OpenApiSchemaObject } from "@shared-swagger/openapi";

export const authUserSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["id", "email", "name"],
  properties: {
    id: { type: "string" },
    email: { type: "string", format: "email" },
    name: { type: "string" }
  }
};

export const authSessionSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["accessToken", "idToken", "user"],
  properties: {
    accessToken: { type: "string" },
    idToken: { type: "string" },
    expiresIn: { type: "number" },
    tokenType: { type: "string" },
    user: authUserSchema
  }
};

export const codeDeliveryDetailsSchema: OpenApiSchemaObject = {
  type: "object",
  properties: {
    attributeName: { type: "string" },
    deliveryMedium: { type: "string" },
    destination: { type: "string" }
  }
};
