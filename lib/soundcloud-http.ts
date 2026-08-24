import "server-only";

/**
 * Shared HTTP helper for SoundCloud requests with bounded retry on 429.
 *
 * Per the API guide
 * (https://developers.soundcloud.com/docs/api/guide#rate-limits and
 *  https://developers.soundcloud.com/docs/api/rate-limits), responses with
 * HTTP 429 indicate the caller exceeded a rate limit and must back off. We
 * honor the `Retry-After` header when present (either delta-seconds or an
 * HTTP-date), and otherwise use a capped exponential backoff with jitter.
 *
 * Retries are strictly bounded — we will not loop indefinitely on 429.
 */

export type FetchWithRetryOptions = {
  /** Maximum number of retries on retryable statuses. Default: 3. */
  maxRetries?: number;
  /** Initial backoff in ms (doubles each attempt). Default: 500. */
  baseDelayMs?: number;
  /** Hard cap on total wait time across all retries. Default: 10_000. */
  maxTotalWaitMs?: number;
  /**
   * Status codes that trigger a retry. Default: [429]. 5xx is left to the
   * caller; in our app a 5xx just means we fall back to the public hydration
   * scrape, which is the desired behavior.
   */
  retryableStatuses?: number[];
  /**
   * Abort each attempt after this many ms. A fresh signal is created per
   * attempt so a timeout on try 1 does not poison retries. 0 disables.
   */
  timeoutMs?: number;
};

const DEFAULT_OPTS: Required<FetchWithRetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxTotalWaitMs: 10_000,
  retryableStatuses: [429],
  timeoutMs: 0,
};

/**
 * Parse a `Retry-After` header value (either an integer number of seconds or
 * an HTTP-date) into milliseconds. Returns `null` if the header is missing
 * or unparseable, so the caller falls back to exponential backoff.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number.parseInt(trimmed, 10);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    return null;
  }
  const date = Date.parse(trimmed);
  if (Number.isFinite(date)) {
    const delta = date - Date.now();
    return delta > 0 ? delta : 0;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BODY_LOG_LIMIT = 300;

const REDACTED_QUERY_KEYS = new Set([
  "client_id",
  "client_secret",
  "access_token",
  "code",
  "code_verifier",
  "refresh_token",
]);

/** Path + query only — never the origin, and never request headers/bodies. */
export function soundcloudPathOf(
  input: Parameters<typeof fetch>[0],
): string {
  try {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (REDACTED_QUERY_KEYS.has(key)) url.searchParams.set(key, "[redacted]");
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return "request";
  }
}

function compact(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value;
  }
  return out;
}

/**
 * Structured SoundCloud log line. Always emits in production — the previous
 * helper swallowed retries outside of development, which is exactly when we
 * needed them. Never pass tokens, secrets, or comment bodies in `fields`.
 */
export function logSoundcloud(
  level: "warn" | "error",
  event: string,
  fields: Record<string, unknown> = {},
): void {
  console[level](`[soundcloud] ${event}`, compact(fields));
}

export type SoundcloudErrorBody = {
  message?: string;
  body?: string;
};

/**
 * Read a failed SoundCloud response for logs and for mapping. Keeps a short
 * raw snippet even when the body is HTML or otherwise not JSON — a 502 from
 * their gateway is often unparseable, and dropping it left us blind.
 */
export async function readSoundcloudErrorBody(
  res: Response,
): Promise<SoundcloudErrorBody> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    return {};
  }
  if (!text) return {};

  const body = text.replace(/\s+/g, " ").trim().slice(0, BODY_LOG_LIMIT);

  try {
    const parsed = JSON.parse(text) as {
      errors?: { error_message?: string; message?: string }[];
      error?: unknown;
      error_description?: unknown;
      message?: unknown;
    };
    const errorCode = typeof parsed.error === "string" ? parsed.error : undefined;
    const description =
      typeof parsed.error_description === "string"
        ? parsed.error_description
        : undefined;
    const message =
      parsed.errors?.[0]?.error_message ??
      parsed.errors?.[0]?.message ??
      (errorCode && description ? `${errorCode}: ${description}` : undefined) ??
      description ??
      errorCode ??
      (typeof parsed.message === "string" ? parsed.message : undefined);
    return compact({ message, body }) as SoundcloudErrorBody;
  } catch {
    return { body };
  }
}

export function soundcloudResponseMeta(res: Response): Record<string, unknown> {
  return compact({
    status: res.status,
    contentType: res.headers.get("content-type"),
    retryAfter: res.headers.get("retry-after"),
    requestId:
      res.headers.get("x-request-id") ?? res.headers.get("x-amzn-requestid"),
  });
}

/**
 * `fetch` wrapper that retries on retryable status codes with bounded
 * exponential backoff. All other responses (including 4xx that aren't in
 * `retryableStatuses`) are returned as-is to the caller. Network errors
 * propagate up.
 */
export async function fetchWithRetry(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = undefined,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const opts = { ...DEFAULT_OPTS, ...options };
  let totalWaited = 0;
  let attempt = 0;
  const path = soundcloudPathOf(input);
  const method = (init?.method ?? "GET").toUpperCase();

  for (;;) {
    const signal =
      opts.timeoutMs > 0 ? AbortSignal.timeout(opts.timeoutMs) : init?.signal;
    const res = await fetch(input, { ...init, signal });
    if (!opts.retryableStatuses.includes(res.status)) return res;
    if (attempt >= opts.maxRetries) {
      logSoundcloud("warn", "retries exhausted", {
        method,
        path,
        ...soundcloudResponseMeta(res),
        attempts: attempt + 1,
      });
      return res;
    }

    const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
    // Exponential backoff with mild jitter (±20%) to avoid thundering-herd.
    const exponential = opts.baseDelayMs * Math.pow(2, attempt);
    const jitter = exponential * (0.8 + Math.random() * 0.4);
    const fallbackMs = Math.floor(jitter);
    const waitMs = retryAfterMs ?? fallbackMs;

    const remaining = opts.maxTotalWaitMs - totalWaited;
    if (remaining <= 0) {
      logSoundcloud("warn", "retries exhausted", {
        method,
        path,
        ...soundcloudResponseMeta(res),
        attempts: attempt + 1,
        reason: "max-wait",
      });
      return res;
    }
    const effectiveWait = Math.min(waitMs, remaining);

    logSoundcloud("warn", "retrying", {
      method,
      path,
      ...soundcloudResponseMeta(res),
      waitMs: effectiveWait,
      attempt: attempt + 1,
      maxRetries: opts.maxRetries,
    });

    await sleep(effectiveWait);
    totalWaited += effectiveWait;
    attempt += 1;
  }
}
