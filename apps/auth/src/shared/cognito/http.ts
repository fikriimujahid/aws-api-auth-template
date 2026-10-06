import { mapCognitoErrorToHttp } from "./errors";
import type { CognitoErrorPayload } from "./types";

export const normalizeEndpoint = (endpoint: string): string => {
  if (endpoint.endsWith("/")) {
    return endpoint;
  }

  return `${endpoint}/`;
};

export const postToCognito = async <TResponse>(
  endpoint: string,
  target: string,
  payload: Record<string, unknown>,
  fetcher: typeof fetch = fetch
): Promise<TResponse> => {
  const response = await fetcher(normalizeEndpoint(endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": target
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & CognitoErrorPayload;

  if (!response.ok) {
    throw mapCognitoErrorToHttp(data);
  }

  return data;
};