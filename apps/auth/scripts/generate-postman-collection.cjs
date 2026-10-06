const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const rootDir = path.resolve(__dirname, "..");
const openApiPath = path.resolve(rootDir, "openapi", "swagger.json");
const outputPath = path.resolve(rootDir, "openapi", "postman-collection.json");

if (!fs.existsSync(openApiPath)) {
  console.error("Combined swagger.json not found.");
  console.error("Run: npm run swagger:all:only");
  process.exit(1);
}

const openApiDocument = JSON.parse(fs.readFileSync(openApiPath, "utf8"));
const httpMethods = ["get", "post", "put", "patch", "delete", "options", "head"];

const ensureLeadingSlash = (value) => (value.startsWith("/") ? value : `/${value}`);

const toFolderName = (serverVariableName, serverDescription) => {
  if (serverDescription) {
    return serverDescription.replace(/\s+base url$/i, "").trim();
  }

  return serverVariableName
    .replace(/BaseUrl$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
};

const firstNonNullSchema = (schemaList) => {
  for (const schema of schemaList || []) {
    if (schema?.type !== "null") {
      return schema;
    }
  }

  return schemaList?.[0];
};

const buildExampleFromSchema = (schema) => {
  if (!schema) {
    return {};
  }

  if (schema.oneOf) {
    return buildExampleFromSchema(firstNonNullSchema(schema.oneOf));
  }

  if (schema.allOf) {
    return Object.assign({}, ...schema.allOf.map((entry) => buildExampleFromSchema(entry)));
  }

  if (schema.$ref) {
    return {};
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  switch (schema.type) {
    case "object": {
      const example = {};
      const properties = schema.properties || {};

      for (const propertyName of schema.required || Object.keys(properties)) {
        if (!(propertyName in properties)) {
          continue;
        }

        example[propertyName] = buildExampleFromSchema(properties[propertyName]);
      }

      return example;
    }
    case "array":
      return [buildExampleFromSchema(schema.items)];
    case "string":
      if (schema.format === "email") {
        return "user@example.com";
      }

      if (schema.format === "date-time") {
        return new Date(0).toISOString();
      }

      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "null":
      return null;
    default:
      return {};
  }
};

const buildJsonRequestBody = (operation) => {
  const requestSchema = operation.requestBody?.content?.["application/json"]?.schema;

  if (!requestSchema) {
    return undefined;
  }

  return {
    mode: "raw",
    raw: JSON.stringify(buildExampleFromSchema(requestSchema), null, 2),
    options: {
      raw: {
        language: "json"
      }
    }
  };
};

const deriveVariableNameFromDescription = (description) => {
  if (!description) {
    return "baseUrl";
  }

  const words = description
    .replace(/\s+base url$/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "baseUrl";
  }

  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("") +
    "BaseUrl"
  );
};

const extractServerConfig = (pathItem, topLevelServers) => {
  const server = pathItem.servers?.[0] || topLevelServers?.[0];

  if (!server) {
    return {
      variableName: "baseUrl",
      description: "Base URL",
      defaultValue: ""
    };
  }

  const variableKeys = Object.keys(server.variables || {});

  if (variableKeys.length > 0) {
    const serverVariableName = variableKeys[0];
    return {
      variableName: serverVariableName,
      description: server.description,
      defaultValue: server.variables[serverVariableName]?.default || ""
    };
  }

  const variableName = deriveVariableNameFromDescription(server.description);

  return {
    variableName,
    description: server.description,
    defaultValue: server.url || ""
  };
};

const createPostmanRequest = (pathName, method, operation, serverConfig) => {
  const headers = [];
  const body = buildJsonRequestBody(operation);

  if (body) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }

  const request = {
    method: method.toUpperCase(),
    header: headers,
    url: `{{${serverConfig.variableName}}}${ensureLeadingSlash(pathName)}`
  };

  if (body) {
    request.body = body;
  }

  if ((operation.security || []).some((entry) => Object.prototype.hasOwnProperty.call(entry, "bearerAuth"))) {
    request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }]
    };
  }

  return {
    name: operation.summary || `${method.toUpperCase()} ${pathName}`,
    request,
    response: []
  };
};

const foldersByVariableName = new Map();
const collectionVariables = new Map();

for (const server of openApiDocument.servers || []) {
  for (const [variableName, definition] of Object.entries(server.variables || {})) {
    collectionVariables.set(variableName, {
      key: variableName,
      value: definition.default || "",
      type: "string",
      description: definition.description || server.description || ""
    });
  }
}

for (const [pathName, pathItem] of Object.entries(openApiDocument.paths || {})) {
  const serverConfig = extractServerConfig(pathItem, openApiDocument.servers);

  if (!foldersByVariableName.has(serverConfig.variableName)) {
    foldersByVariableName.set(serverConfig.variableName, {
      name: toFolderName(serverConfig.variableName, serverConfig.description),
      item: []
    });
  }

  collectionVariables.set(serverConfig.variableName, {
    key: serverConfig.variableName,
    value: serverConfig.defaultValue,
    type: "string",
    description: serverConfig.description || `${serverConfig.variableName} base URL`
  });

  for (const method of httpMethods) {
    const operation = pathItem[method];

    if (!operation) {
      continue;
    }

    foldersByVariableName
      .get(serverConfig.variableName)
      .item.push(createPostmanRequest(pathName, method, operation, serverConfig));
  }
}

if (!collectionVariables.has("accessToken")) {
  collectionVariables.set("accessToken", {
    key: "accessToken",
    value: "",
    type: "string",
    description: "Bearer token used by secured requests"
  });
}

const collection = {
  info: {
    _postman_id: crypto.randomUUID(),
    name: `${openApiDocument.info?.title || "API"} (Generated)` ,
    description: "Generated from backend/openapi/swagger.json with per-service collection variables.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: Array.from(foldersByVariableName.values()),
  variable: Array.from(collectionVariables.values())
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf8");

console.log(`Generated: ${path.relative(rootDir, outputPath)}`);
console.log(
  `Collection variables: ${Array.from(collectionVariables.keys()).join(", ")}`
);