import { Logger, LoggerContext } from "./logger";

export interface RequestLifecycleContext extends LoggerContext {
  requestId?: string;
  routeKey?: string;
  method?: string;
}

export interface ResponseLike {
  statusCode?: number;
  body?: string;
}

interface ErrorEnvelopeLike {
  success?: boolean;
  error?: {
    code?: unknown;
  };
}

export const extractErrorCodeFromResponse = (response: ResponseLike): string | undefined => {
  if (!response.body) {
    return undefined;
  }

  try {
    const payload = JSON.parse(response.body) as ErrorEnvelopeLike;

    if (payload.success === false && typeof payload.error?.code === "string") {
      return payload.error.code;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export const logRequestReceived = (
  logger: Logger,
  context: RequestLifecycleContext
): void => {
  logger.info("request.received", context);
};

export const logRequestResult = <TResponse extends ResponseLike>(
  logger: Logger,
  context: RequestLifecycleContext,
  response: TResponse
): TResponse => {
  const statusCode = response.statusCode ?? 200;
  const logContext = {
    ...context,
    statusCode
  };

  if (statusCode >= 400) {
    logger.error("request.failed", {
      ...logContext,
      errorCode: extractErrorCodeFromResponse(response)
    });

    return response;
  }

  logger.info("request.succeeded", logContext);
  return response;
};