import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { confirmForgotPasswordDocPath, confirmForgotPasswordDocPathItem } from "./confirmForgotPassword.doc";
import { forgotPasswordDocPath, forgotPasswordDocPathItem } from "./forgotPassword.doc";
import { loginDocPath, loginDocPathItem } from "./login.doc";
import { logoutDocPath, logoutDocPathItem } from "./logout.doc";
import { refreshDocPath, refreshDocPathItem } from "./refresh.doc";
import { registerDocPath, registerDocPathItem } from "./register.doc";
import { sessionDocPath, sessionDocPathItem } from "./session.doc";

export const authServicePaths: Record<string, OpenApiPathItem> = {
  [loginDocPath]: loginDocPathItem,
  [registerDocPath]: registerDocPathItem,
  [forgotPasswordDocPath]: forgotPasswordDocPathItem,
  [confirmForgotPasswordDocPath]: confirmForgotPasswordDocPathItem,
  [refreshDocPath]: refreshDocPathItem,
  [logoutDocPath]: logoutDocPathItem,
  [sessionDocPath]: sessionDocPathItem
};

const authServiceLocalBaseUrl = "http://localhost:3004";

export const buildAuthServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Auth Service API",
    version: "1.0.0",
    description: "Auth endpoints for KeJepangDulu",
    servers: [
      {
        url: "{authServiceBaseUrl}",
        description: "Auth service base URL",
        variables: {
          authServiceBaseUrl: {
            default: authServiceLocalBaseUrl,
            description: "Auth service local base URL"
          }
        }
      }
    ],
    includeBearerAuth: true,
    tags: [{ name: "Auth", description: "Authentication operations" }],
    paths: authServicePaths
  });
};

export const generateAuthServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildAuthServiceOpenApi());
};
