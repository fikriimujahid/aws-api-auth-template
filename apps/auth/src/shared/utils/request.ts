import { APIGatewayProxyEventV2 } from "aws-lambda";

export const parseEventBody = (event: APIGatewayProxyEventV2): Record<string, unknown> => {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(rawBody) as Record<string, unknown>;
};
