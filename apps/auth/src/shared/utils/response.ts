export interface CorsOptions {
  allowedOrigin?: string;
  allowedHeaders?: string;
  allowedMethods?: string;
}

export interface HttpEventLike {
  headers: Record<string, string | undefined>;
  requestContext?: {
    requestId?: string;
  };
}

export interface HttpStructuredResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  cookies?: string[];
}

export interface JsonResponseOptions {
  cookies?: string[];
  cors?: CorsOptions;
}

export interface ErrorResponseOptions extends JsonResponseOptions {
  code?: string;
  exposeMessage?: boolean;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    message: string;
    code?: string;
  };
  meta: ResponseMeta;
}

const resolveAllowOrigin = (event: HttpEventLike, allowedOrigin?: string): string => {
  if (allowedOrigin && allowedOrigin.trim()) {
    return allowedOrigin.trim();
  }

  const requestOrigin = event.headers.origin ?? event.headers.Origin;
  if (requestOrigin && requestOrigin.trim()) {
    return requestOrigin;
  }

  return "*";
};

const buildResponseMeta = (event: HttpEventLike): ResponseMeta => ({
  requestId: event.requestContext?.requestId,
  timestamp: new Date().toISOString()
});

const sanitizeErrorMessage = (
  statusCode: number,
  message: string,
  exposeMessage: boolean
): string => {
  if (statusCode >= 500 && !exposeMessage) {
    return "Internal server error";
  }

  return message;
};

export const buildCorsHeaders = (
  event: HttpEventLike,
  options: CorsOptions = {}
): Record<string, string> => {
  const allowOrigin = resolveAllowOrigin(event, options.allowedOrigin);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
    pragma: "no-cache",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": options.allowedHeaders ?? "content-type,authorization",
    "access-control-allow-methods": options.allowedMethods ?? "OPTIONS,GET,POST"
  };

  if (allowOrigin !== "*") {
    headers["access-control-allow-credentials"] = "true";
    headers.vary = "Origin";
  }

  return headers;
};

export const jsonResponse = (
  event: HttpEventLike,
  statusCode: number,
  body: unknown,
  options: JsonResponseOptions = {}
): HttpStructuredResponse => {
  const response: HttpStructuredResponse = {
    statusCode,
    headers: buildCorsHeaders(event, options.cors),
    body: JSON.stringify(body)
  };

  if (options.cookies && options.cookies.length > 0) {
    response.cookies = options.cookies;
  }

  return response;
};

export const createSuccessResponse = (
  event: HttpEventLike,
  statusCode: number,
  body: unknown,
  options: JsonResponseOptions = {}
): HttpStructuredResponse => {
  const payload: SuccessEnvelope<unknown> = {
    success: true,
    data: body,
    meta: buildResponseMeta(event)
  };

  return jsonResponse(event, statusCode, payload, options);
};

export const createErrorResponse = (
  event: HttpEventLike,
  statusCode: number,
  message: string,
  options: ErrorResponseOptions = {}
): HttpStructuredResponse => {
  const { code, exposeMessage = false, ...responseOptions } = options;
  const body: ErrorEnvelope = {
    success: false,
    error: {
      message: sanitizeErrorMessage(statusCode, message, exposeMessage),
      ...(code ? { code } : {})
    },
    meta: buildResponseMeta(event)
  };

  return jsonResponse(event, statusCode, body, responseOptions);
};

export const optionsResponse = (
  event: HttpEventLike,
  options: JsonResponseOptions = {}
): HttpStructuredResponse => {
  const response: HttpStructuredResponse = {
    statusCode: 204,
    headers: buildCorsHeaders(event, options.cors),
    body: ""
  };

  if (options.cookies && options.cookies.length > 0) {
    response.cookies = options.cookies;
  }

  return response;
};
