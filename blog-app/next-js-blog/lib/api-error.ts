type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

type ApiRequestErrorOptions = {
  status: number;
  retryAfterSeconds?: number;
  body?: ApiErrorBody | null;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;
  readonly body?: ApiErrorBody | null;

  constructor(message: string, options: ApiRequestErrorOptions) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.body = options.body;
  }
}

const getMessageFromBody = (body: ApiErrorBody | null): string | undefined => {
  if (!body) return undefined;

  if (typeof body.message === "string") {
    return body.message;
  }

  if (Array.isArray(body.message)) {
    const messages = body.message.filter(
      (message): message is string => typeof message === "string",
    );
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (typeof body.error === "string") {
    return body.error;
  }

  return undefined;
};

export function getRetryAfterSeconds(
  headers: Headers,
): number | undefined {
  const retryAfterHeader = headers.get("retry-after");
  if (!retryAfterHeader) {
    return undefined;
  }

  const seconds = Number(retryAfterHeader);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds;
  }

  const retryDate = Date.parse(retryAfterHeader);
  if (!Number.isNaN(retryDate)) {
    const diffSeconds = Math.ceil((retryDate - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : undefined;
  }

  return undefined;
}

export function formatRateLimitMessage(
  retryAfterSeconds?: number,
): string {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
    return `Too many requests. Please try again in ${retryAfterSeconds} seconds.`;
  }
  return "Too many requests. Please try again shortly.";
}

export async function toApiRequestError(
  response: Response,
  fallbackMessage: string,
): Promise<ApiRequestError> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const retryAfterSeconds = getRetryAfterSeconds(response.headers);
  const bodyMessage = getMessageFromBody(body);

  const message =
    response.status === 429
      ? formatRateLimitMessage(retryAfterSeconds)
      : bodyMessage || fallbackMessage;

  return new ApiRequestError(message, {
    status: response.status,
    retryAfterSeconds,
    body,
  });
}
