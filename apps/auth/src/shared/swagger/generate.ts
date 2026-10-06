import { OpenApiDocument, OpenApiPathItem, createOpenApiDocument } from "./openapi";
import { bearerAuthScheme } from "./auth";

export interface BuildOpenApiOptions {
  title: string;
  version: string;
  description?: string;
  paths: Record<string, OpenApiPathItem>;
  pathPrefixToStrip?: string;
  servers?: OpenApiDocument["servers"];
  includeBearerAuth?: boolean;
  schemas?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
}

const normalizePathPrefix = (pathPrefix: string): string => {
  if (pathPrefix === "/") {
    return "/";
  }

  return pathPrefix.replace(/\/$/, "");
};

const stripPathPrefix = (pathName: string, pathPrefix: string): string => {
  const normalizedPrefix = normalizePathPrefix(pathPrefix);

  if (normalizedPrefix === "/") {
    return pathName;
  }

  if (pathName !== normalizedPrefix && !pathName.startsWith(`${normalizedPrefix}/`)) {
    throw new Error(`OpenAPI path \`${pathName}\` must start with \`${normalizedPrefix}\`.`);
  }

  const strippedPath = pathName.slice(normalizedPrefix.length);

  return strippedPath || "/";
};

const normalizePaths = (
  paths: Record<string, OpenApiPathItem>,
  pathPrefixToStrip?: string
): Record<string, OpenApiPathItem> => {
  if (!pathPrefixToStrip) {
    return paths;
  }

  const normalizedPaths: Record<string, OpenApiPathItem> = {};

  for (const [pathName, pathItem] of Object.entries(paths)) {
    const normalizedPath = stripPathPrefix(pathName, pathPrefixToStrip);

    if (normalizedPath in normalizedPaths) {
      throw new Error(`Duplicate OpenAPI path detected after stripping prefix: \`${normalizedPath}\`.`);
    }

    normalizedPaths[normalizedPath] = pathItem;
  }

  return normalizedPaths;
};

export const buildOpenApiDocument = (options: BuildOpenApiOptions): OpenApiDocument => {
  const document = createOpenApiDocument(
    {
      title: options.title,
      version: options.version,
      description: options.description
    },
    normalizePaths(options.paths, options.pathPrefixToStrip)
  );

  const components: NonNullable<OpenApiDocument["components"]> = {};

  if (options.schemas) {
    components.schemas = options.schemas as NonNullable<OpenApiDocument["components"]>["schemas"];
  }

  if (options.includeBearerAuth) {
    components.securitySchemes = { bearerAuth: bearerAuthScheme };
  }

  if (Object.keys(components).length > 0) {
    document.components = components;
  }

  if (options.tags && options.tags.length > 0) {
    document.tags = options.tags;
  }

  if (options.servers && options.servers.length > 0) {
    document.servers = options.servers;
  }

  return document;
};

export const generateOpenApiJson = (document: OpenApiDocument): string => {
  return JSON.stringify(document, null, 2);
};
