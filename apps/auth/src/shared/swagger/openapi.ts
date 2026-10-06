export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiServerObject {
  url: string;
  description?: string;
  variables?: Record<string, OpenApiServerVariableObject>;
}

export interface OpenApiServerVariableObject {
  default: string;
  description?: string;
  enum?: string[];
}

export interface OpenApiSchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, OpenApiSchemaObject>;
  required?: string[];
  items?: OpenApiSchemaObject;
  enum?: Array<string | number | boolean>;
  additionalProperties?: boolean | OpenApiSchemaObject;
  oneOf?: OpenApiSchemaObject[];
  allOf?: OpenApiSchemaObject[];
  $ref?: string;
}

export interface OpenApiResponseObject {
  description: string;
  content?: {
    "application/json"?: {
      schema: OpenApiSchemaObject;
    };
  };
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  requestBody?: {
    required?: boolean;
    content: {
      "application/json": {
        schema: OpenApiSchemaObject;
      };
    };
  };
  responses: Record<string, OpenApiResponseObject>;
}

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>> & {
  servers?: OpenApiServerObject[];
};

export interface OpenApiDocument {
  openapi: "3.0.3";
  info: OpenApiInfo;
  paths: Record<string, OpenApiPathItem>;
  servers?: OpenApiServerObject[];
  components?: {
    schemas?: Record<string, OpenApiSchemaObject>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

export const createOpenApiDocument = (
  info: OpenApiInfo,
  paths: Record<string, OpenApiPathItem>
): OpenApiDocument => ({
  openapi: "3.0.3",
  info,
  paths
});
